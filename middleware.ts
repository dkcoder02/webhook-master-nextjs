import { clerkMiddleware, createClerkClient, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from "next/server";

const publicRoutes = createRouteMatcher(["/", "/api/webhook/register", "/sign-in", "/sign-up"]);

export const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth()

    if (!userId && !publicRoutes(req)) {
        return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    if (userId) {
        try {
            const user = await clerkClient.users.getUser(userId);
            const role = user.publicMetadata.role as string | undefined;

            // Admin role redirection logic
            if (role === "admin" && req.nextUrl.pathname === "/dashboard") {
                return NextResponse.redirect(new URL("/admin/dashboard", req.url));
            }

            // Prevent non-admin users from accessing admin routes
            if (role !== "admin" && req.nextUrl.pathname.startsWith("/admin")) {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }

            // Redirect authenticated users trying to access public routes
            if (publicRoutes(req)) {
                return NextResponse.redirect(
                    new URL(
                        role === "admin" ? "/admin/dashboard" : "/dashboard",
                        req.url
                    )
                );
            }
        } catch (error) {
            console.error("Error fetching user data from Clerk:", error);
            return NextResponse.redirect(new URL("/error", req.url));
        }
    }
})

export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};