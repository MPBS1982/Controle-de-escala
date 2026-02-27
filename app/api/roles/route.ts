import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { roles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

initDb();

export async function GET() {
  const allRoles = db.select().from(roles).all();
  return NextResponse.json(allRoles);
}

export async function POST(request: Request) {
  const body = await request.json();
  const data = { name: body.name };

  if (body.id) {
    db.update(roles).set(data).where(eq(roles.id, body.id)).run();
    return NextResponse.json({ id: body.id, ...data });
  }

  const result = db.insert(roles).values(data).returning().get();
  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  
  db.delete(roles).where(eq(roles.id, parseInt(id))).run();
  return NextResponse.json({ success: true });
}
