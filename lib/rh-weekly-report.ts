import { Resend } from 'resend';
import { getAdminFirestore } from './firebase-admin';

type WeeklyAlert = {
  id: string;
  type?: string;
  title?: string;
  description?: string;
  message?: string;
  date?: string;
  employeeId?: string;
  sectorId?: string;
};

type WeeklyReportResult = {
  success: boolean;
  simulated?: boolean;
  startIso: string;
  endIso: string;
  rhEmail: string;
  counts: {
    absences: number;
    doubleShifts: number;
    overtime: number;
    total: number;
  };
};

const BRAZIL_OFFSET_MINUTES = 180;

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function toSaoPauloDate(date: Date) {
  return new Date(date.getTime() - BRAZIL_OFFSET_MINUTES * 60 * 1000);
}

function getPreviousWeekRange(referenceDate = new Date()) {
  const saoPauloNow = toSaoPauloDate(referenceDate);
  const currentDayOfWeek = saoPauloNow.getUTCDay();
  const daysSinceMonday = (currentDayOfWeek + 6) % 7;
  const currentMondayLocalDate = saoPauloNow.getUTCDate() - daysSinceMonday;
  const previousMondayLocalDate = currentMondayLocalDate - 7;

  const start = new Date(Date.UTC(saoPauloNow.getUTCFullYear(), saoPauloNow.getUTCMonth(), previousMondayLocalDate, 3, 0, 0));
  const end = new Date(Date.UTC(saoPauloNow.getUTCFullYear(), saoPauloNow.getUTCMonth(), currentMondayLocalDate, 3, 0, 0));

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label: `${dateFormatter.format(start)} a ${dateFormatter.format(new Date(end.getTime() - 1))}`,
  };
}

function normalizeText(value?: string) {
  return (value || '').toLowerCase();
}

function isAbsenceAlert(alert: WeeklyAlert) {
  return alert.type === 'error' || normalizeText(alert.title).includes('falta');
}

function isDoubleShiftAlert(alert: WeeklyAlert) {
  return normalizeText(alert.title).includes('dobra');
}

function isOvertimeAlert(alert: WeeklyAlert) {
  return normalizeText(alert.title).includes('hora extra');
}

function formatAlertDate(dateIso?: string) {
  if (!dateIso) return '-';
  const parsed = new Date(dateIso);
  if (Number.isNaN(parsed.getTime())) return '-';
  return dateTimeFormatter.format(parsed);
}

function renderSection(title: string, alerts: WeeklyAlert[], color: string) {
  const rows = alerts.length
    ? alerts
        .map(
          (alert) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${formatAlertDate(alert.date)}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${alert.title || '-'}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${alert.description || alert.message || '-'}</td>
            </tr>
          `
        )
        .join('')
    : `
        <tr>
          <td colspan="3" style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; color: #64748b;">Sem registros nesta semana.</td>
        </tr>
      `;

  return `
    <div style="margin-top: 24px;">
      <h3 style="margin: 0 0 12px; color: ${color};">${title} (${alerts.length})</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Data</th>
            <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Título</th>
            <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Detalhes</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

export async function sendWeeklyRhReport(referenceDate = new Date()): Promise<WeeklyReportResult> {
  const db = getAdminFirestore();
  const { startIso, endIso, label } = getPreviousWeekRange(referenceDate);

  const rhEmailDoc = await db.collection('config').doc('rh_email').get();
  const rhEmail = (rhEmailDoc.exists ? String(rhEmailDoc.data()?.value || '') : '') || 'rh@talhodelicatessen.com.br';

  const alertsSnapshot = await db
    .collection('alerts')
    .where('date', '>=', startIso)
    .where('date', '<', endIso)
    .orderBy('date', 'asc')
    .get();

  const alerts = alertsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as WeeklyAlert[];

  const absences = alerts.filter(isAbsenceAlert);
  const doubleShifts = alerts.filter(isDoubleShiftAlert);
  const overtime = alerts.filter(isOvertimeAlert);

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Escala do Talho <onboarding@resend.dev>';

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not set.');
  }

  const resend = new Resend(resendApiKey);
  const subject = `RELATÓRIO SEMANAL DE RH - ${label.toUpperCase()}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #2563eb;">Relatório Semanal de RH</h2>
      <p><strong>Período:</strong> ${label}</p>
      <p><strong>Resumo:</strong></p>
      <ul>
        <li><strong>Faltas:</strong> ${absences.length}</li>
        <li><strong>Dobras:</strong> ${doubleShifts.length}</li>
        <li><strong>Horas Extras:</strong> ${overtime.length}</li>
        <li><strong>Total de ocorrências:</strong> ${alerts.length}</li>
      </ul>
      ${renderSection('Faltas', absences, '#dc2626')}
      ${renderSection('Dobras', doubleShifts, '#d97706')}
      ${renderSection('Horas Extras', overtime, '#ca8a04')}
      <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #666;">Este é um e-mail automático do sistema Escala do Talho.</p>
    </div>
  `;

  const { data, error } = await resend.emails.send(
    {
      from: fromEmail,
      to: [rhEmail],
      subject,
      html,
      text: [
        `Relatório semanal de RH - ${label}`,
        `Faltas: ${absences.length}`,
        `Dobras: ${doubleShifts.length}`,
        `Horas extras: ${overtime.length}`,
        `Total de ocorrências: ${alerts.length}`,
        '',
        ...alerts.map((alert) => `${formatAlertDate(alert.date)} | ${alert.title || '-'} | ${alert.description || alert.message || '-'}`),
      ].join('\n'),
    },
    {
      headers: {
        'Idempotency-Key': `weekly-rh-report-${startIso}`,
      },
    }
  );

  if (error) {
    throw new Error(error.message || 'Failed to send weekly RH report');
  }

  return {
    success: true,
    startIso,
    endIso,
    rhEmail,
    counts: {
      absences: absences.length,
      doubleShifts: doubleShifts.length,
      overtime: overtime.length,
      total: alerts.length,
    },
  };
}
