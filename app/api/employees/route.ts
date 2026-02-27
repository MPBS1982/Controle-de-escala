import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { employees, shifts, roles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

initDb();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || '10');
  const year = parseInt(searchParams.get('year') || '2023');

  const allEmployees = db.select({
    id: employees.id,
    name: employees.name,
    avatar: employees.avatar,
    sectorId: employees.sectorId,
    roleId: employees.roleId,
    role: roles.name
  })
  .from(employees)
  .leftJoin(roles, eq(employees.roleId, roles.id))
  .all();

  const employeesWithShifts = allEmployees.map(emp => {
    const empShifts = db.select().from(shifts).where(eq(shifts.employeeId, emp.id)).all();
    const shiftsArray = Array(31).fill(null).map((_, i) => {
      const found = empShifts.find(s => s.day === i + 1 && s.month === month && s.year === year);
      return found ? { type: found.type, time: found.time, overtime: found.overtime } : { type: 'empty' };
    });
    return { ...emp, shifts: shiftsArray };
  });
  return NextResponse.json(employeesWithShifts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const data = {
    name: body.name,
    roleId: body.roleId,
    avatar: body.avatar,
    sectorId: body.sectorId
  };

  if (body.id) {
    db.update(employees).set(data).where(eq(employees.id, body.id)).run();
    return NextResponse.json({ id: body.id, ...data });
  }

  const result = db.insert(employees).values(data).returning().get();
  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  
  db.delete(employees).where(eq(employees.id, parseInt(id))).run();
  return NextResponse.json({ success: true });
}
