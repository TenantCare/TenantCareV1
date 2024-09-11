import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
	const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
	const url = req.nextUrl.clone();

	if (url.pathname.startsWith("/admin")) {
		if (!token || token.role !== "ADMIN") {
			url.pathname = "/api/auth/signin";
			return NextResponse.redirect(url);
		}
	}

	if (url.pathname.startsWith("/tenant")) {
		if (!token || token.role !== "USER") {
			url.pathname = "/api/auth/signin";
			return NextResponse.redirect(url);
		}
	}

	return NextResponse.next();
}
