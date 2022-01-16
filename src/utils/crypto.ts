import crypto from "crypto";

export const sha256 = <T>(payload: T): string =>
  crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
