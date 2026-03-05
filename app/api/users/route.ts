import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: allUsers, error } = await supabase
    .from('users')
    .select('id, name, is_master');
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  const formattedUsers = allUsers.map((u: any) => ({
    id: u.id,
    name: u.name,
    isMaster: u.is_master
  }));

  return NextResponse.json(formattedUsers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const data = {
    name: body.name,
    password: body.password,
    is_master: body.isMaster || false
  };

  if (body.id) {
    const { data: updated, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', body.id)
      .select()
      .single();
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: updated.id, name: updated.name, isMaster: updated.is_master });
  }

  const { data: inserted, error } = await supabase
    .from('users')
    .insert(data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: inserted.id, name: inserted.name, isMaster: inserted.is_master });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  
  const { error } = await supabase.from('users').delete().eq('id', parseInt(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ success: true });
}
