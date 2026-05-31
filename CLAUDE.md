# Ranky

Voting app where admins create projects with ranked voting steps.
Users drag and drop items to rank them; scores calculated by configurable points rules.

## Stack
- Next.js 16 App Router (never use Pages Router)
- TypeScript strict (never use `any` — use `unknown` or proper Prisma types)
- Tailwind CSS only (no CSS modules, no inline styles, no styled-components)
- Prisma ORM + PostgreSQL (Neon in production)
- NextAuth.js v5 (next-auth@beta) — JWT session strategy
- @hello-pangea/dnd for drag and drop
- Vercel for deployment

## Conventions

**Components**: server by default. "use client" only for hooks, events, or dnd.
**Mutations**: server actions over API routes.
**API routes**: only for NextAuth and GETs consumed by client components.
**DB queries**: always in /lib/data/, never inline in page/component files.
**Prisma**: import only from @/lib/prisma. Use transactions for multi-table writes.
**IDs**: shareToken generated with nanoid(10).
**Tailwind**: never build class strings dynamically (no template literals).

## Auth patterns

Server component guard:
  const session = await auth();
  if (!session) redirect("/login");

Admin guard:
  if (session.user.role !== "ADMIN") redirect("/dashboard");

API route guard:
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

Session type: { user: { id: string, email: string, role: Role } }

## Structure
app/(auth)/login, /register
app/(app)/dashboard, /vote/[shareToken]
app/(admin)/ — all admin pages
components/ui/ — shared components
lib/auth.ts, lib/prisma.ts
lib/data/ — all data fetching functions
prisma/schema.prisma, seed.ts

## Never
- Pages Router / getServerSideProps / getStaticProps
- React class components
- localStorage for auth state
- prisma.$queryRaw unless truly unavoidable
- Dynamic Tailwind strings

## Run after setup
npx prisma migrate dev --name init
npm run seed
npm run dev
