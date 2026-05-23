import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

interface AuthorizedUser { id: string; email: string; name?: string; role: string; balance: number }
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "email@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null }
const email = credentials.email as string;
        const password = credentials.password as string;

        const { prisma } = await import("@/lib/prisma");

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null }
const isPasswordValid = await compare(password, user.passwordHash);

        if (!isPasswordValid) {
          return null };
        await prisma.user.update({
          where: { id: user.id },
          data: { lastSeen: new Date() },
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
          balance: user.balance,
        } satisfies AuthorizedUser },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as AuthorizedUser;
        token.id = authUser.id;
        token.role = authUser.role;
        token.balance = authUser.balance };return token },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.balance = token.balance as number };return session },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
