import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

initDb();

export async function POST(request: Request) {
  const body = await request.json();
  const { name, password } = body;

  const user = db.select().from(users).where(
    and(
      eq(users.name, name),
      eq(users.password, password)
    )
  ).get();

  if (!user) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    isMaster: user.isMaster
  });
}
