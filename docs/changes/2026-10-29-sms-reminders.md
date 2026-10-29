# 2026-10-29 - SMS reminders on every plan

## What changed

Users can now opt in to the same task reminder by SMS, in addition to email.
The setting lives in **Settings -> Account -> SMS reminders** and is available on
both plans (`FREE` and `PRO`). Because the mobile app loads the production site
inside its WebView, the screen appears in the installed app as soon as the web
deploy is live: no new Capacitor plugin, no SMS permission, no APK rebuild.

Sending happens on the server in the existing daily cron, so it works with the
app closed.

## How delivery works (and why it is free)

There is no such thing as free, unlimited SMS from a server. This feature uses
the only genuinely zero-cost route: the **carrier email-to-SMS gateways**. A
message sent to `<number>@<carrier-gateway>` is delivered as an SMS, and the app
already has an SMTP account for reminder email. That means:

- no provider account, no per-message fee, no new dependency;
- coverage is mostly US and Canadian carriers (most others retired their
  gateways years ago);
- delivery is best-effort - operators throttle or silently drop messages - so
  SMS is a second channel next to email, never a replacement;
- only short plain-text messages (the body is capped at 160 characters).

`SMS_PROVIDER` selects the transport:

| Value | Behaviour |
| --- | --- |
| `email-gateway` (default) | Sends through SMTP to the carrier bridge. Requires the SMTP variables that email already uses. |
| `console` | Prints the message to the server log and records it as `LOGGED`. Useful locally or when SMTP is not configured. |

A real provider (Twilio, etc.) can be added later as one branch in
`lib/sms/sendSms.ts`; nothing else in the feature changes.

## Data model

| Field / table | Purpose |
| --- | --- |
| `User.phoneNumber` | E.164 number, e.g. `+14155550123`. |
| `User.phoneCarrier` | Carrier **id** from `lib/sms/carriers.ts`, not a domain. |
| `User.smsReminders` | Opt-in flag. |
| `SmsNotification` | Per-send audit log: user, optional task, type, status (`SENT` / `FAILED` / `LOGGED`), provider, error, timestamps. |

The carrier id is resolved to a gateway domain on the server, so a user cannot
store an arbitrary domain and turn the shared SMTP account into an open relay.

## Behaviour

| Situation | Result |
| --- | --- |
| Reminder fires, SMS off | Email only (unchanged). |
| Reminder fires, SMS on | Email **and** SMS; each has its own log row. |
| Email throws | SMS still goes out. |
| SMS throws or gateway rejects | Email is unaffected; the failure is logged. |
| Same reminder already emailed today | SMS is skipped too (email log dedupes the occurrence). |
| More than 20 SMS in a day | Remaining reminders for that user are skipped and logged. |
| Test message | One per minute, ten per day, to the saved number only. |
| Number outside `+1` | Rejected with a clear message; the free gateways are North American. |

## Files

| File | Change |
| --- | --- |
| `prisma/schema.prisma`, `prisma/migrations/20261029000000_add_sms_reminders/` | New user columns, `sms_notification` table, and a JSONB backfill adding `smsNotifications: true` to both plans. |
| `lib/sms/carriers.ts` | Carrier catalogue, E.164 normalisation, gateway-address builder. |
| `lib/sms/sendSms.ts` | Transport switch (`email-gateway` / `console`); never throws. |
| `lib/sms/messages.ts` | 160-character reminder and test bodies with a link back to the app. |
| `lib/sms/constants.ts` | Daily and test rate limits. |
| `lib/emails/sendEmail.ts` | `sendPlainEmail()` over the existing transport. |
| `app/action/sms.ts` | Load/save settings, send a test message, rate limiting. |
| `components/user/sms-settings.tsx` | Settings card: number, carrier, opt-in, save, test. |
| `app/settings/page.tsx` | Renders the card in the Account tab. |
| `app/api/cron/email-reminders/route.ts` | Sends SMS independently of email, with a per-user daily budget. |
| `prisma/seed.ts`, `app/api/subscription/plans/route.ts`, `components/shared/subs-plan.tsx` | `smsNotifications: true` on FREE and PRO, and the plan bullet. |
| `.env.example` | Documents `SMS_PROVIDER`. |

## Verification

1. Settings -> Account: enter a US/Canada number, pick the carrier, enable SMS,
   save, then **Send test message**. The phone should receive it within a
   minute; a second click inside a minute is refused.
2. Create a task due tomorrow (FREE) or with a custom reminder today (PRO) and
   run the cron with `Authorization: Bearer $CRON_SECRET`; the phone receives
   the reminder alongside the email and the app shows the task.
3. Check `sms_notification` for `SENT` rows; a bad gateway shows `FAILED` with
   the SMTP error.
4. With `SMS_PROVIDER=console`, the same flow logs `[sms:console] ...` and
   records `LOGGED`.
