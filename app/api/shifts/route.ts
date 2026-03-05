import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  
  let query = supabase.from('shifts').select('*');
  if (employeeId) {
    query = query.eq('employee_id', parseInt(employeeId));
  }
  
  const { data: allShifts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json(allShifts);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Upsert logic for shifts in Supabase
  const { data: existing, error: fetchError } = await supabase
    .from('shifts')
    .select('*')
    .eq('employee_id', body.employeeId)
    .eq('day', body.day)
    .eq('month', body.month)
    .eq('year', body.year)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const shiftData = {
    employee_id: body.employeeId,
    day: body.day,
    month: body.month,
    year: body.year,
    type: body.type,
    time: body.time,
    overtime: body.overtime
  };

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('shifts')
      .update(shiftData)
      .eq('id', existing.id)
      .select()
      .single();
    
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json(updated);
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('shifts')
      .insert(shiftData)
      .select()
      .single();
    
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    return NextResponse.json(inserted);
  }
}
