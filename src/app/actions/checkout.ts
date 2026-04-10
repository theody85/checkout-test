"use server";

import { generateSecureHash } from "@/lib/ipay";

const CHECKOUT_URL = process.env.CHECKOUT_URL || "";
const MERCHANT_KEY = process.env.MERCHANT_KEY || "";
const SECRET_KEY = process.env.SECRET_KEY || "";

export type CheckoutResponse = {
  success: boolean;
  url?: string;
  error?: string;
};

export async function initiateCheckout(
  total: number,
  description: string = "Payment",
): Promise<CheckoutResponse> {
  if (!MERCHANT_KEY || !SECRET_KEY) {
    return {
      success: false,
      error: "Merchant Key or Secret Key is not configured.",
    };
  }

  // 1. Generate unique invoice_id (max 25 chars)
  const invoiceId =
    `INV-${Date.now().toString().slice(-10)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();

  try {
    // 2. Generate secure hash
    const secureHash = generateSecureHash(
      MERCHANT_KEY,
      invoiceId,
      total,
      SECRET_KEY,
    );

    // 3. Prepare payload
    const payload = {
      merchant_key: MERCHANT_KEY,
      invoice_id: invoiceId,
      total: total.toFixed(2),
      generate_checkout_url: true,
      secure_hash: secureHash,
      description,
      // Optional fields
      // success_url: 'https://yourdomain.com/success',
      // cancelled_url: 'https://yourdomain.com/cancel',
    };
    console.log("\n---  REQUEST PAYLOAD ---");
    console.log(JSON.stringify(payload, null, 2));
    console.log("--- END PAYLOAD ---\n");

    // 4. Send request to iPay
    const response = await fetch(CHECKOUT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("---  RESPONSE DATA ---");
    console.log(JSON.stringify(data, null, 2));
    console.log("--- END RESPONSE ---\n");

    if (data.success && data.url) {
      return { success: true, url: data.url };
    } else {
      return {
        success: false,
        error: data.message || "Failed to initiate checkout.",
      };
    }
  } catch (error: any) {
    console.error("iPay Checkout Error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}

export async function getTransactionStatus(invoiceId: string): Promise<any> {
  if (!MERCHANT_KEY) {
    return { success: false, error: "Merchant Key is not configured." };
  }

  const STATUS_CHK_URL =
    "https://pgw.paywithonline.com/v1/gateway/json_status_chk";
  const url = `${STATUS_CHK_URL}?invoice_id=${invoiceId}&merchant_key=${MERCHANT_KEY}`;

  console.log("\n---  STATUS CHECK REQUEST ---");
  console.log("URL:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    console.log("---  STATUS CHECK RESPONSE ---");
    console.log(JSON.stringify(data, null, 2));
    console.log("--- END STATUS CHECK ---\n");

    return data;
  } catch (error: any) {
    console.error("iPay Status Check Error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}
