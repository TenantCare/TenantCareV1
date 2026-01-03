import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
// lazy-import prisma inside handler

export async function GET(
	req: NextRequest,
	{ params }: { params: { tenantId: string } }
) {
	try {
		const session = (await getServerSession(authOptions as any)) as
			| import("next-auth").Session
			| null;
		if (!session?.user?.email)
			return NextResponse.json(
				{ error: "Not authenticated" },
				{ status: 401 }
			);

		const { prisma } = await import("@/lib/prisma");
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});
		if (!user)
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 }
			);

		const tenant = await prisma.tenant.findUnique({
			where: { id: params.tenantId },
			include: {
				apartment: {
					include: { building: { include: { owner: true } } },
				},
			},
		});
		if (!tenant) return NextResponse.json({ payments: [] });

		// Robust ownership check:
		// 1) If the building's owner relation is included and has a userId, compare it to the current user.
		// 2) Otherwise, fetch the Owner record for the current user and compare owner ids.
		const buildingOwnerUserId = tenant.apartment?.building?.owner?.userId;
		let isBuildingOwner = false;
		if (user.role === "ADMIN") isBuildingOwner = true;
		if (!isBuildingOwner && buildingOwnerUserId) {
			isBuildingOwner = buildingOwnerUserId === user.id;
		}
		if (!isBuildingOwner) {
			// fallback: find owner record for this user and compare owner id with building.ownerId
			const ownerRecord = await prisma.owner.findFirst({
				where: { userId: user.id },
			});
			if (
				ownerRecord &&
				tenant.apartment?.building?.ownerId === ownerRecord.id
			) {
				isBuildingOwner = true;
			}
		}
		if (!isBuildingOwner)
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });

		const payments = await prisma.payment.findMany({
			where: { tenantId: tenant.id },
			include: { attachments: true },
			orderBy: { createdAt: "desc" },
		});
		return NextResponse.json(payments);
	} catch (err: any) {
		console.error("/api/payments/tenant/[tenantId] GET error:", err);
		return NextResponse.json(
			{ error: err?.message ?? String(err) },
			{ status: 500 }
		);
	}
}
