import { NextResponse } from "next/server";

export async function GET(
	_req: Request,
	{ params }: { params: { id: string } }
) {
	const apartmentId = params.id;

	try {
		const { prisma } = await import("@/lib/prisma");
		const tenants = await prisma.tenant.findMany({
			where: { apartmentid: apartmentId },
			include: { user: true },
		});
		return NextResponse.json(tenants);
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: "Failed to fetch tenants" },
			{ status: 500 }
		);
	}
}
