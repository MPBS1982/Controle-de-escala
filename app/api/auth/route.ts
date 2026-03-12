import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, password } = body;

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('name', name)
    .eq('password', password)
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    isMaster: user.is_master || user.name === "Marcelo Pereira Bittencourt de Souza"
  });
}
