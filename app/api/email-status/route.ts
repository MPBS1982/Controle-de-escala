import { NextResponse } from 'next/server';
import { getResendFromAddress } from '@/lib/resend';

export async function GET() {
  const { isConfigured } = getResendFromAddress();
  return NextResponse.json({
    active: Boolean(process.env.RESEND_API_KEY),
    fromConfigured: isConfigured,
  });
}
