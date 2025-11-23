import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

function periodForDueDay(dueDay: number, now = new Date()) {
	// dueDay: 1-28/31, fallback to 1
	const day = Math.max(1, Math.min(31, Number(dueDay ?? 1)));
	const year = now.getFullYear();
	const month = now.getMonth();

	const candidateThisMonth = new Date(year, month, day, 0, 0, 0, 0);
	let periodStart: Date;
	if (now.getDate() >= day) {
		periodStart = candidateThisMonth;
	} else {
		// previous month
		periodStart = new Date(year, month - 1, day, 0, 0, 0, 0);
	}
	const periodEnd = new Date(
		periodStart.getFullYear(),
		periodStart.getMonth() + 1,
		periodStart.getDate(),
		0,
		0,
		0,
		0
	);
	return { periodStart, periodEnd };
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

		let leases: any[] = [];

		if (user.role === "OWNER") {
			// find owner record
			const owner = await prisma.owner.findFirst({
				where: { userId: user.id },
			});
			if (!owner) return NextResponse.json({ leases: [] });

			leases = await prisma.lease.findMany({
				where: { apartment: { building: { ownerId: owner.id } } },
				include: {
					tenant: { include: { user: true } },
					apartment: { include: { building: true } },
				},
			});
		} else if (user.role === "TENANT") {
			// tenant: find their tenant record and leases
			const u = await prisma.user.findUnique({
				where: { id: user.id },
				include: { tenants: true },
			});
			const tenant = u?.tenants?.[0];
			if (!tenant) return NextResponse.json({ leases: [] });
			leases = await prisma.lease.findMany({
				where: { tenantId: tenant.id },
				include: {
					tenant: { include: { user: true } },
					apartment: { include: { building: true } },
				},
			});
		} else if (user.role === "ADMIN") {
			leases = await prisma.lease.findMany({
				include: {
					tenant: { include: { user: true } },
					apartment: { include: { building: true } },
				},
			});
		}

		// For each lease compute paidThisPeriod and dueThisPeriod
		const result = await Promise.all(
			leases.map(async (lease) => {
				const dueDay = lease.dueDate ?? 1;
				const { periodStart, periodEnd } = periodForDueDay(dueDay);

				const paymentsSum = await prisma.payment.aggregate({
					where: {
						leaseId: lease.id,
						createdAt: { gte: periodStart, lt: periodEnd },
					},
					_sum: { amount: true },
				});

				const paidThisPeriod = paymentsSum._sum.amount ?? 0;
				const rentAmount = Number(lease.rentAmount ?? 0);
				const dueThisPeriod = Math.max(0, rentAmount - paidThisPeriod);

				return {
					lease,
					paidThisPeriod,
					dueThisPeriod,
					periodStart: periodStart.toISOString(),
					periodEnd: periodEnd.toISOString(),
				};
			})
		);

		return NextResponse.json(result);
	} catch (err: any) {
		console.error("/api/leases/with-due GET error:", err);
		return NextResponse.json(
			{ error: err?.message ?? String(err) },
			{ status: 500 }
		);
	}
}
