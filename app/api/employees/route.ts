import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || '10');
  const year = parseInt(searchParams.get('year') || '2023');

  // Fetch employees with roles
  const { data: allEmployees, error: empError } = await supabase
    .from('employees')
    .select(`
      id,
      name,
      avatar,
      sector_id,
      role_id,
      roles (name)
    `);

  if (empError) return NextResponse.json({ error: empError.message }, { status: 500 });

  // Fetch shifts for the given month/year
  const { data: allShifts, error: shiftError } = await supabase
    .from('shifts')
    .select('*')
    .eq('month', month)
    .eq('year', year);

  if (shiftError) return NextResponse.json({ error: shiftError.message }, { status: 500 });

  const employeesWithShifts = allEmployees.map((emp: any) => {
    const empShifts = allShifts.filter((s: any) => s.employee_id === emp.id);
    const shiftsArray = Array(31).fill(null).map((_, i) => {
      const found = empShifts.find((s: any) => s.day === i + 1);
      return found ? { type: found.type, time: found.time, overtime: found.overtime } : { type: 'empty' };
    });
    return { 
      ...emp, 
      role: emp.roles?.name,
      sectorId: emp.sector_id,
      roleId: emp.role_id,
      shifts: shiftsArray 
    };
  });

  return NextResponse.json(employeesWithShifts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const data = {
    name: body.name,
    role_id: body.roleId,
    avatar: body.avatar,
    sector_id: body.sectorId
  };

  if (body.id) {
    const { data: updated, error } = await supabase
      .from('employees')
      .update(data)
      .eq('id', body.id)
      .select()
      .single();
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(updated);
  }

  const { data: inserted, error } = await supabase
    .from('employees')
    .insert(data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(inserted);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  
  const { error } = await supabase.from('employees').delete().eq('id', parseInt(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ success: true });
}
