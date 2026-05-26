"use client";

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import Script from 'next/script';

interface PricingCardProps {
  planName: string;
  priceId: "pro" | "creator";
  priceStr: string;
  features: string[];
  userId?: string; // Optional user ID passed from auth session
}

export default function PricingCard({ planName, priceId, priceStr, features, userId = "test-user-123" }: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Create order
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: priceId }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      // 2. Open Razorpay checkout popup
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'ShortifyAI',
        description: `${planName} Subscription`,
        order_id: data.orderId,
        handler: async function (response: Record<string, string>) {
          // 3. On success calls /api/verify-payment
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: priceId,
                userId: userId
              }),
            });
            
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setSuccess('Subscription successful! Redirecting to dashboard...');
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 2000);
            } else {
              setError('Payment verification failed. Please contact support.');
            }
          } catch (err) {
            console.error(err);
            setError('Error verifying payment.');
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: 'Creator',
          email: 'creator@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#8b5cf6', // Purple-500
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paymentObject = new (window as any).Razorpay(options);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      paymentObject.on('payment.failed', function (response: any) {
        setError(response.error.description);
        setIsLoading(false);
      });
      paymentObject.open();
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="p-8 rounded-3xl border border-purple-500 bg-purple-50 relative shadow-xl">
        <h3 className="text-xl font-medium text-purple-700 mb-2">{planName}</h3>
        <div className="mb-4">
          <span className="text-5xl font-extrabold text-slate-900">{priceStr}</span>
          <span className="text-purple-600">/mo</span>
        </div>
        <p className="text-sm text-slate-700 mb-8">Elevate your content creation.</p>
        
        {error && <p className="text-sm text-red-500 mb-4 bg-red-100 p-2 rounded">{error}</p>}
        {success && <p className="text-sm text-green-600 mb-4 bg-green-100 p-2 rounded">{success}</p>}
        
        <button 
          onClick={handleSubscribe} 
          disabled={isLoading || !!success}
          className="w-full py-3 rounded-xl font-semibold transition-all mb-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : 'Subscribe Now'}
        </button>
        
        <ul className="space-y-4">
          {features.map((feat, idx) => (
            <li key={idx} className="flex items-center gap-3 text-sm text-slate-800">
              <CheckCircle2 className="w-5 h-5 text-purple-500" /> {feat}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
