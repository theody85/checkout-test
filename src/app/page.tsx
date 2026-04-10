'use client';

import { useState } from 'react';
import { initiateCheckout, getTransactionStatus } from './actions/checkout';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusInvoiceId, setStatusInvoiceId] = useState('');
  const [statusResult, setStatusResult] = useState<any>(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    const result = await initiateCheckout(1.0, 'Test iPay Checkout');

    if (result.success && result.url) {
      window.location.href = result.url;
    } else {
      setError(result.error || 'Failed to initiate checkout.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Checkout</h1>
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Demo
            </span>
          </div>

          <div className="mb-8 space-y-4">
            <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>Item: Online Service</span>
              <span className="font-medium">GHS 1.00</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>Tax (0%)</span>
              <span className="font-medium">GHS 0.00</span>
            </div>
            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-4" />
            <div className="flex justify-between items-center text-lg font-bold text-zinc-900 dark:text-zinc-50">
              <span>Total</span>
              <span className="text-2xl">GHS 1.00</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={loading}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 transition-all duration-200 
              ${loading ? 'opacity-70 cursor-not-allowed transform scale-[0.98]' : 'hover:bg-zinc-800 dark:hover:bg-white hover:shadow-lg active:scale-95'}
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </div>
            ) : (
              'Pay Now'
            )}
          </button>

          <div className="mt-12 h-px bg-zinc-100 dark:bg-zinc-800 my-8" />

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Check Transaction Status</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Enter Invoice ID"
                value={statusInvoiceId}
                onChange={(e) => setStatusInvoiceId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-50"
              />
              <button
                onClick={async () => {
                  if (!statusInvoiceId) return;
                  setStatusLoading(true);
                  const result = await getTransactionStatus(statusInvoiceId);
                  setStatusResult(result);
                  setStatusLoading(false);
                }}
                disabled={statusLoading || !statusInvoiceId}
                className="w-full py-3 px-6 rounded-xl font-medium text-sm border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
              >
                {statusLoading ? 'Checking...' : 'Check Status'}
              </button>
            </div>

            {statusResult && (
              <div className="mt-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                <pre className="text-[10px] text-zinc-600 dark:text-zinc-400">
                  {JSON.stringify(statusResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 flex flex-col items-center gap-2 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            Secured by Payment Gateway
          </p>
          <div className="flex gap-4 items-center opacity-60">
            <div className="w-8 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-sm" />
            <div className="w-8 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-sm" />
            <div className="w-8 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
