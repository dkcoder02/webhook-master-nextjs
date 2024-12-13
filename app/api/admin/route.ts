import { NextRequest, NextResponse } from "next/server";
import { isAdmin, isAuthenticatedUser, ITEMS_PER_PAGE } from "@/app/helpers/helper";
import db from "@/app/db";
import { todos, users } from "@/app/db/schema";
import { eq, sql } from "drizzle-orm";


export async function GET(req: NextRequest) {
    try {
        const userId = await isAuthenticatedUser();

        if (!userId || !(await isAdmin(userId))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const page = parseInt(searchParams.get("page") || "1");

        let user;
        if (email) {
            const isValidEmail = await db.query.users.findFirst({
                where: (users, { eq }) => eq(users.email, email)
            });

            if (!isValidEmail) {
                return NextResponse.json({ error: "Email invalid!" }, { status: 401 });
            }

            const correctUser = isValidEmail;
            const todos = await db.query.todos.findMany({
                where: (todos, { eq }) => eq(todos.userId, correctUser.id),
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE,
                orderBy: (todos, { desc }) => [desc(todos.createdAt)],
            });

            user = { ...correctUser, todos };
        }

        const safeEmail = email ?? "";

        const todoCount = await db
            .select({
                count: sql`COUNT(*)`.as<number>()
            })
            .from(todos)
            .innerJoin(users, eq(users.id, todos.userId))
            .where(eq(users.email, safeEmail))
            .then((result) => result[0]?.count || 0);

        const totalItems = todoCount;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        return NextResponse.json({ user, totalPages, currentPage: page });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const userId = await isAuthenticatedUser();

        if (!userId || !(await isAdmin(userId))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { email, isSubscribed, todoId, todoCompleted, todoTitle } = await req.json();

        if (isSubscribed !== undefined) {
            await db.update(users)
                .set({
                    isSubscribed: isSubscribed,
                    subscriptionEnds: isSubscribed ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
                })
                .where(eq(users.email, email))
        }

        if (todoId) {
            await db.update(todos)
                .set({
                    completed: todoCompleted !== undefined ? todoCompleted : undefined,
                    title: todoTitle || undefined
                })
                .where(eq(todos.id, todoId))
        }

        return NextResponse.json({ message: "Update successful" });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {

    try {
        const userId = await isAuthenticatedUser();

        if (!userId || !(await isAdmin(userId))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { todoId } = await req.json();

        if (!todoId) {
            return NextResponse.json(
                { error: "Todo ID is required" },
                { status: 400 }
            );
        }

        await db.delete(todos).where(eq(todos.id, todoId))

        return NextResponse.json({ message: "Todo deleted successfully" });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}