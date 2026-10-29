/** Per-user SMS caps. Also used by the cron and the settings UI copy. */
export const SMS_DAILY_LIMIT = 20;

/** Test messages are rate limited separately from reminder messages. */
export const SMS_TEST_DAILY_LIMIT = 10;
export const SMS_TEST_COOLDOWN_MS = 60_000;
