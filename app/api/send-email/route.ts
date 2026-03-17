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
    const body = await request.json();
    const { to, subject, html, text } = body;

    if (!to) {
      return NextResponse.json({ error: "Recipient email (to) is required" }, { status: 400 });
    }

    console.log(`Attempting to send email to: ${to}`);

    const { data, error } = await resend.emails.send({
      from: 'ShiftMaster <onboarding@resend.dev>',
      to: [to],
      subject: subject || 'Notificação ShiftMaster',
      html: html,
      text: text,
    });

    if (error) {
      console.error("Resend API error:", error);
      let errorMessage = error.message;
      
      // Handle the specific "testing emails" restriction error from Resend
      if (errorMessage.includes("testing emails") || errorMessage.includes("onboarding@resend.dev")) {
        return NextResponse.json({ 
          error: "Restrição do Resend: No modo de teste, você só pode enviar e-mails para o seu próprio endereço de cadastro no Resend. Para enviar para o RH ou outros destinatários, você deve verificar seu domínio em resend.com/domains.",
          isResendRestriction: true,
          originalError: errorMessage
        }, { status: 400 });
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
