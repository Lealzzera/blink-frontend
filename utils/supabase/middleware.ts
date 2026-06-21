import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname === "/";
  const isForgotPage = pathname.startsWith("/forgot-password");
  const isResetPage = pathname.startsWith("/reset-password");
  const isRegisterPage = pathname.startsWith("/register");
  const isReturnPage = pathname.startsWith("/return");
  const isPublic = isAuthPage || isForgotPage || isResetPage || isRegisterPage || isReturnPage;

  const token = request.cookies.get("access_token")?.value;
  const isAuthenticated = !!token;

  if (!isAuthenticated && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && (isAuthPage || isRegisterPage)) {
    const url = request.nextUrl.clone();
    url.pathname = "/conversations";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
