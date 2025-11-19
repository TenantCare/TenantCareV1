import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// GET: list leases for the current user (owner -> owner's apartments, tenant -> their leases)
export async function GET(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.email)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	if (session.user.role === "OWNER") {
		// find owner record
		const owner = await prisma.owner.findFirst({
			where: { userId: session.user.id },
		});
		if (!owner)
			return NextResponse.json(
				{ error: "Not an owner" },
				{ status: 403 }
			);

		// list leases for apartments owned by this owner
		const leases = await prisma.lease.findMany({
			where: { apartment: { building: { ownerId: owner.id } } },
			include: {
				tenant: { include: { user: true } },
				apartment: { include: { building: true } },
			},
		});
		return NextResponse.json(leases);
	}

	// tenant: return leases for this tenant
	if (session.user.role === "TENANT") {
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
			include: { tenants: true },
		});
		const tenant = user?.tenants?.[0];
		if (!tenant) return NextResponse.json({ leases: [] });

		const leases = await prisma.lease.findMany({
			where: { tenantId: tenant.id },
			include: { apartment: { include: { building: true } } },
		});
		return NextResponse.json(leases);
	}

	return NextResponse.json({ leases: [] });
}

// POST: owner creates or updates a lease
export async function POST(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session || session.user.role !== "OWNER")
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await req.json();
	const tenantId = body.tenantId as string;
	const apartmentId = body.apartmentId as string;
	const rentAmount = Number(body.rentAmount ?? 0);
	const dueDay = Number(body.dueDay ?? body.dueDate ?? 1);

	if (!tenantId || !apartmentId || !rentAmount) {
		return NextResponse.json(
			{ error: "Missing required fields" },
			{ status: 400 }
		);
	}

	// if lease exists update
	const existing = await prisma.lease.findFirst({
		where: { tenantId, apartmentId, active: true },
	});

	if (existing) {
		await prisma.lease.update({
			where: { id: existing.id },
			data: { rentAmount, dueDate: dueDay },
		});
		return NextResponse.json({ success: true });
	}

	await prisma.lease.create({
		data: {
			tenantId,
			apartmentId,
			rentAmount,
			dueDate: dueDay,
			startDate: new Date(),
			active: true,
		},
	});

	return NextResponse.json({ success: true });
}
