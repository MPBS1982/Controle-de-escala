import { NextResponse } from 'next/server';
import { sendWeeklyRhReport } from '@/lib/rh-weekly-report';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : '';

  if (!expected || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendWeeklyRhReport();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Weekly RH report error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send weekly RH report' },
      { status: 500 }
    );
  }
}
