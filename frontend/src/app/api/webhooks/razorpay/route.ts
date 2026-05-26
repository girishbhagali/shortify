import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '';

    const expectedSignature = crypto.createHmac('sha256', secret).update(bodyText).digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(bodyText);

    switch (event.event) {
      case 'payment.captured':
        // Optional: you can handle activation here if not handled in verify-payment
        console.log('Payment captured:', event.payload.payment.entity.id);
        break;
        
      case 'subscription.cancelled':
        // Downgrade to free plan
        const customerId = event.payload.subscription.entity.customer_id;
        // Lookup user by customerId and downgrade
        await supabaseAdmin
          .from('users')
          .update({ plan: 'free' })
          .eq('stripe_customer_id', customerId); // Assuming you store customer ID
        console.log('Subscription cancelled for:', customerId);
        break;

      case 'payment.failed':
        // Trigger failure email logic
        console.log('Payment failed:', event.payload.payment.entity.error_description);
        break;
        
      default:
        console.log('Unhandled Razorpay event:', event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
