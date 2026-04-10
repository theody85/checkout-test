import crypto from "crypto";

/**
 * Generates an HMAC SHA-256 hash for iPay checkout.
 * Parameters must be sorted alphabetically: invoice_id, merchant_key, total.
 */
export function generateSecureHash(
  merchantKey: string,
  invoiceId: string,
  total: number,
  secretKey: string,
): string {
  // 1. Sort parameters alphabetically
  const params = {
    invoice_id: invoiceId,
    merchant_key: merchantKey,
    total: total.toFixed(2),
  };

  // 2. Create the query string: invoice_id=...&merchant_key=...&total=...
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${(params as any)[key]}`)
    .join("&");

  console.log("\n--- HASHING LOGS ---");
  console.log("JSON Payload:", JSON.stringify(params, null, 2));
  console.log("Data String to Hash:", sortedParams);
  console.log("Secret Key (Hex):", secretKey);

  // 3. Generate HMAC SHA-256
  // Use the secretKey as a Buffer (Hex)
  const hash = crypto
    .createHmac("sha256", Buffer.from(secretKey, "hex"))
    .update(sortedParams)
    .digest("hex")
    .toUpperCase();

  console.log("Generated hash:", hash);
  console.log("--- END LOGS ---\n");

  return hash;
}
