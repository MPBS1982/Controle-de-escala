import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { sectors } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

initDb();

export async function GET() {
  const allSectors = db.select().from(sectors).all();
  return NextResponse.json(allSectors);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = db.insert(sectors).values({
    name: body.name
  }).returning().get();
  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  
  db.delete(sectors).where(eq(sectors.name, name)).run();
  return NextResponse.json({ success: true });
}
