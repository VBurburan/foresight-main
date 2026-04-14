import { type NextRequest, NextResponse } from "next/server";
import { updateSession, getUserRole } from "@/lib/supabase/middleware";

const instructorRoutes = ["/instructor"];
const studentRoutes = ["/student"];
const protectedRoutes = [...instructorRoutes, ...studentRoutes];

function isInstructorRoute(pathname: string): boolean {
  return instructorRoutes.some((route) => pathname.startsWith(route));
}

function isStudentRoute(pathname: string): boolean {
  return studentRoutes.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return await updateSession(request);
  }

  // Protected route — check auth cookie first
  const hasAuthCookie = request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")
  );

  if (!hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Role-based route enforcement
  const role = await getUserRole(request);

  // If we can't determine role, allow through (client-side guards will handle)
  // This prevents locking out users during transient DB issues
  if (role !== null) {
    const isInstructor = role === "instructor" || role === "admin";

    // Instructor route accessed by non-instructor → redirect to student dashboard
    if (isInstructorRoute(pathname) && !isInstructor) {
      const url = request.nextUrl.clone();
      url.pathname = "/student/dashboard";
      return NextResponse.redirect(url);
    }

    // Student route accessed by instructor → redirect to instructor dashboard
    if (isStudentRoute(pathname) && isInstructor) {
      const url = request.nextUrl.clone();
      url.pathname = "/instructor/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
