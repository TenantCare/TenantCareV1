import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenantId, apartmentId, rentAmount, dueDate } = await req.json();

  const lease = await prisma.lease.create({
    data: {
      tenantId,
      apartmentId,
      rentAmount,
      dueDate,
      startDate: new Date(),
      active: true,
    },
  });

  return NextResponse.json(lease);
}
