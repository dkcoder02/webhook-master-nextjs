import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdmin, isAuthenticatedUser, ITEMS_PER_PAGE } from "@/app/helpers/helper";


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
            const isValidEmail = await prisma.user.findFirst({
                where: { email },
            })

            if (!isValidEmail) {
                return NextResponse.json({ error: "Email invalid!" }, { status: 401 });
            }

            user = await prisma.user.findUnique({
                where: { email },
                include: {
                    todos: {
                        orderBy: { createdAt: "desc" },
                        take: ITEMS_PER_PAGE,
                        skip: (page - 1) * ITEMS_PER_PAGE,
                    },
                },
            });
        }

        const totalItems = email
            ? await prisma.todo.count({ where: { User: { email } } })
            : 0;
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

        const { email, isSubscribed, todoId, todoCompleted, todoTitle } =
            await req.json();

        if (isSubscribed !== undefined) {
            await prisma.user.update({
                where: { email },
                data: {
                    isSubscribed,
                    subscriptionEnds: isSubscribed
                        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        : null,
                },
            });
        }

        if (todoId) {
            await prisma.todo.update({
                where: { id: todoId },
                data: {
                    completed: todoCompleted !== undefined ? todoCompleted : undefined,
                    title: todoTitle || undefined,
                },
            });
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

        await prisma.todo.delete({
            where: { id: todoId },
        });

        return NextResponse.json({ message: "Todo deleted successfully" });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}