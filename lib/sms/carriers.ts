/**
 * Email-to-SMS gateways.
 *
 * Several carriers still accept a plain email addressed to
 * `<number>@<gateway-domain>` and deliver it as an SMS. Using the SMTP account
 * the app already has means sending costs nothing and needs no provider
 * account or package.
 *
 * Trade-offs, deliberately surfaced in the UI:
 * - Coverage is mostly the US and Canada; most carriers elsewhere shut these
 *   gateways down years ago.
 * - Delivery is best-effort: operators quietly drop or throttle messages, so
 *   this is a second channel next to email, never a replacement.
 * - Only short plain-text messages are supported (the subject is dropped).
 *
 * The carrier id - not the domain - is what goes in the database, so a user
 * cannot point the SMTP server at an arbitrary domain.
 */
export interface SmsCarrier {
  id: string;
  label: string;
  /** ISO country code, used to group the picker. */
  country: "US" | "CA";
  domain: string;
}

export const SMS_CARRIERS: readonly SmsCarrier[] = [
  // United States
  { id: "att", label: "AT&T", country: "US", domain: "txt.att.net" },
  { id: "verizon", label: "Verizon", country: "US", domain: "vtext.com" },
  { id: "tmobile", label: "T-Mobile", country: "US", domain: "tmomail.net" },
  { id: "sprint", label: "Sprint", country: "US", domain: "messaging.sprintpcs.com" },
  { id: "boost", label: "Boost Mobile", country: "US", domain: "sms.myboostmobile.com" },
  { id: "cricket", label: "Cricket Wireless", country: "US", domain: "sms.cricketwireless.net" },
  { id: "metro", label: "Metro by T-Mobile", country: "US", domain: "mymetropcs.com" },
  { id: "uscellular", label: "US Cellular", country: "US", domain: "email.uscc.net" },
  { id: "googlefi", label: "Google Fi", country: "US", domain: "msg.fi.google.com" },
  { id: "mint", label: "Mint Mobile", country: "US", domain: "tmomail.net" },
  { id: "visible", label: "Visible", country: "US", domain: "vtext.com" },
  { id: "consumercellular", label: "Consumer Cellular", country: "US", domain: "mailmymobile.net" },
  // Canada
  { id: "rogers", label: "Rogers", country: "CA", domain: "pcs.rogers.com" },
  { id: "bell", label: "Bell", country: "CA", domain: "txt.bell.ca" },
  { id: "telus", label: "TELUS", country: "CA", domain: "msg.telus.com" },
  { id: "fido", label: "Fido", country: "CA", domain: "fido.ca" },
  { id: "koodo", label: "Koodo", country: "CA", domain: "msg.koodomobile.com" },
  { id: "freedom", label: "Freedom Mobile", country: "CA", domain: "txt.freedommobile.ca" },
  { id: "virginplus", label: "Virgin Plus", country: "CA", domain: "vmobile.ca" },
];

const CARRIERS_BY_ID = new Map(SMS_CARRIERS.map((carrier) => [carrier.id, carrier]));

export const SMS_CARRIER_COUNTRIES: ReadonlyArray<{ code: SmsCarrier["country"]; label: string }> = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
];

export function getSmsCarrier(carrierId: string | null | undefined): SmsCarrier | null {
  if (!carrierId) return null;
  return CARRIERS_BY_ID.get(carrierId) ?? null;
}

/**
 * Normalise a phone number to E.164, or return null when it is not valid.
 *
 * Spaces, dashes, dots and parentheses are stripped; a leading `+` is
 * required so the country code is never guessed.
 */
export function normalizePhoneNumber(input: string): string | null {
  const compact = input.replace(/[\s\-().]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(compact) ? compact : null;
}

/**
 * Build the gateway address for a number and carrier.
 *
 * Returns null when the carrier is unknown, the number is invalid, or the
 * number is not North American. Every carrier in the catalogue exposes a
 * `+1` gateway; anything else would silently go nowhere.
 */
export function toGatewayAddress(
  phoneNumber: string,
  carrierId: string | null | undefined,
): string | null {
  const carrier = getSmsCarrier(carrierId);
  if (!carrier) return null;

  const normalized = normalizePhoneNumber(phoneNumber);
  if (!normalized || !normalized.startsWith("+1")) return null;

  return `${normalized.slice(1)}@${carrier.domain}`;
}
