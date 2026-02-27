import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { shifts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

initDb();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  
  let query = db.select().from(shifts);
  if (employeeId) {
    // @ts-ignore
    query = query.where(eq(shifts.employeeId, parseInt(employeeId)));
  }
  
  const allShifts = query.all();
  return NextResponse.json(allShifts);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Upsert logic for shifts
  const existing = db.select().from(shifts).where(
    and(
      eq(shifts.employeeId, body.employeeId),
      eq(shifts.day, body.day),
      eq(shifts.month, body.month),
      eq(shifts.year, body.year)
    )
  ).get();

  if (existing) {
    const result = db.update(shifts)
      .set({ type: body.type, time: body.time, overtime: body.overtime })
      .where(eq(shifts.id, existing.id))
      .returning().get();
    return NextResponse.json(result);
  } else {
    const result = db.insert(shifts).values({
      employeeId: body.employeeId,
      day: body.day,
      month: body.month,
      year: body.year,
      type: body.type,
      time: body.time,
      overtime: body.overtime
    }).returning().get();
    return NextResponse.json(result);
  }
}
