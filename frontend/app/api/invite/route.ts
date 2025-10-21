import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session from invite:", session);
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { email: tenantEmail, role, apartmentId } = await req.json();

    const owner = await prisma.owner.findFirst({
      where: { userId: session.user.id },
    });

    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hrs

    const invite = await prisma.invite.create({
      data: {
        email: tenantEmail,
        role: role || "TENANT",
        token,
        expiresAt,
        apartmentId,
        ownerId: owner.id,
      },
    });

    const inviteLink = `${process.env.NEXTAUTH_URL}/invite/accept?token=${token}`;

    return NextResponse.json({ success: true, inviteLink });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Failed to create invite" },
      { status: 500 }
    );
  }
}


export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owner = await prisma.owner.findFirst({
    where: { userId: session.user.id },
  });

  if (!owner) {
    return NextResponse.json({ error: "Not an owner" }, { status: 403 });
  }

  const invites = await prisma.invite.findMany({
    where: { ownerId: owner.id },
    include: { apartment: true },
  });

  return NextResponse.json(invites);
}