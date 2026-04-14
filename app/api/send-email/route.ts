import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not set.' },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const body = await request.json();
    const { to, subject, html, text } = body;

    if (!to) {
      return NextResponse.json({ error: 'Recipient email (to) is required' }, { status: 400 });
    }

    console.log(`Attempting to send email to: ${to}`);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Escala do Talho <onboarding@resend.dev>',
      to: [to],
      subject: subject || 'Notificacao Escala do Talho',
      html,
      text,
    });

    if (error) {
      console.error('Resend API error:', error);
      const errorMessage = error.message;

      if (errorMessage.includes('testing emails') || errorMessage.includes('onboarding@resend.dev')) {
        return NextResponse.json(
          {
            error:
              'Restricao do Resend: No modo de teste, voce so pode enviar e-mails para o seu proprio endereco de cadastro no Resend. Para enviar para o RH ou outros destinatarios, voce deve verificar seu dominio em resend.com/domains.',
            isResendRestriction: true,
            originalError: errorMessage,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
