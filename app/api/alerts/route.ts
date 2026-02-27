import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { alerts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

initDb();

export async function GET() {
  const all = db.select().from(alerts).all();
  return NextResponse.json(all);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = db.insert(alerts).values({
    type: body.type,
    title: body.title,
    description: body.description,
    sectorId: body.sectorId
  }).returning().get();
  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  
  db.delete(alerts).where(eq(alerts.id, parseInt(id))).run();
  return NextResponse.json({ success: true });
}
