import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error("Razorpay keys are missing.");
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    const body = await req.json();
    const { plan } = body;

    let amount = 0;
    if (plan === 'pro') amount = 49900;
    else if (plan === 'creator') amount = 99900;
    else return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: key_id,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Error creating order' }, { status: 500 });
  }
}
