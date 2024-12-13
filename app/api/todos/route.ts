import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedUser, ITEMS_PER_PAGE } from "@/app/helpers/helper";
import db from "@/app/db";
import { todos } from "@/app/db/schema";
import { and, desc, eq, ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const userId = await isAuthenticatedUser();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const search = searchParams.get("search") || "";

        const filters = [eq(todos.userId, userId)];

        if (search) {
            filters.push(ilike(todos.title, `%${search}%`));
        }

        const todoList = await db
            .select()
            .from(todos)
            .where(and(...filters))
            .orderBy(desc(todos.createdAt))
            .limit(ITEMS_PER_PAGE)
            .offset((page - 1) * ITEMS_PER_PAGE);

        const totalItems = (await db.select({ id: todos.id }).from(todos).where(and(...filters))).length
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        return NextResponse.json({
            todos: todoList,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await isAuthenticatedUser();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, userId),
            with: {
                todos: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!user.isSubscribed && user.todos.length >= 3) {
            return NextResponse.json(
                {
                    error:
                        "Free users can only create up to 3 todos. Please subscribe for more.",
                },
                { status: 403 }
            );
        }

        const { title } = await req.json();

        const todo = await db.insert(todos).values({ title, userId }).returning();

        return NextResponse.json(todo, { status: 201 });
    } catch (error) {
        console.log("Error:some error while create new todo");
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}