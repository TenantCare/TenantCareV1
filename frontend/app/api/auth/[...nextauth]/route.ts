import NextAuth, { NextAuthOptions } from "next-auth";
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "OWNER";
      }
		
      console.log("JWT Token:", token);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      console.log("Session:", session);
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url === "/") return `${baseUrl}/dashboard`;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;

      return baseUrl;
    },
  },
  session:{strategy: "jwt"},
//   pages: { signIn: "/" },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };