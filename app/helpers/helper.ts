import { clerkClient } from "@/middleware";
import { auth } from "@clerk/nextjs/server";

const ITEMS_PER_PAGE = 10;

const isAdmin = async (userId: string) => {
    const user = await clerkClient.users.getUser(userId);
    return user.publicMetadata.role === "admin";
}

const isAuthenticatedUser = async () => {
    const { userId } = await auth();
    return userId;
}

export { ITEMS_PER_PAGE, isAdmin, isAuthenticatedUser }

