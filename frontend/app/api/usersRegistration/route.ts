import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
	console.log("Inside register.ts handler");
	const { email, password, name } = await req.json();

	const existingUser = await prisma.user.findUnique({
		where: { email },
	});

	if (existingUser) {
		return NextResponse.json(
			{ error: "User already exists" },
			{ status: 400 }
		);
	}

	const hashedPassword = await hash(password, 10);

	const newUser = await prisma.user.create({
		data: {
			email,
			name,
			password: hashedPassword,
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
