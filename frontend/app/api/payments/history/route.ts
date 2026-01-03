import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET(req: NextRequest) {
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

		const url = new URL(req.url);
		const apartmentId = url.searchParams.get("apartmentId");
		if (!apartmentId)
			return NextResponse.json(
				{ error: "apartmentId required" },
				{ status: 400 }
			);

		// verify ownership: find apartment and its building.owner
		const apartment = await prisma.apartment.findUnique({
			where: { id: apartmentId },
			include: { building: { include: { owner: true } } },
		});
		if (!apartment)
			return NextResponse.json(
				{ error: "Apartment not found" },
				{ status: 404 }
			);

		// allow admins
		let isOwner = false;
		if (user.role === "ADMIN") isOwner = true;

		// Try ownership check: consider owner -> buildings -> apartments so owners can own specific apartments
		try {
			console.log(
				"payments/history: session.user=",
				session.user?.email,
				"user.id=",
				user.id
			);
			// attempt to load owner's buildings & apartments
			const ownerRecord = await prisma.owner.findFirst({
				where: { userId: user.id },
				include: { buildings: { include: { apartments: true } } },
			});
			console.log(
				"payments/history: ownerRecord=",
				ownerRecord?.id,
				ownerRecord?.userId
			);
			if (ownerRecord) {
				// check if any of the owner's buildings contains this apartment
				for (const b of ownerRecord.buildings || []) {
					if (
						(b.apartments || []).some(
							(a: any) => a.id === apartment.id
						)
					) {
						isOwner = true;
						break;
					}
				}
			}
			// As a fallback allow admins
			if (user.role === "ADMIN") isOwner = true;
		} catch (innerErr) {
			console.error("payments/history: ownership check error", innerErr);
		}

		if (!isOwner)
			return NextResponse.json(
				{ error: "Forbidden", reason: "not-owner" },
				{ status: 403 }
			);

		// fetch payments for tenants in this apartment (only confirmed payments)
		const payments = await prisma.payment.findMany({
			where: { tenant: { apartmentid: apartmentId }, confirmed: true },
			include: { attachments: true, tenant: { include: { user: true } } },
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json(payments);
	} catch (err: any) {
		console.error("/api/payments/history GET error:", err);
		return NextResponse.json(
			{ error: err?.message ?? String(err) },
			{ status: 500 }
		);
	}
}
