import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";

export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session || session.user.role !== "OWNER") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const owner = await prisma.owner.findFirst({
		where: { user: { email: session.user.email! } },
		include: {
			buildings: {
				include: {
					apartments: {
						include: {
							tenants: {
								include: { user: true },
							},
						},
					},
				},
			},
		},
	});

	return NextResponse.json(owner);
}
