import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	console.log("Inside register.ts handler");
	const { email, password, name } = await req.json();

	const { prisma } = await import("@/lib/prisma");

	const existingUser = await prisma.user.findUnique({
		where: { email },
	});

	if (existingUser) {
		return NextResponse.json(
			{ error: "User already exists" },
			{ status: 400 }
		);
	}

	// Frontend Prisma schema (used by this API) does not include a `password` field
	// (authentication is handled via NextAuth). Store only the allowed fields.
	const newUser = await prisma.user.create({
		data: {
			email,
			name,
			role: "TENANT",
		},
	});

	return NextResponse.json(newUser, { status: 201 });
}

export async function GET() {
	return NextResponse.json(
		{ message: "Method not allowed" },
		{ status: 405 }
	);
}
