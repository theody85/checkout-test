import { NextResponse } from "next/server";
import { generateSecureHash } from "@/lib/ipay";

const CHECKOUT_URL = process.env.CHECKOUT_URL || "https://manage.ipaygh.com/gateway/checkout";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { merchant_key, secret_key, total, description = "Test Payment" } = body;

    if (!merchant_key || !secret_key || total === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: merchant_key, secret_key, total" },
        { status: 400 }
      );
    }

    const numericTotal = Number(total);
    if (isNaN(numericTotal) || numericTotal <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid total amount" },
        { status: 400 }
      );
    }

    // 1. Generate unique invoice_id (max 25 chars)
    const invoiceId = `INV-${Date.now().toString().slice(-10)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();

    // 2. Generate secure hash
    const secureHash = generateSecureHash(
      merchant_key,
      invoiceId,
      numericTotal,
      secret_key
    );

    // 3. Prepare payload
    const payload = {
      merchant_key,
      invoice_id: invoiceId,
      total: numericTotal.toFixed(2),
      generate_checkout_url: true,
      secure_hash: secureHash,
      description,
    };

    console.log("\n--- TEST ENDPOINT REQUEST PAYLOAD ---");
    console.log(JSON.stringify(payload, null, 2));
    console.log("--- END TEST PAYLOAD ---\n");

    // 4. Send request to iPay
    const response = await fetch(CHECKOUT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("--- TEST ENDPOINT RESPONSE DATA ---");
    console.log(JSON.stringify(data, null, 2));
    console.log("--- END TEST RESPONSE ---\n");

    return NextResponse.json({
      success: true,
      requestPayload: payload,
      responseData: data
    });
  } catch (error: any) {
    console.error("Test Endpoint Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
