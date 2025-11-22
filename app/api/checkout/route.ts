import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// AÑADIDO "as any" PARA QUE VERCEL NO SE QUEJE DE LA VERSIÓN
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as any, 
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { price, title, type, user_email } = body;

    let unitAmount = 0;
    let mode: 'payment' | 'subscription' = 'payment';
    let productName = title;
    
    let needsShipping = false;

    if (type === 'physical') {
      unitAmount = Math.round(price * 100);
      productName = `📦 Físico: ${title}`;
      needsShipping = true;
    } else if (type === 'digital') {
      unitAmount = Math.round((price * 0.4) * 100);
      productName = `📂 Archivo STL: ${title}`;
      needsShipping = false;
    } else if (type === 'subscription') {
      unitAmount = 900; 
      mode = 'subscription';
      productName = `💎 Suscripción Mensual al Maker`;
      needsShipping = true;
    }

    const sessionConfig: any = {
      payment_method_types: ['card'],
      customer_email: user_email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              images: ['https://cdn-icons-png.flaticon.com/512/3135/3135715.png'],
            },
            unit_amount: unitAmount,
            recurring: mode === 'subscription' ? { interval: 'month' } : undefined,
          },
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${request.headers.get('origin')}/?success=true`,
      cancel_url: `${request.headers.get('origin')}/?canceled=true`,
    };

    if (needsShipping) {
        sessionConfig.shipping_address_collection = {
            allowed_countries: ['AR', 'ES', 'MX', 'CO', 'US'],
        };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}