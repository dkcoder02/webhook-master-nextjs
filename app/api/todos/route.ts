import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticatedUser, ITEMS_PER_PAGE } from "@/app/helpers/helper";

export async function GET(req: NextRequest) {
    try {
        const userId = await isAuthenticatedUser();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const search = searchParams.get("search") || "";

        const todos = await prisma.todo.findMany({
            where: {
                userId,
                title: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            orderBy: { createdAt: "desc" },
            take: ITEMS_PER_PAGE,
            skip: (page - 1) * ITEMS_PER_PAGE,
        });

        const totalItems = await prisma.todo.count({
            where: {
                userId,
                title: {
                    contains: search,
                    mode: "insensitive",
                },
            },
        });

        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        return NextResponse.json({
            todos,
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

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { todos: true },
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

        const todo = await prisma.todo.create({
            data: { title, userId },
        });

        return NextResponse.json(todo, { status: 201 });
    } catch (error) {
        console.log("Error:some error while create new todo");
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}