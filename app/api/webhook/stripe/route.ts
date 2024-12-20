import db from "@/app/db";
import { stripeSubscriptions, users } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
export async function POST(req: NextRequest) {
    const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error(
            "Please add WEBHOOK_SECRET from Stripe Dashboard to .env or .env.local"
        );
    }
    try {
        const buffer = await req.text();
        const signature = req.headers.get("stripe-signature");

        if (!signature) {
            console.log("Missing Stripe signature");
            return NextResponse.json(
                { error: "Missing Stripe signature" },
                { status: 500 }
            );
        }

        const event = stripe.webhooks.constructEvent(buffer, signature, WEBHOOK_SECRET!);

        console.log(`Received event: ${event.type}`);

        // if (event.type === "checkout.session.completed") {}

        if (event.type === "customer.subscription.created") {
            const subscription = event.data.object;
            const userId = subscription.metadata.userId;
            const isActiveSubscription = await db.query.stripeSubscriptions.findFirst({
                where: (stripeSubscriptions, { eq, and, gt }) =>
                    and(
                        eq(stripeSubscriptions.userId, userId!),
                        eq(stripeSubscriptions.status, "active"),
                        gt(stripeSubscriptions.endDate, new Date())
                    ),
            });
            if (!isActiveSubscription) {
                const newSubscription: any = {
                    id: subscription.id,
                    customerId: subscription.customer,
                    status: "inActive",
                    priceId: subscription.items.data[0]?.price.id,
                    startDate: new Date(subscription.current_period_start * 1000),
                    endDate: new Date(subscription.current_period_end * 1000),
                    cancelAt: subscription.cancel_at ? true : false,
                    userId,
                };
                const subscriptionEnds = new Date();
                subscriptionEnds.setMonth(subscriptionEnds.getMonth() + 1);

                await db.insert(stripeSubscriptions).values(newSubscription);
                await db.update(users)
                    .set({
                        isSubscribed: true,
                        subscriptionEnds
                    })
                    .where(eq(users.id, userId!))
            }
        }

        if (event.type === "invoice.payment_succeeded") {
            const { payment_intent, subscription_details } = event.data.object;
            const paymentIntentId: any = payment_intent;
            const userId = subscription_details?.metadata?.userId;

            console.log("userId", userId)
            if (paymentIntentId && userId) {
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                if (paymentIntent.status === "succeeded") {
                    const subscriptionEnds = new Date();
                    subscriptionEnds.setMonth(subscriptionEnds.getMonth() + 1);

                    await db.update(stripeSubscriptions)
                        .set({
                            status: "active",
                        })
                        .where(eq(stripeSubscriptions.userId, userId!))
                }
                console.log("Payment succeeded: Subscription is now active.");
            }

            // if (paymentIntent.status === "requires_payment_method") {
            //     console.log("Payment failed: Ask the customer to update their payment method.");
            // } else if (paymentIntent.status === "requires_action") {
            //     console.log("Payment requires authentication: Guide the customer to complete 3D Secure.");
            // }
        }
        return NextResponse.json({ message: "Stripe webhook received" }, { status: 200 });
    } catch (err: any) {
        console.error("webhook error", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
