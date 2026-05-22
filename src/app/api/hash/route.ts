import { NextRequest, NextResponse } from "next/server";
import { generateSecureHash } from "@/lib/ipay";

export async function GET(request: NextRequest) {
  return handleHashRequest(request);
}

export async function POST(request: NextRequest) {
  return handleHashRequest(request);
}

async function handleHashRequest(request: NextRequest) {
  try {
    let merchantKey = "";
    let secretKey = "";
    let invoiceId = "";
    let totalInput: any = undefined;

    // 1. Try to extract from query parameters (GET or POST URL)
    const searchParams = request.nextUrl.searchParams;
    
    merchantKey = searchParams.get("merchant_key") || searchParams.get("merchantKey") || searchParams.get("key") || "";
    secretKey = searchParams.get("secret_key") || searchParams.get("secretKey") || searchParams.get("secret") || "";
    invoiceId = searchParams.get("invoice_id") || searchParams.get("invoiceId") || searchParams.get("invoice_number") || searchParams.get("invoiceNumber") || searchParams.get("invoice") || "";
    
    const totalQuery = searchParams.get("total") || searchParams.get("amount");
    if (totalQuery !== null) {
      totalInput = totalQuery;
    }

    // 2. If POST request, try to extract from JSON body as well
    if (request.method === "POST") {
      try {
        const body = await request.json();
        if (body && typeof body === "object") {
          merchantKey = body.merchant_key || body.merchantKey || body.key || merchantKey;
          secretKey = body.secret_key || body.secretKey || body.secret || secretKey;
          invoiceId = body.invoice_id || body.invoiceId || body.invoice_number || body.invoiceNumber || body.invoice || invoiceId;
          
          const bodyTotal = body.total !== undefined ? body.total : body.amount;
          if (bodyTotal !== undefined) {
            totalInput = bodyTotal;
          }
        }
      } catch (e) {
        // Body might be empty or not JSON; we fallback to searchParams
      }
    }

    // 3. Apply Environment Variable Fallbacks
    const finalMerchantKey = merchantKey.trim() || process.env.MERCHANT_KEY || "";
    const finalSecretKey = secretKey.trim() || process.env.SECRET_KEY || "";
    
    // Check if we have the critical credentials
    if (!finalMerchantKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing merchant key. Provide 'merchant_key' in the request payload or configure MERCHANT_KEY in the environment." 
        },
        { status: 400 }
      );
    }

    if (!finalSecretKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing secret key. Provide 'secret_key' in the request payload or configure SECRET_KEY in the environment." 
        },
        { status: 400 }
      );
    }

    // 4. Handle Invoice ID Generation / Validation
    let finalInvoiceId = invoiceId.trim();
    let invoiceWasGenerated = false;
    if (!finalInvoiceId) {
      // Generate a clean invoice ID if none provided
      finalInvoiceId = `INV-${Date.now().toString().slice(-10)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
      invoiceWasGenerated = true;
    }

    // 5. Handle Total Parsing, Validation, and Formatting
    let parsedTotal = 1.00; // Default fallback total
    let totalWasDefaulted = false;

    if (totalInput !== undefined && totalInput !== null && totalInput !== "") {
      const numericTotal = Number(totalInput);
      if (isNaN(numericTotal) || numericTotal < 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid total amount: '${totalInput}'. Total must be a valid non-negative number.` 
          },
          { status: 400 }
        );
      }
      parsedTotal = numericTotal;
    } else {
      totalWasDefaulted = true;
    }

    const formattedTotal = parsedTotal.toFixed(2);

    // 6. Generate Secure Hash using the ipay helper
    let secureHash = "";
    try {
      secureHash = generateSecureHash(
        finalMerchantKey,
        finalInvoiceId,
        parsedTotal,
        finalSecretKey
      );
    } catch (hashError: any) {
      console.error("Hashing generation failed:", hashError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to generate secure hash: ${hashError.message || "Invalid secret key hex format or hashing failure."}`
        },
        { status: 500 }
      );
    }

    // 7. Construct detailed, developer-friendly response
    const rawSortedParams = {
      invoice_id: finalInvoiceId,
      merchant_key: finalMerchantKey,
      total: formattedTotal,
    };
    
    const sortedString = Object.keys(rawSortedParams)
      .sort()
      .map((key) => `${key}=${(rawSortedParams as any)[key]}`)
      .join("&");

    return NextResponse.json({
      success: true,
      secure_hash: secureHash,
      total: formattedTotal,
      total_numeric: parsedTotal,
      invoice_id: finalInvoiceId,
      merchant_key: finalMerchantKey,
      invoice_was_generated: invoiceWasGenerated,
      total_was_defaulted: totalWasDefaulted,
      developer_debug: {
        hash_string_source: sortedString,
        method_used: request.method,
      }
    });

  } catch (error: any) {
    console.error("Secure Hash Endpoint Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
