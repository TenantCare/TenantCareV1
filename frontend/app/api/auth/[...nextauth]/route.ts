import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
	providers: [
		GoogleProvider({
			clientId: process.env.NEXTAUTH_GOOGLE_ID ?? "",
			clientSecret: process.env.NEXTAUTH_GOOGLE_SECRET ?? "",
		}),
	],
		callbacks:{
			async jwt({ token, user }) {
				if (user) {
				token.id = user.id
				token.role = user.role?? "TENANT"
				}
				console.log("JWT Token:", token)
				return token
			},
			async session({ session, token }) {
				if (session.user) {
				session.user.id = token.id as string
				session.user.role = token.role as string
				}
				console.log("Session:", session)
				return session
			},
			async redirect({ url, baseUrl }) {
				if (url === "/") return `${baseUrl}/dashboard`;
				if (url.startsWith("/")) return `${baseUrl}${url}`;
				if (url.startsWith(baseUrl)) return url;
				
				return baseUrl;
			}
		}
			
		});

export { handler as GET, handler as POST };
