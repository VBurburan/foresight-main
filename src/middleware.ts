import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedRoutes = [
  "/instructor",
  "/student",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    const response = await updateSession(request);

    const hasAuthCookie = request.cookies.getAll().some(
      (cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")
    );

    if (!hasAuthCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    return response;
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
