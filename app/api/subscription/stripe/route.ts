import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedUser } from "@/app/helpers/helper";
import { stripe } from "../../webhook/stripe/route";
import db from "@/app/db";

export async function POST(
    req: NextRequest
) {
    try {
        const userId = await isAuthenticatedUser();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isActiveSubscription = await db.query.stripeSubscriptions.findFirst({
            where: (stripeSubscriptions, { eq, and, gt }) =>
                and(
                    eq(stripeSubscriptions.userId, userId!),
                    eq(stripeSubscriptions.status, "active"),
                    gt(stripeSubscriptions.endDate, new Date())
                ),
        });

        if (!isActiveSubscription) {
            return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
        }

        const { isSubscriptionCancelled } = await req.json();
        const { customerId: stripeCustomerId } = isActiveSubscription;

        let subscription;
        try {
            subscription = await stripe.subscriptions.list({
                customer: stripeCustomerId,
            });

        } catch (error: any) {
            const message = error?.raw.code === "resource_missing" ? "Subscription not found" : "Internal Server Error";
            return NextResponse.json(
                { error: message },
                { status: 500 }
            );

        }

        const subscriptionId = subscription.data[0]!.id;

        if (!subscriptionId) {
            return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
        }

        if (isSubscriptionCancelled === true) {
            await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true,
            });
            return NextResponse.json({ message: "Subcription cancelled successfully" }, { status: 200 });
        }

        await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false,
        });

        return NextResponse.json({ message: "Subcription resumed successfully" }, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}