import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { Resend } from "resend";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		console.log("Session from invite:", session);
		if (!session || session.user.role !== "OWNER") {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 403 }
			);
		}
		const { email: tenantEmail, role, apartmentId } = await req.json();

		const owner = await prisma.owner.findFirst({
			where: { userId: session.user.id },
		});

		if (!owner) {
			return NextResponse.json(
				{ error: "Owner not found" },
				{ status: 404 }
			);
		}

		const token = randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hrs
		const resend = new Resend(process.env.RESEND_API_KEY);

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
		// The frontend accept page is at /accept-invite, so build the link accordingly
		const inviteLink = `${process.env.NEXTAUTH_URL}/accept-invite?token=${token}`;
		await resend.emails.send({
			from: "tenantcarerak@gmail.com",
			to: invite.email,
			subject: "You are invited to TenantCare",
			html: `
				<h2>You’ve been invited!</h2>
				<p>Click below to accept the invitation and join TenantCare:</p>
				<a href="${inviteLink}" target="_blank">Accept Invite</a>
				<p>If you did not expect this invitation, ignore this email.</p>
			`,
		});

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
