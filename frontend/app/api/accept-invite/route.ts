import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    const invite = await prisma.invite.findUnique({ where: { token } });

    if (!invite || invite.expiresAt < new Date() || invite.accepted) {
      return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
    }

    await prisma.invite.update({
      where: { id: invite.id },
      data: { accepted: true, acceptedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation approved. Now login with Google using this email.",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
