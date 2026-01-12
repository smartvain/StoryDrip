import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

const COOKIE_NAME = "vid";
const COOKIE_MAX_AGE = 31536000; // 1年

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // vidがなければ新規発行
  if (!request.cookies.get(COOKIE_NAME)) {
    const vid = uuidv4();
    response.cookies.set(COOKIE_NAME, vid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }

  return response;
}

export const config = {
  matcher: ["/", "/api/story"],
};
