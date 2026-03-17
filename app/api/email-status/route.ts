import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    active: !!process.env.RESEND_API_KEY 
  });
}
