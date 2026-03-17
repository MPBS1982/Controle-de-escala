import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: schedules, error: schedError } = await supabase
    .from('special_schedules')
    .select('*');

  if (schedError) return NextResponse.json({ error: schedError.message }, { status: 500 });

  const { data: assignments, error: assignError } = await supabase
    .from('special_schedule_assignments')
    .select(`
      special_schedule_id,
      employees (
        id,
        name,
        avatar
      )
    `);

  if (assignError) return NextResponse.json({ error: assignError.message }, { status: 500 });

  const result = schedules.map((s: any) => ({
    ...s,
    employees: assignments
      .filter((a: any) => a.special_schedule_id === s.id)
      .map((a: any) => a.employees)
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Create a new schedule
  const { data: inserted, error } = await supabase
    .from('special_schedules')
    .insert({
      name: body.name,
      date: body.date,
      status: body.status || 'Planejado'
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If employees were provided, assign them
  if (body.employeeIds && Array.isArray(body.employeeIds) && body.employeeIds.length > 0) {
    const assignments = body.employeeIds.map((empId: number) => ({
      special_schedule_id: inserted.id,
      employee_id: empId
    }));
    
    const { error: assignError } = await supabase
      .from('special_schedule_assignments')
      .insert(assignments);
    
    if (assignError) console.error("Error assigning employees:", assignError);
  }

  return NextResponse.json(inserted);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, name, date, status, employeeIds } = body;

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  // Update schedule info
  const { data: updated, error } = await supabase
    .from('special_schedules')
    .update({ name, date, status })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update assignments if employeeIds provided
  if (employeeIds && Array.isArray(employeeIds)) {
    // 1. Delete existing assignments
    await supabase
      .from('special_schedule_assignments')
      .delete()
      .eq('special_schedule_id', id);

    // 2. Insert new assignments
    if (employeeIds.length > 0) {
      const assignments = employeeIds.map((empId: number) => ({
        special_schedule_id: id,
        employee_id: empId
      }));
      
      const { error: assignError } = await supabase
        .from('special_schedule_assignments')
        .insert(assignments);
      
      if (assignError) console.error("Error updating assignments:", assignError);
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  
  const { error } = await supabase.from('special_schedules').delete().eq('id', parseInt(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ success: true });
}
