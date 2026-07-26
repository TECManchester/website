import { church } from "@/lib/church";

/**
 * Gift Aid declaration wording.
 *
 * This follows HMRC's model declaration for enduring/regular giving. Do not
 * reword the DECLARATION_STATEMENT casually — a declaration is only valid if it
 * contains the taxpayer confirmation and the responsibility-to-pay-the-
 * difference statement. If it does change, bump DECLARATION_VERSION: every
 * submission stores the exact text agreed to, so an HMRC audit can show what
 * each donor actually saw.
 *
 * Source: HMRC model wording (in force for declarations made after 6 April
 * 2016), as reproduced in the Church of England's Parish Resources
 * "Gift Aid Declarations" guide v4a.
 */
export const DECLARATION_VERSION = "hmrc-2016-enduring-v1";

export const DECLARATION_STATEMENT = `Please treat as Gift Aid donations all qualifying gifts of money made from the date of this declaration and in the past four years. I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year it is my responsibility to pay any difference.`;

export const DECLARATION_NOTES = [
  {
    heading: "Please tell us if you",
    items: [
      "want to cancel this declaration",
      "change your name or home address",
      "no longer pay sufficient tax on your income and/or capital gains",
    ],
  },
] as const;

export const HIGHER_RATE_NOTE = `If you pay Income Tax at the higher or additional rate and want to receive the additional tax relief due to you, you must include all your Gift Aid donations on your Self Assessment tax return or ask HM Revenue and Customs to adjust your tax code.`;

export const CHARITY_LINE = `${church.legalName} is a charity registered in England and Wales, no. ${church.charityNumber}.`;

/** Why we ask for a home address specifically — shown next to the field. */
export const ADDRESS_NOTE =
  "HMRC requires your home address to identify you as a UK taxpayer. A work or c/o address can't be accepted.";

/** Why we need a full first name — HMRC rejects initials. */
export const NAME_NOTE = "Please give your full first name, not an initial.";

/** UK postcode, loosely validated — enough to catch typos, not to be strict. */
export const UK_POSTCODE_RE =
  /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

export function normalisePostcode(value: string): string {
  const compact = value.replace(/\s+/g, "").toUpperCase();
  if (compact.length < 5) return value.trim().toUpperCase();
  // UK postcodes always have 3 characters in the inward code.
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}
