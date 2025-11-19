import NextAuth, { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  // Extend the built-in User type
  interface User extends DefaultUser {
    id: string
    role: string
  }

  // Extend the session type
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
  }
}
