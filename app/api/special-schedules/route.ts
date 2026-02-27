import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { specialSchedules } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

initDb();

export async function GET() {
  const all = db.select().from(specialSchedules).all();
  return NextResponse.json(all);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = db.insert(specialSchedules).values({
    name: body.name,
    date: body.date,
    status: 'Planejado'
  }).returning().get();
  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  
  db.delete(specialSchedules).where(eq(specialSchedules.id, parseInt(id))).run();
  return NextResponse.json({ success: true });
}
