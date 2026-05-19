import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtected = createRouteMatcher(["/saved", "/api/saved(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // skip Next internals and static assets
    "/((?!_next|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|css|js|map)$).*)",
    "/(api|trpc)(.*)",
  ],
};
