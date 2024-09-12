import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

const handler = NextAuth({
	providers: [
		GoogleProvider({
			clientId: process.env.NEXTAUTH_GOOGLE_ID ?? "",
			clientSecret: process.env.NEXTAUTH_GOOGLE_SECRET ?? "",
		}),
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				const user = await prisma.user.findUnique({
					where: { email: credentials?.email },
				});

				if (
					user &&
					(await compare(credentials.password, user.password))
				) {
					return user;
				} else {
					throw new Error("Invalid email or password");
				}
			},
		}),
	],
	callbacks: {
		async session({ session, token }) {
			const user = await prisma.user.findUnique({
				where: { email: session.user.email },
			});

			if (user) {
				session.user.id = user.id;
				session.user.role = user.role;
			}

			return session;
		},
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.role = user.role;
			}
			return token;
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
