import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      console.warn("RESEND_API_KEY is not set. Email sending is simulated.");
      return NextResponse.json({ 
        success: true, 
        message: "Email sending simulated (API key missing)",
        simulated: true 
      });
    }

    const resend = new Resend(apiKey);
    const { to, subject, html, text } = await request.json();

    const { data, error } = await resend.emails.send({
      from: 'ShiftMaster <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
      text: text,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
