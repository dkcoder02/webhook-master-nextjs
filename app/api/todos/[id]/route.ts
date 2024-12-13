import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedUser } from "@/app/helpers/helper";
import db from "@/app/db";
import { todos } from "@/app/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {

    try {
        const userId = await isAuthenticatedUser();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { completed } = await req.json();
        const todoId = params.id;

        const todo = await db.query.todos.findFirst({
            where: (todos, { eq }) => eq(todos.id, todoId),
        });

        if (!todo) {
            return NextResponse.json({ error: "Todo not found" }, { status: 404 });
        }

        if (todo.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updatedTodo = await db.update(todos)
            .set({ completed: completed })
            .where(eq(todos.id, todoId))
            .returning();

        return NextResponse.json(updatedTodo);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = await isAuthenticatedUser();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const todoId = params.id;
        const todo = await db.query.todos.findFirst({
            where: (todos, { eq }) => eq(todos.id, todoId),
        });

        if (!todo) {
            return NextResponse.json({ error: "Todo not found" }, { status: 404 });
        }

        if (todo.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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