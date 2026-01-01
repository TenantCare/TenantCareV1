import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		GoogleProvider({
			clientId: process.env.NEXTAUTH_GOOGLE_ID ?? "",
			clientSecret: process.env.NEXTAUTH_GOOGLE_SECRET ?? "",
		}),
	],
	callbacks: {
		async signIn({ user }) {
			if (!user?.email) return true;

			const invite = await prisma.invite.findFirst({
				where: { email: user.email, accepted: true },
			});

			if (invite) {
				await prisma.user.upsert({
					where: { email: user.email! },
					update: { role: invite.role },
					create: {
						email: user.email!,
						name: user.name!,
						role: invite.role,
					},
				});

				if (invite.role === "TENANT" && invite.apartmentId) {
					const existingTenant = await prisma.tenant.findFirst({
						where: { user: { email: user.email! } },
					});

					if (!existingTenant) {
						const createdUser = await prisma.user.findUnique({
							where: { email: user.email! },
						});

						await prisma.tenant.create({
							data: {
								userId: createdUser!.id,
								apartmentid: invite.apartmentId,
							},
						});
					}
				}
			}

			return true;
		},
		async session({ session }) {
			if (!session.user?.email) return session;

			const dbUser = await prisma.user.findUnique({
				where: { email: session.user.email },
			});

			session.user.role = dbUser?.role ?? session.user.role ?? "TENANT";
			return session;
		},
	},
};
