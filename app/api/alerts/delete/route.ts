import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';

const MASTER_EMAIL = 'sistemas@talhodelicatessen.com.br';

function normalizeDateKey(value?: string | null) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

function isAdminRole(role?: string | null) {
  return ['admin', 'supervisor', 'manager'].includes(String(role || '').toLowerCase());
}

function buildShiftDocId(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return '';
  return `${year}-${month}-${day}`;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: 'missing_token' }, { status: 401 });
    }

    const payload = await request.json().catch(() => ({}));
    const alertId = String(payload?.alertId || '').trim();
    if (!alertId) {
      return NextResponse.json({ error: 'missing_alert_id' }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(token);
    const userRecord = await getAdminAuth().getUser(decoded.uid);
    const userDoc = await getAdminFirestore().collection('users').doc(decoded.uid).get();
    const role = String(userDoc.data()?.role || '').toLowerCase();
    const email = String(userRecord.email || decoded.email || '').toLowerCase();
    const isMaster = email === MASTER_EMAIL;

    if (!isMaster && !isAdminRole(role)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const db = getAdminFirestore();
    const alertRef = db.collection('alerts').doc(alertId);
    const alertSnap = await alertRef.get();
    if (!alertSnap.exists) {
      return NextResponse.json({ ok: true, deleted: false });
    }

    const alert = alertSnap.data() || {};
    const dateKey = normalizeDateKey(String(alert.date || ''));
    const employeeId = String(alert.employeeId || '');
    const title = String(alert.title || alert.message || '').toLowerCase();
    const shouldRemoveShift =
      employeeId &&
      dateKey &&
      (title.startsWith('falta:') || title.startsWith('folga trabalhada:'));

    const batch = db.batch();

    batch.set(db.collection('audit_logs').doc(), {
      entity: 'alerts',
      action: 'delete',
      alertId,
      alertType: String(alert.type || ''),
      alertTitle: String(alert.title || ''),
      alertDescription: String(alert.description || alert.message || ''),
      alertDate: String(alert.date || ''),
      employeeId: String(alert.employeeId || ''),
      sectorId: String(alert.sectorId || ''),
      reason: String(alert.reason || ''),
      details: shouldRemoveShift
        ? 'Exclusão via endpoint autenticado com limpeza da escala relacionada.'
        : 'Exclusão via endpoint autenticado.',
      performedByUid: decoded.uid,
      performedByName: String(userRecord.displayName || userDoc.data()?.name || ''),
      performedByEmail: email,
      createdAt: FieldValue.serverTimestamp(),
    });

    if (shouldRemoveShift) {
      const shiftDocId = buildShiftDocId(dateKey);
      if (shiftDocId) {
        batch.delete(db.collection('employees').doc(employeeId).collection('shifts').doc(shiftDocId));
      }
    }

    batch.delete(alertRef);
    await batch.commit();

    return NextResponse.json({ ok: true, deleted: true, removedShift: shouldRemoveShift });
  } catch (error: any) {
    console.error('delete alert route failed', error);
    return NextResponse.json(
      { error: error?.message || 'unknown_error' },
      { status: 500 }
    );
  }
}
