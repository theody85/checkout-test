import { NextRequest, NextResponse } from 'next/server';
import { getTransactionStatus } from '@/app/actions/checkout';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const invoiceId = searchParams.get('invoice_id');

  console.log('\n---  IPN WEBHOOK TRIGGERED ---');
  console.log('Invoice ID:', invoiceId);

  if (!invoiceId) {
    console.error('Error: invoice_id is missing in IPN request');
    return NextResponse.json({ error: 'invoice_id is required' }, { status: 400 });
  }

  // According to iPay documentation:
  // "It is your application’s responsibility to query the EcobankPay gateway 
  // for details on the event using the status check end point."

  try {
    const statusData = await getTransactionStatus(invoiceId);

    // Here شما typically update your database with the statusData
    // statusData.success, statusData.status (Paid, Cancelled, etc.)

    console.log('IPN Processing Complete for', invoiceId);
    return NextResponse.json({ success: true, message: 'IPN received and verified' });
  } catch (error: any) {
    console.error('Error processing IPN:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
