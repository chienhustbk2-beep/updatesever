import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session { user: { id: string; role: string; balance: number; accountCode: string } & DefaultSession["user"] }
interface User {
    role: string; balance: number; accountCode: string }
}

declare module "next-auth/jwt" {
  interface JWT { id: string; role: string; balance: number; accountCode: string }
}
