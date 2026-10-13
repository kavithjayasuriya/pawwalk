/** Operating hours — Melbourne local time */
export const OPERATING_HOURS = {
  start: '08:00',
  end: '18:00',
} as const;

/** Slot boundary interval in minutes */
export const SLOT_INTERVAL_MINUTES = 30;

/** Maximum dogs per booking */
export const MAX_DOGS_PER_BOOKING = 2;

/** Second dog surcharge in cents */
export const SECOND_DOG_FEE_CENTS = 1000;

/** Maximum advance booking days */
export const MAX_ADVANCE_DAYS = 14;

/** Business timezone */
export const BUSINESS_TIMEZONE = 'Australia/Melbourne';