# 2026-11-02 - TextBee transport for SMS reminders

## Why

The default `email-gateway` transport is free but only covers the US and
Canada; Philippine carriers retired their email-to-SMS bridges. TextBee is an
open-source (MIT) Android gateway: a phone you control sends the message from
its own SIM, so any number that SIM's carrier can reach works - including
`+63` Globe, Smart and DITO numbers.

## How it works

```
Remindly cron -> HTTPS -> TextBee API -> push to the gateway phone -> SIM -> SMS
```

- The hosted service is `https://api.textbee.dev`; self-hosting is supported
  and uses the same API shape.
- The phone needs internet (Wi-Fi is enough) and **SMS load or an unli-text
  promo**. No load means the carrier rejects the send; TextBee reports it and
  the reminder is logged as `FAILED`. Receiving SMS is free, and recipients do
  not need load.
- The sender is the gateway SIM's own number, not a shortcode.
- The Android app is sideloaded (SMS permissions keep it off the Play Store).

## Remindly changes

| File | Change |
| --- | --- |
| `lib/sms/sendSms.ts` | Third transport, `textbee`: `POST` to the configured endpoint with `x-api-key`, 15s timeout, non-2xx and network errors returned as `FAILED`. No new dependency. |
| `app/action/sms.ts` | Carrier and `+1` rules apply only to `email-gateway`; TextBee accepts any E.164 number and stores no carrier. |
| `components/user/sms-settings.tsx` | Carrier picker and US/Canada copy hidden for TextBee; shows the PH placeholder, gateway-SIM note, and a warning when the API key is missing. |
| `app/api/cron/email-reminders/route.ts` | SMS does not require a carrier when the transport is not `email-gateway`. |
| `.env.example` | `TEXTBEE_API_KEY`, `TEXTBEE_API_URL`. |

Env:

```env
SMS_PROVIDER=textbee
TEXTBEE_API_KEY=...
TEXTBEE_API_URL=https://api.textbee.dev/api/v1/gateway/send-sms
```

`TEXTBEE_API_URL` is the full send endpoint, so a self-hosted instance only
changes this value.

## Setup (one-time)

1. Create an account at <https://textbee.dev> (free plan) - or self-host.
2. Install the Android app from <https://textbee.dev/download> on a spare phone
   with the PH SIM. Grant SMS permissions.
3. In the dashboard, **Add device**, then scan the QR code with the app. This
   registers the phone and creates an API key.
4. Put the key in the deployment env as `TEXTBEE_API_KEY`, set
   `SMS_PROVIDER=textbee`, and redeploy.
5. On the phone: disable battery optimisation for the app, allow autostart, and
   keep it on Wi-Fi/charger. Test from the TextBee dashboard first.
6. In Remindly: Settings -> Account -> SMS reminders, enter a number, enable,
   save, **Send test message**.

## Limits and caveats

- Phone must be online and the SIM must have SMS credit/promo; otherwise the
  send fails and is logged.
- Carriers apply anti-spam rate limits; the existing 20/day per-user cap and
  once-a-day reminder dedupe stay in place.
- Hosted TextBee has a free quota; self-hosting removes it.
- Android only (iOS cannot send SMS programmatically).

## Verification

- `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Local smoke test against a mock HTTP server: correct endpoint, `x-api-key`
  header and `{ recipients, message }` body; 201 -> `SENT`; missing key and 401
  -> `FAILED` with a readable error.
- Production: set the env vars, send a test message to a PH number, then confirm
  the `sms_notification` row is `SENT`.
