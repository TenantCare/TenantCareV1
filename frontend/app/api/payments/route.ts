import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		const session: any = await getServerSession(authOptions as any);
		if (!session?.user?.email)
			return NextResponse.json(
				{ error: "Not authenticated" },
				{ status: 401 }
			);

		const body = await req.json();
		let tenantId = body?.tenantId;
		let amount = Number(body?.amount ?? 0);

		let tenant = null;
		if (tenantId) {
			tenant = await prisma.tenant.findUnique({
				where: { id: tenantId },
			});
		} else {
			// If no tenantId, use session user
			const user = await prisma.user.findUnique({
				where: { email: session.user.email },
			});
			if (!user)
				return NextResponse.json(
					{ error: "User not found" },
					{ status: 404 }
				);
			tenant = await prisma.tenant.findFirst({
				where: { userId: user.id },
			});
		}
		if (!tenant)
			return NextResponse.json(
				{ error: "Tenant profile not found" },
				{ status: 404 }
			);

		// If amount not provided, use lease rentAmount. Also attach leaseId to payment when an active lease exists.
		let leaseId: string | undefined = undefined;
		if (!amount || amount <= 0) {
			const lease = await prisma.lease.findFirst({
				where: { tenantId: tenant.id, active: true },
			});
			if (lease) {
				amount = lease.rentAmount;
				leaseId = lease.id;
			}
		} else {
			// If amount provided, still try to attach to active lease if present
			const lease = await prisma.lease.findFirst({
				where: { tenantId: tenant.id, active: true },
			});
			if (lease) leaseId = lease.id;
		}

		const payment = await prisma.payment.create({
			data: {
				tenantId: tenant.id,
				amount,
				...(leaseId ? { leaseId } : {}),
			},
		});
		return NextResponse.json({ success: true, payment });
	} catch (err: any) {
		console.error("/api/payments POST error:", err);
		return NextResponse.json(
			{ error: err?.message ?? String(err) },
			{ status: 500 }
		);
	}
}

export async function GET(req: NextRequest) {
	try {
		const session: any = await getServerSession(authOptions as any);
		if (!session?.user?.email)
			return NextResponse.json(
				{ error: "Not authenticated" },
				{ status: 401 }
			);

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});
		if (!user)
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 }
			);

		// If the user is a tenant, list their payments
		const tenant = await prisma.tenant.findFirst({
			where: { userId: user.id },
		});
		if (!tenant) return NextResponse.json({ payments: [] });

		const payments = await prisma.payment.findMany({
			where: { tenantId: tenant.id },
			orderBy: { createdAt: "desc" },
			include: { attachments: true },
		});
		return NextResponse.json(payments);
	} catch (err: any) {
		console.error("/api/payments GET error:", err);
		return NextResponse.json(
			{ error: err?.message ?? String(err) },
			{ status: 500 }
		);
	}
}
