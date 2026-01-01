import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
	const session = await getServerSession(authOptions);
	console.log("Session:", session);
	if (!session?.user?.email)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
		include: {
			tenants: {
				include: {
					apartment: {
						include: { building: true },
					},
					payments: true,
				},
			},
		},
	});

	const tenant = user?.tenants?.[0] ?? null;

	// Count active leases safely
	const activeLeases = tenant
		? await prisma.lease.count({
				where: { tenantId: tenant.id, active: true },
		  })
		: 0;

	// Find the active lease (if any)
	const lease = tenant
		? await prisma.lease.findFirst({
				where: { tenantId: tenant.id, active: true },
				include: { apartment: { include: { building: true } } },
		  })
		: null;

	const rentAmount = lease?.rentAmount ?? 0;

	// Determine payment aggregation window — supports testing via query params:
	// - ?testMode=1&windowDays=7  => sum payments in last 7 days
	// - ?allPayments=1           => sum all payments for the tenant (no date filter)
	const params = req.nextUrl.searchParams;
	const testMode =
		params.get("testMode") === "1" || params.get("testMode") === "true";
	const allPayments =
		params.get("allPayments") === "1" ||
		params.get("allPayments") === "true";

	let paymentsAgg;
	if (!tenant) {
		paymentsAgg = { _sum: { amount: 0 } };
	} else if (allPayments) {
		paymentsAgg = await prisma.payment.aggregate({
			_sum: { amount: true },
			where: { tenantId: tenant.id },
		});
	} else if (testMode && params.has("windowDays")) {
		const days = Math.max(1, parseInt(params.get("windowDays") || "7", 10));
		const now = new Date();
		const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
		const end = new Date(now.getTime() + 24 * 60 * 60 * 1000); // include today
		paymentsAgg = await prisma.payment.aggregate({
			_sum: { amount: true },
			where: {
				tenantId: tenant.id,
				createdAt: { gte: start, lt: end },
			},
		});
	} else {
		// default: current calendar month
		const now = new Date();
		const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const firstOfNextMonth = new Date(
			now.getFullYear(),
			now.getMonth() + 1,
			1
		);
		paymentsAgg = await prisma.payment.aggregate({
			_sum: { amount: true },
			where: {
				tenantId: tenant.id,
				createdAt: { gte: firstOfMonth, lt: firstOfNextMonth },
			},
		});
	}

	const paymentsThisMonth = paymentsAgg._sum.amount ?? 0;

	const paymentsDue = Math.max(0, rentAmount - paymentsThisMonth);

	return NextResponse.json({
		name: user?.name ?? null,
		email: user?.email ?? null,
		building:
			lease?.apartment?.building?.name ??
			tenant?.apartment?.building?.name ??
			null,
		apartment: lease?.apartment?.label ?? tenant?.apartment?.label ?? null,
		lease: lease
			? {
					id: lease.id,
					rentAmount: lease.rentAmount,
					dueDate: lease.dueDate,
					startDate: lease.startDate,
					endDate: lease.endDate,
					active: lease.active,
					apartment: lease.apartment
						? {
								id: lease.apartment.id,
								label: lease.apartment.label,
						  }
						: null,
			  }
			: null,
		activeLeases,
		paymentsDue,
		pendingMessages: 0,
		tickets: 0,
	});
}
