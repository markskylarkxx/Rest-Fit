import crypto from "node:crypto";

// No 0/O/1/I, so codes read back correctly over the phone or from a poster.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const randomCode = (length: number) => Array.from(crypto.randomBytes(length), (b) => ALPHABET[b % ALPHABET.length]).join("");

// Encoded in a member's QR card.
export const newCheckInCode = () => randomCode(8);

// What members type in the app to find their gym, e.g. "IRON7KQ".
export const newJoinCode = (gymName: string) => {
  const prefix = gymName.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
  return prefix + randomCode(7 - prefix.length);
};
