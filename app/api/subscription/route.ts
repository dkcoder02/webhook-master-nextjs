import { NextResponse } from "next/server";
import { isAuthenticatedUser } from "@/app/helpers/helper";
import db from "@/app/db";
import { users } from "@/app/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
    try {
        const userId = await isAuthenticatedUser();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, userId),
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const subscriptionEnds = new Date();
        subscriptionEnds.setMonth(subscriptionEnds.getMonth() + 1);

        const updatedUser = await db.update(users)
            .set({
                isSubscribed: true,
                subscriptionEnds: subscriptionEnds
            })
            .where(eq(users.id, userId))
            .returning();

        return NextResponse.json({
            message: "Subscription successful",
            subscriptionEnds: updatedUser[0].subscriptionEnds,
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const userId = await isAuthenticatedUser();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const user = await db.query.users.findFirst({
            columns: {
                isSubscribed: true,
                subscriptionEnds: true
            },
            where: (users, { eq }) => eq(users.id, userId)
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const now = new Date();
        if (user.subscriptionEnds && user.subscriptionEnds < now) {
            await db.update(users)
                .set({
                    isSubscribed: false,
                    subscriptionEnds: null
                })
                .where(eq(users.id, userId));
            return NextResponse.json({ isSubscribed: false, subscriptionEnds: null });
        }

        return NextResponse.json({
            isSubscribed: user.isSubscribed,
            subscriptionEnds: user.subscriptionEnds,
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}