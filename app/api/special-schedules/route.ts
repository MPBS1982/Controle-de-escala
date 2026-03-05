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
  
  // If it's an assignment request
  if (body.employeeId && body.specialScheduleId) {
    const { data: assignment, error } = await supabase
      .from('special_schedule_assignments')
      .insert({
        special_schedule_id: body.specialScheduleId,
        employee_id: body.employeeId
      })
      .select()
      .single();
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(assignment);
  }

  // Otherwise, create a new schedule
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
  return NextResponse.json(inserted);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  
  const { error } = await supabase.from('special_schedules').delete().eq('id', parseInt(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ success: true });
}
