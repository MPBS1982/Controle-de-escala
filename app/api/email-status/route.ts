import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    active: Boolean(process.env.RESEND_API_KEY),
    fromConfigured: Boolean(process.env.RESEND_FROM_EMAIL),
  });
}
