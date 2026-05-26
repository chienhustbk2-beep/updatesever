import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

interface AuthorizedUser { id: string; email: string; name?: string; role: string; balance: number; accountCode: string }

const loginFailures = new Map<string, { count: number; lockUntil: number }>();

async function getSettings() {
  const { prisma } = await import("@/lib/prisma");
  const rows = await prisma.systemSettings.findMany();
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

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
        captchaToken: { label: "Captcha", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null }
const email = credentials.email as string;
        const password = credentials.password as string;
        const captchaToken = credentials.captchaToken as string;

        const settings = await getSettings();
        const maxAttempts = parseInt(settings.maxLoginAttempts || "5");
        const lockoutMinutes = parseInt(settings.lockoutMinutes || "15");
        const headers = req?.headers as Headers;
        const forwardedFor = headers?.get("x-forwarded-for");
        const ip = forwardedFor?.split(",")[0]?.trim() || headers?.get("x-real-ip") || "unknown";

        // IP-based rate limit
        const ipRl = rateLimit({ key: getRateLimitKey(ip, "login"), maxAttempts: Math.min(maxAttempts * 3, 30), windowMs: 60000 });
        if (!ipRl.success) {
          return null }

        // Email-based lockout
        const failureKey = `login:${email}`;
        const now = Date.now();
        const failure = loginFailures.get(failureKey);
        if (failure && now < failure.lockUntil) {
          return null }
if (failure && now >= failure.lockUntil) {
          loginFailures.delete(failureKey) }

        const { validateCaptchaToken } = await import("@/lib/captcha-validate");
        const captchaResult = await validateCaptchaToken(captchaToken);
        if (!captchaResult.valid) {
          return null }

        const { prisma } = await import("@/lib/prisma");

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Wrong email – count as failure
          const entry = loginFailures.get(failureKey) || { count: 0, lockUntil: 0 };
          entry.count += 1;
          if (entry.count >= maxAttempts) {
            entry.lockUntil = now + lockoutMinutes * 60 * 1000;
          }
          loginFailures.set(failureKey, entry);
          return null }
const isPasswordValid = await compare(password, user.passwordHash);

        if (!isPasswordValid) {
          // Wrong password – count as failure
          const entry = loginFailures.get(failureKey) || { count: 0, lockUntil: 0 };
          entry.count += 1;
          if (entry.count >= maxAttempts) {
            entry.lockUntil = now + lockoutMinutes * 60 * 1000;
          }
          loginFailures.set(failureKey, entry);
          return null };
        // Success – reset failures
        loginFailures.delete(failureKey);
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
          accountCode: user.accountCode || "",
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
        token.balance = authUser.balance;
        token.accountCode = authUser.accountCode };return token },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.balance = token.balance as number;
        session.user.accountCode = token.accountCode as string };return session },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
