import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('config')
    .select('*');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  const config = data.reduce((acc: any, item: any) => {
    acc[item.key] = item.value;
    return acc;
  }, {});

  return NextResponse.json(config);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { key, value } = body;

  if (!key || value === undefined) {
    return NextResponse.json({ error: 'Key and value required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('config')
    .upsert({ key, value })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
