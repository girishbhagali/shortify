import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, userId } = await req.json();

    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Payment is valid
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

      // Assuming userId is provided by the client (or via auth session in a real app)
      if (userId) {
        const { error } = await supabaseAdmin
          .from('users')
          .update({
            plan: plan,
            plan_expires_at: expiresAt.toISOString(),
            payment_id: razorpay_payment_id
          })
          .eq('id', userId);

        if (error) {
          console.error("Supabase update error:", error);
          // Don't fail the payment verification if db update fails, but log it
        }
      }

      return NextResponse.json({ success: true, plan: plan });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
