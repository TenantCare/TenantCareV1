import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import fs from "fs";
import path from "path";

export async function POST(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session: any = await getServerSession(authOptions as any);
		if (!session?.user?.email)
			return NextResponse.json(
				{ error: "Not authenticated" },
				{ status: 401 }
			);

		const { fileName, fileBase64, method, reference } = await req.json();
		if (!fileName || !fileBase64)
			return NextResponse.json(
				{ error: "fileName and fileBase64 required" },
				{ status: 400 }
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

		const payment = await prisma.payment.findUnique({
			where: { id: params.id },
		});
		if (!payment)
			return NextResponse.json(
				{ error: "Payment not found" },
				{ status: 404 }
			);

		// Save file to public/uploads as a fallback if S3 not configured
		const uploadsDir = path.join(process.cwd(), "public", "uploads");
		try {
			fs.mkdirSync(uploadsDir, { recursive: true });
		} catch (e) {
			// ignore
		}

		const safeName = `${Date.now()}-${Math.random()
			.toString(36)
			.slice(2, 8)}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
		const outPath = path.join(uploadsDir, safeName);
		const buffer = Buffer.from(fileBase64, "base64");
		// cast buffer to satisfy typing in Next.js runtime
		fs.writeFileSync(outPath, buffer as unknown as Uint8Array);

		const urlPath = `/uploads/${safeName}`;

		const attachment = await prisma.paymentAttachment.create({
			data: {
				paymentId: payment.id,
				uploaderId: user.id,
				fileName,
				url: urlPath,
				method: method ?? null,
				reference: reference ?? null,
			},
		});

		// Optionally notify owner via Resend (if configured) - sample, non-blocking
		if (process.env.RESEND_API_KEY) {
			try {
				// Find owner email via payment -> tenant -> apartment -> building -> owner -> user
				const tenant = await prisma.tenant.findUnique({
					where: { id: payment.tenantId },
					include: {
						apartment: {
							include: {
								building: {
									include: {
										owner: { include: { user: true } },
									},
								},
							},
						},
					},
				});
				const ownerEmail =
					tenant?.apartment?.building?.owner?.user?.email;
				if (ownerEmail) {
					await fetch("https://api.resend.com/emails", {
						method: "POST",
						headers: {
							Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							from: "no-reply@tenantcare.example",
							to: ownerEmail,
							subject: "New payment proof uploaded",
							html: `<p>A tenant uploaded a payment proof for payment <strong>${
								payment.id
							}</strong>.</p><p>File: <a href='${
								process.env.NEXTAUTH_URL ?? ""
							}${urlPath}'>${fileName}</a></p>`,
						}),
					});
				}
			} catch (e) {
				console.warn("Resend notification failed", e);
			}
		}

		return NextResponse.json({ success: true, attachment });
	} catch (err: any) {
		console.error("/api/payments/[id]/attachments POST error:", err);
		return NextResponse.json(
			{ error: err?.message ?? String(err) },
			{ status: 500 }
		);
	}
}

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session: any = await getServerSession(authOptions as any);
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

		const payment = await prisma.payment.findUnique({
			where: { id: params.id },
		});
		if (!payment)
			return NextResponse.json(
				{ error: "Payment not found" },
				{ status: 404 }
			);

		// Ensure the requester is the tenant who owns the payment or the uploader
		const tenant = await prisma.tenant.findUnique({
			where: { id: payment.tenantId },
			include: {
				apartment: {
					include: { building: { include: { owner: true } } },
				},
			},
		});
		if (!tenant) return NextResponse.json({ attachments: [] });

		const isTenantOwner = tenant.userId === user.id;

		// allow building owner to view attachments for payments in their building
		const isBuildingOwner =
			tenant.apartment?.building?.owner?.userId === user.id ||
			user.role === "ADMIN";

		let attachments = [];
		if (isTenantOwner || isBuildingOwner) {
			attachments = await prisma.paymentAttachment.findMany({
				where: { paymentId: payment.id },
				orderBy: { createdAt: "desc" },
			});
		} else {
			// allow uploader to see their uploads
			attachments = await prisma.paymentAttachment.findMany({
				where: { paymentId: payment.id, uploaderId: user.id },
			});
		}

		return NextResponse.json(attachments);
	} catch (err: any) {
		console.error("/api/payments/[id]/attachments GET error:", err);
		return NextResponse.json(
			{ error: err?.message ?? String(err) },
			{ status: 500 }
		);
	}
}
