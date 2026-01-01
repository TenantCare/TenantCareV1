import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";

export async function GET() {
	const session = await getServerSession(authOptions);

	if (!session?.user || session.user.role !== "OWNER") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const owner = await prisma.owner.findFirst({
		where: { userId: session.user.id },
		include: {
			buildings: {
				include: {
					apartments: true,
				},
			},
		},
	});

	if (!owner) {
		return NextResponse.json({ apartments: [] });
	}

	// Flatten apartments list
	const apartments = owner.buildings.flatMap((b) =>
		b.apartments.map((a) => ({
			id: a.id,
			label: a.label,
			building: { id: b.id, name: b.name },
		}))
	);

	return NextResponse.json({ apartments });
}

export async function POST(req: Request) {
	const session = await getServerSession(authOptions);

	if (!session?.user || session.user.role !== "OWNER") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const { buildingName, apartmentLabel } = await req.json();
	if (!buildingName || !apartmentLabel) {
		return NextResponse.json(
			{ error: "Building name and apartment label required" },
			{ status: 400 }
		);
	}

	// Find or create owner record
	let owner = await prisma.owner.findFirst({
		where: { userId: session.user.id },
	});

	if (!owner) {
		owner = await prisma.owner.create({
			data: { userId: session.user.id },
		});
	}

	// Find or create building
	let building = await prisma.building.findFirst({
		where: { name: buildingName },
	});

	if (!building) {
		building = await prisma.building.create({
			data: {
				name: buildingName,
				ownerId: owner.id,
			},
		});
	}

	// Create apartment
	const apartment = await prisma.apartment.create({
		data: {
			buildingId: building.id,
			label: apartmentLabel,
		},
	});

	return NextResponse.json({ success: true, apartment });
}
