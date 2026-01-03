import NextAuth from "next-auth";
import { authOptions } from "./options";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

async function getHandler() {
	const { prisma } = await import("@/lib/prisma");
	const optionsWithAdapter = {
		...authOptions,
		adapter: PrismaAdapter(prisma),
	} as any;
	return NextAuth(optionsWithAdapter);
}

export const GET = async (req: Request) => {
	const handler = await getHandler();
	// @ts-ignore - NextAuth handler is callable in this context
	return handler(req as any);
};

export const POST = GET;
