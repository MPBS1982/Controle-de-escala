import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

initDb();

export async function GET() {
  const allUsers = db.select({
    id: users.id,
    name: users.name,
    isMaster: users.isMaster
  }).from(users).all();
  return NextResponse.json(allUsers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const data = {
    name: body.name,
    password: body.password,
    isMaster: body.isMaster || false
  };

  if (body.id) {
    db.update(users).set(data).where(eq(users.id, body.id)).run();
    return NextResponse.json({ id: body.id, name: data.name, isMaster: data.isMaster });
  }

  const result = db.insert(users).values(data).returning().get();
  return NextResponse.json({ id: result.id, name: result.name, isMaster: result.isMaster });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  
  db.delete(users).where(eq(users.id, parseInt(id))).run();
  return NextResponse.json({ success: true });
}
