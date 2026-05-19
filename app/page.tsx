'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Clock, 
  CalendarDays, 
  UserMinus, 
  Users, 
  Settings, 
  LogOut,
  Search,
  Bell,
  Plus,
  MoreVertical,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  Download,
  Zap,
  Umbrella,
  Ban,
  Shield,
  Key,
  Briefcase,
  Layers,
  Edit2,
  Trash2,
  Database,
  CheckCircle2,
  FileText,
  ArrowDownAZ
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { seedConfig, seedEmployees, seedRoles, seedSectors } from '@/lib/base-colaboradores';
import Image from 'next/image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Firebase Imports
import { 
  auth, 
  db, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
  collectionGroup
} from '@/firebase';
import ErrorBoundary from '@/components/ErrorBoundary';

// --- Types ---

  type View = 'dashboard' | 'planner' | 'employees' | 'absences' | 'double_shifts' | 'overtime' | 'vacations' | 'sectors' | 'special_schedules' | 'settings' | 'roles' | 'users' | 'reports';

// --- Mock Data ---

const DEPARTMENTS = ['RH', 'Vendas', 'Tec', 'Suporte', 'Ops', 'Admin'];

const ALERTS = [
  {
    id: 1,
    type: 'error',
    title: 'Ausência não Justificada',
    description: 'Marcus Webb - Depto Tec',
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-100',
    actions: ['Ligar Agora', 'Ignorar']
  },
  {
    id: 2,
    type: 'warning',
    title: 'Hora Extra não Autorizada',
    description: 'Sarah Jenkins +2.5h',
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-100',
    actions: ['Revisar Log']
  },
  {
    id: 3,
    type: 'info',
    title: 'Nova Solicitação de Folga',
    description: 'Leo G. solicitou 3 dias',
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100',
    actions: ['Aprovar']
  }
];

const DOUBLE_SHIFTS = [
  {
    id: 1,
    name: 'Jordan Smith',
    dept: 'Operações',
    shiftA: '06:00 - 14:00',
    shiftB: '14:00 - 22:00',
    status: 'Período de Descanso OK',
    avatar: null
  },
  {
    id: 2,
    name: 'Elena Rodriguez',
    dept: 'Suporte',
    shiftA: '08:00 - 16:00',
    shiftB: '22:00 - 06:00',
    status: 'Consentimento Pendente',
    avatar: null
  },
  {
    id: 3,
    name: 'David Chen',
    dept: 'Tecnologia',
    shiftA: '09:00 - 17:00',
    shiftB: '17:00 - 01:00',
    status: 'Período de Descanso OK',
    avatar: null
  }
];

const MASTER_EMAIL = 'sistemas@talhodelicatessen.com.br';

const isMasterEmail = (email?: string | null) => (email || '').toLowerCase() === MASTER_EMAIL;
const normalizeAccessRole = (role?: string | null) => {
  const value = (role || 'user').toLowerCase();
  return value === 'manager' ? 'supervisor' : value;
};

const getAccessRoleLabel = (role?: string | null, isMaster?: boolean) => {
  if (isMaster) return 'Master';
  const normalized = normalizeAccessRole(role);
  if (normalized === 'supervisor') return 'Supervisor';
  if (normalized === 'admin') return 'Administrador';
  if (normalized === 'user') return 'Usuário';
  return role || 'Usuário';
};

const formatReportDate = (value?: string | null) => {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const getAlertEmployeeName = (alert: any, prefix: string) => {
  const title = String(alert?.title || '');
  const fromTitle = title.replace(new RegExp(`^${prefix}:\\s*`), '').trim();
  return fromTitle || alert?.employeeName || 'Colaborador';
};

const getAlertSectorName = (alert: any, sectors: any[]) => {
  if (!alert?.sectorId) return '-';
  return sectors.find(sector => sector.id === alert.sectorId)?.name || '-';
};

const getAlertDateKey = (alert: any) => {
  const rawDate = String(alert?.date || alert?.createdAt?.toDate?.()?.toISOString?.() || '');
  return rawDate.slice(0, 10);
};

const getShiftDateKey = (shift: any) => {
  if (shift?.year && shift?.month && shift?.day) {
    return `${String(shift.year).padStart(4, '0')}-${String(shift.month).padStart(2, '0')}-${String(shift.day).padStart(2, '0')}`;
  }
  return '';
};

const getAlertCreatedAtMillis = (alert: any) => {
  const createdAt = alert?.createdAt;
  if (createdAt?.toMillis) return createdAt.toMillis();
  if (typeof createdAt === 'string') {
    const parsed = new Date(createdAt);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }

  const fallback = alert?.date ? new Date(alert.date).getTime() : 0;
  return Number.isNaN(fallback) ? 0 : fallback;
};

const getViewedAtMillis = (value: string) => {
  if (!value) return 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const getAlertReason = (alert: any) => {
  if (alert?.reason) return String(alert.reason);
  const description = String(alert?.description || '');
  const match = description.match(/Motivo:\s*(.*)$/i);
  return match?.[1] || '';
};

const formatVacationDate = (value?: string | null) => {
  if (!value) return '-';

  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('pt-BR');
};

const PLANNER_DATA = [
  {
    id: 1,
    name: 'Alex Johnson',
    role: 'Supervisor',
    avatar: null,
    shifts: [
      { day: 1, type: 'day', time: '08:00' },
      { day: 2, type: 'day', time: '08:00' },
      { day: 3, type: 'day', time: '08:00', overtime: true },
      { day: 4, type: 'empty' },
      { day: 5, type: '12x36', time: '08:00' },
      { day: 6, type: 'off_taken' },
      { day: 7, type: 'off_taken' },
      { day: 8, type: 'day', time: '08:00' },
      { day: 9, type: 'vacation' },
      { day: 10, type: 'vacation' },
    ]
  },
  {
    id: 2,
    name: 'Sarah Chen',
    role: 'Técnico',
    avatar: null,
    shifts: [
      { day: 1, type: 'empty' },
      { day: 2, type: 'night', time: '22:00' },
      { day: 3, type: 'night', time: '22:00' },
      { day: 4, type: 'night', time: '22:00' },
      { day: 5, type: 'empty' },
      { day: 6, type: 'off_taken', label: 'Folga Tirada' },
      { day: 7, type: 'empty' },
      { day: 8, type: 'empty' },
      { day: 9, type: 'empty' },
      { day: 10, type: 'night', time: '22:00' },
    ]
  },
  {
    id: 3,
    name: 'Marcus Wright',
    role: 'Operador',
    avatar: null,
    shifts: [
      { day: 1, type: '12x36', time: '08:00' },
      { day: 2, type: 'empty' },
      { day: 3, type: '12x36', time: '08:00' },
      { day: 4, type: 'empty' },
      { day: 5, type: '12x36', time: '08:00' },
      { day: 6, type: 'empty' },
      { day: 7, type: '12x36', time: '08:00' },
      { day: 8, type: 'empty' },
      { day: 9, type: '12x36', time: '08:00' },
      { day: 10, type: 'empty' },
    ]
  }
];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick, badge, darkMode }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
      active 
        ? darkMode ? "bg-primary/20 text-primary font-semibold" : "bg-primary/10 text-primary font-semibold" 
        : darkMode ? "text-slate-400 hover:bg-slate-800 hover:text-slate-100" : "text-slate-600 hover:bg-slate-100"
    )}
  >
    <Icon size={20} className={cn(active ? "text-primary" : darkMode ? "text-slate-500 group-hover:text-slate-300" : "text-slate-500 group-hover:text-slate-700")} />
    <span className="text-sm">{label}</span>
    {badge && (
      <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
        {badge}
      </span>
    )}
  </button>
);

const MetricCard = ({ icon: Icon, label, value, subValue, trend, trendColor, iconBg, iconColor, darkMode }: any) => (
  <div className={cn(
    "p-6 rounded-xl border shadow-sm",
    darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
  )}>
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-2 rounded-lg", iconBg)}>
        <Icon size={20} className={iconColor} />
      </div>
      {trend && (
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", trendColor)}>
          {trend}
        </span>
      )}
    </div>
    <p className={cn("text-sm font-medium", darkMode ? "text-slate-400" : "text-slate-500")}>{label}</p>
    <h3 className={cn("text-2xl font-bold mt-1", darkMode ? "text-white" : "text-slate-900")}>
      {value}
      {subValue && <span className="text-slate-400 text-lg font-normal">{subValue}</span>}
    </h3>
  </div>
);

const SHIFT_PRESETS = [
  { type: 'day', label: 'Manhã', time: '07:00', color: 'bg-blue-500 text-white' },
  { type: 'night', label: 'Tarde', time: '15:00', color: 'bg-orange-500 text-white' },
  { type: 'vacation', label: 'Férias', time: '-', color: 'bg-amber-500 text-white' },
  { type: 'absence', label: 'Falta', time: '-', color: 'bg-rose-500 text-white' },
  { type: 'off_worked', label: 'Folga Trabalhada', time: '-', color: 'bg-emerald-500 text-white' },
  { type: 'off_taken', label: 'Folga Tirada', time: '-', color: 'bg-red-500/10 text-red-600 border border-red-100' },
] as const;

const normalizeShiftType = (type: any) => {
  if (type === 'day' || type === 'Manhã') return 'day';
  if (type === 'night' || type === 'Tarde') return 'night';
  if (type === 'vacation' || type === 'Férias') return 'vacation';
  if (type === 'absence' || type === 'Falta') return 'absence';
  if (type === 'off_worked' || type === 'Folga Trabalhada') return 'off_worked';
  if (type === 'off_taken' || type === 'Folga Tirada' || type === 'off' || type === 'Folga') return 'off_taken';
  return type;
};

const SHIFT_LABELS: Record<string, string> = {
  day: 'Manhã',
  night: 'Tarde',
  vacation: 'Férias',
  absence: 'Falta',
  off_worked: 'Folga Trabalhada',
  off_taken: 'Folga Tirada',
};

const ShiftBadge = ({ type, time, overtime }: any) => {
  const normalizedType = normalizeShiftType(type);
  const labelMap: Record<string, string> = SHIFT_LABELS;
  const styles: Record<string, string> = {
    day: "bg-blue-500 text-white",
    night: "bg-orange-500 text-white",
    vacation: "bg-amber-500 text-white",
    absence: "bg-rose-500 text-white",
    off_worked: "bg-emerald-500 text-white",
    off_taken: "bg-red-500/10 text-red-600 border border-red-100",
    empty: "border-2 border-dashed border-slate-200 hover:bg-slate-50"
  };

  if (normalizedType === 'empty') {
    return (
      <div className={cn("h-10 rounded flex items-center justify-center text-slate-300 cursor-pointer transition-colors", styles.empty)}>
        <Plus size={14} />
      </div>
    );
  }

  if (normalizedType === 'off_taken') {
    return (
      <div className={cn("h-10 rounded text-[10px] p-1.5 font-bold flex items-center gap-1", styles.off_taken)}>
        <Ban size={12} />
        <span>Folga Tirada</span>
      </div>
    );
  }

  if (normalizedType === 'absence') {
    return (
      <div className={cn("h-10 rounded text-[10px] p-1.5 font-bold flex items-center gap-1", styles.absence)}>
        <UserMinus size={12} />
        <span>Falta</span>
      </div>
    );
  }

  return (
    <div className={cn("h-10 rounded text-[10px] p-1.5 font-bold shadow-sm cursor-move relative", styles[normalizedType] || "bg-slate-100 text-slate-400") }>
      <span>{time}</span>
      <br />
      <span>{labelMap[normalizedType] || normalizedType}</span>
      {overtime && <Zap size={10} className="absolute bottom-1 right-1 fill-current" />}
      {normalizedType === 'vacation' && <Umbrella size={12} className="absolute bottom-1 right-1" />}
      {normalizedType === 'off_worked' && <Users size={12} className="absolute bottom-1 right-1" />}
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [plannerViewMode, setPlannerViewMode] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  const [activeActionMenu, setActiveActionMenu] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAlphabetical, setSortAlphabetical] = useState(false);
  const [isSeedConfirmOpen, setIsSeedConfirmOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [absencesViewedAt, setAbsencesViewedAt] = useState('');
  const [doubleShiftsViewedAt, setDoubleShiftsViewedAt] = useState('');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const generatePDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    
    doc.setFontSize(18);
    doc.text(`Escala de Turnos - ${monthName}`, 14, 15);
    
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const daysToShow = plannerViewMode === 'monthly' ? daysInMonth : plannerViewMode === 'weekly' ? 7 : 1;
    
    const headers = [['Funcionário', ...Array.from({ length: daysToShow }, (_, i) => {
      const day = i + 1;
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      return date.toLocaleString('pt-BR', { weekday: 'short' }).substring(0, 1).toUpperCase() + day.toString().padStart(2, '0');
    })]];
    
    const body = filteredAndSortedEmployees
      .map(emp => {
      const row = [emp.name];
      emp.shifts.slice(0, daysToShow).forEach((shift: any) => {
        let typeLabel = '';
        switch(normalizeShiftType(shift.type)) {
          case 'day': typeLabel = 'D'; break;
          case 'night': typeLabel = 'N'; break;
          case '12x36': typeLabel = '12'; break;
          case 'vacation': typeLabel = 'F'; break;
          case 'absence': typeLabel = '!'; break;
          case 'off_worked': typeLabel = 'FT'; break;
          case 'off_taken': typeLabel = 'FTi'; break;
          default: typeLabel = '-';
        }
        row.push(typeLabel);
      });
        return row;
      });

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 25,
      styles: { fontSize: 7, cellPadding: 1, halign: 'center' },
      headStyles: { fillColor: [25, 93, 230], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35, halign: 'left' } },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { top: 20, right: 10, bottom: 10, left: 10 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index > 0) {
          const val = data.cell.raw;
          if (val === 'O') data.cell.styles.textColor = [239, 68, 68];
          if (val === 'F') data.cell.styles.textColor = [245, 158, 11];
          if (val === '12') data.cell.styles.textColor = [16, 185, 129];
        }
      }
    });

    // Add Special Schedules to PDF
    const currentMonthSpecial = specialSchedules.filter(s => {
      const [year, month, day] = s.date.split('-').map(Number);
      return (month - 1) === currentDate.getMonth() && year === currentDate.getFullYear();
    });

    if (currentMonthSpecial.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY || 30;
      doc.setFontSize(14);
      doc.text("Escalas Especiais / Eventos", 14, finalY + 15);
      
      autoTable(doc, {
        startY: finalY + 20,
        head: [['Evento', 'Data', 'Status']],
        body: currentMonthSpecial.map(s => {
          const [year, month, day] = s.date.split('-').map(Number);
          const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
          return [s.name, formattedDate, s.status];
        }),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [71, 85, 105] }
      });
    }

    doc.save(`escala-${monthName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    showToast("PDF gerado com sucesso!");
  };

  const generateIndividualPDF = (emp: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    
    doc.setFontSize(20);
    doc.setTextColor(25, 93, 230);
    doc.text(`Escala Individual - ${emp.name}`, 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Cargo: ${emp.role} | Mês: ${monthName}`, 14, 28);
    
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    const headers = [['Dia', 'Semana', 'Turno', 'Horário', 'Obs']];
    const body = emp.shifts.slice(0, daysInMonth).map((shift: any, i: number) => {
      const day = i + 1;
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayName = date.toLocaleString('pt-BR', { weekday: 'long' });
      
      let typeLabel = '';
      let timeLabel = shift.time || '-';
      
      switch(normalizeShiftType(shift.type)) {
        case 'day': typeLabel = 'Manhã'; break;
        case 'night': typeLabel = 'Tarde'; break;
        case '12x36': typeLabel = '12x36'; break;
        case 'vacation': typeLabel = 'Férias'; timeLabel = '-'; break;
        case 'absence': typeLabel = 'Falta'; timeLabel = '-'; break;
        case 'off_worked': typeLabel = 'Folga Trabalhada'; timeLabel = '-'; break;
        case 'off_taken': typeLabel = 'Folga Tirada'; timeLabel = '-'; break;
        case 'empty': typeLabel = '-'; timeLabel = '-'; break;
        default: typeLabel = shift.type;
      }
      
      return [
        day.toString().padStart(2, '0'),
        dayName.charAt(0).toUpperCase() + dayName.slice(1),
        typeLabel,
        timeLabel,
        shift.overtime ? 'Hora Extra' : ''
      ];
    });

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 35,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [25, 93, 230], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      didParseCell: (data) => {
        if (data.section === 'body') {
          if (data.row.cells[2].raw === 'Folga Tirada') {
            data.cell.styles.textColor = [239, 68, 68];
          }
          if (data.row.cells[2].raw === 'Férias') {
            data.cell.styles.textColor = [245, 158, 11];
          }
          if (data.row.cells[2].raw === 'Falta') {
            data.cell.styles.textColor = [190, 18, 60];
          }
        }
      }
    });

    doc.save(`escala-${emp.name.toLowerCase().replace(/\s+/g, '-')}-${monthName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    showToast(`Escala de ${emp.name} gerada!`);
  };

  // --- State for CRUD ---
  const [employees, setEmployees] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [doubleShifts, setDoubleShifts] = useState(DOUBLE_SHIFTS);
  const [vacations, setVacations] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const [specialSchedules, setSpecialSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailActive, setIsEmailActive] = useState(false);
  const [rhEmail, setRhEmail] = useState('rh@talhodelicatessen.com.br');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [selectedEmployeesForSpecial, setSelectedEmployeesForSpecial] = useState<number[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [plannerSectorFilter, setPlannerSectorFilter] = useState<string>('all');
  const [isShiftPickerOpen, setIsShiftPickerOpen] = useState(false);
  const [shiftPickerTarget, setShiftPickerTarget] = useState<{ empId: string; dayIndex: number } | null>(null);
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [reportRowsCache, setReportRowsCache] = useState<{
    absences: Array<Record<string, string>>;
    double_shifts: Array<Record<string, string>>;
    overtime: Array<Record<string, string>>;
  }>({
    absences: [],
    double_shifts: [],
    overtime: [],
  });
  const [isPreparingReports, setIsPreparingReports] = useState(false);

  const getFriendlyAuthError = (error: unknown, action: 'google' | 'email' | 'reset') => {
    const code = typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code || '')
      : '';
    const rawMessage = typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: string }).message || '')
      : String(error);

    const commonFix = 'Verifique no Firebase Console se o provedor está habilitado e se o domínio da Vercel está em Authorized domains.';

    const messages: Record<string, string> = {
      'auth/popup-blocked': 'O navegador bloqueou a janela de login do Google. Tente novamente ou permita pop-ups.',
      'auth/popup-closed-by-user': 'A janela de login do Google foi fechada antes de concluir.',
      'auth/cancelled-popup-request': 'Outra tentativa de login com Google já estava em andamento.',
      'auth/unauthorized-domain': `Este domínio não está autorizado no Firebase Auth. ${commonFix}`,
      'auth/operation-not-allowed': 'Este método de autenticação não está habilitado no Firebase Authentication.',
      'auth/configuration-not-found': 'O Firebase Auth deste projeto não está configurado corretamente. Ative Authentication no Console e habilite Google e Email/Password.',
      'auth/account-exists-with-different-credential': 'Já existe uma conta com este e-mail usando outro método de login.',
      'auth/invalid-email': 'O e-mail informado é inválido.',
      'auth/user-not-found': 'Nenhuma conta foi encontrada com esse e-mail.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/invalid-credential': 'Credenciais inválidas. Verifique o e-mail e a senha.',
      'auth/user-disabled': 'Esta conta foi desativada.',
      'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco antes de tentar de novo.',
      'auth/network-request-failed': 'Falha de rede ao tentar autenticar.',
      'auth/expired-action-code': 'O link ou código de redefinição de senha expirou.',
      'auth/invalid-action-code': 'O link ou código de redefinição de senha é inválido.',
    };

    const contextual: Record<typeof action, string> = {
      google: 'Falha ao entrar com Google',
      email: 'Falha ao entrar com e-mail e senha',
      reset: 'Falha ao enviar a redefinição de senha',
    };

    const detail = messages[code] || rawMessage;
    return `${contextual[action]}${detail ? `: ${detail}` : ''}`;
  };

  const filteredAndSortedEmployees = useMemo(() => {
    let result = employees.map(emp => ({
      ...emp,
      role: roles.find(r => r.id === emp.roleId)?.name || 'N/A'
    })).filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (plannerSectorFilter !== 'all') {
      result = result.filter(e => e.sectorId === plannerSectorFilter);
    }

    if (sortAlphabetical) {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [employees, searchQuery, sortAlphabetical, plannerSectorFilter, roles]);

  const absenceAlerts = useMemo(() => {
    return alerts.filter(alert => alert.type === 'error');
  }, [alerts]);

  const doubleShiftAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const title = String(alert.title || '');
      return alert.type === 'warning' && (title.startsWith('Dobra:') || title.startsWith('Folga Trabalhada:'));
    });
  }, [alerts]);

  const overtimeAlerts = useMemo(() => {
    return alerts.filter(alert => alert.type === 'warning' && !String(alert.title || '').startsWith('Dobra:'));
  }, [alerts]);

  const unreadAbsenceAlerts = useMemo(() => {
    if (!currentUser?.isMaster) return [];
    const viewedAtMillis = getViewedAtMillis(absencesViewedAt);
    return absenceAlerts.filter(alert => getAlertCreatedAtMillis(alert) > viewedAtMillis);
  }, [absenceAlerts, absencesViewedAt, currentUser?.isMaster]);

  const unreadDoubleShiftAlerts = useMemo(() => {
    if (!currentUser?.isMaster) return [];
    const viewedAtMillis = getViewedAtMillis(doubleShiftsViewedAt);
    return doubleShiftAlerts.filter(alert => getAlertCreatedAtMillis(alert) > viewedAtMillis);
  }, [doubleShiftAlerts, doubleShiftsViewedAt, currentUser?.isMaster]);

  const notificationFeed = useMemo(() => {
    if (!currentUser?.isMaster) return [];

    const normalizeNotification = (alert: any, kind: 'absences' | 'double_shifts') => ({
      alert,
      kind,
      title: kind === 'absences' ? (alert?.title || 'Falta') : (alert?.title || 'Dobra'),
      detail: kind === 'absences'
        ? (getAlertReason(alert) || 'Sem motivo')
        : (alert?.description || alert?.message || 'Sem detalhes'),
    });

    return [
      ...unreadAbsenceAlerts.map(alert => normalizeNotification(alert, 'absences')),
      ...unreadDoubleShiftAlerts.map(alert => normalizeNotification(alert, 'double_shifts')),
    ].sort((left, right) => getAlertCreatedAtMillis(right.alert) - getAlertCreatedAtMillis(left.alert));
  }, [currentUser?.isMaster, unreadAbsenceAlerts, unreadDoubleShiftAlerts]);

  const matchesReportPeriod = (alert: any) => {
    const dateKey = getAlertDateKey(alert);
    if (!dateKey) return true;
    if (reportDateFrom && dateKey < reportDateFrom) return false;
    if (reportDateTo && dateKey > reportDateTo) return false;
    return true;
  };

  const filteredAbsenceAlerts = useMemo(
    () => absenceAlerts.filter(matchesReportPeriod),
    [absenceAlerts, reportDateFrom, reportDateTo]
  );

  const filteredDoubleShiftAlerts = useMemo(
    () => doubleShiftAlerts.filter(matchesReportPeriod),
    [doubleShiftAlerts, reportDateFrom, reportDateTo]
  );

  const filteredOvertimeAlerts = useMemo(
    () => overtimeAlerts.filter(matchesReportPeriod),
    [overtimeAlerts, reportDateFrom, reportDateTo]
  );

  const canManageVacations = useMemo(() => {
    return currentUser?.isMaster || normalizeAccessRole(currentUser?.role) === 'admin';
  }, [currentUser?.isMaster, currentUser?.role]);

  const canManageIncidentRecords = useMemo(() => {
    return currentUser?.isMaster || normalizeAccessRole(currentUser?.role) === 'admin';
  }, [currentUser?.isMaster, currentUser?.role]);

  const vacationsBySector = useMemo(() => {
    const bucket = new Map<string, any[]>();
    sectors.forEach(sector => bucket.set(sector.id, []));
    bucket.set('sem-setor', []);

    vacations
      .slice()
      .sort((a, b) => String(a.startDate || '').localeCompare(String(b.startDate || '')))
      .forEach(vacation => {
        const key = vacation.sectorId || 'sem-setor';
        if (!bucket.has(key)) bucket.set(key, []);
        bucket.get(key)?.push(vacation);
      });

    return bucket;
  }, [sectors, vacations]);

  // Error handling for Firestore
  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  const getAvatarUrl = (_url: string | undefined | null, seed: string = 'user') => {
    const initials = seed
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'U';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="50" fill="#E2E8F0"/>
        <circle cx="50" cy="42" r="16" fill="#94A3B8"/>
        <path d="M22 82c4-14 16-22 28-22s24 8 28 22" fill="#94A3B8"/>
        <text x="50" y="92" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#475569">${initials}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Ignore idle stream cancellation errors as they are transient and handled by the SDK
    if (errorMessage.includes('Disconnecting idle stream') || 
        errorMessage.includes('Timed out waiting for new targets') ||
        errorMessage.includes('CANCELLED')) {
      console.warn('Firestore stream disconnected (benign):', errorMessage);
      return;
    }

    const errInfo = {
      error: errorMessage,
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  const handleGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      try {
        await signInWithPopup(auth, provider);
        showToast('Bem-vindo!');
      } catch (error) {
        const code = typeof error === 'object' && error && 'code' in error
          ? String((error as { code?: string }).code || '')
          : '';
        if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
          await signInWithRedirect(auth, provider);
          showToast('Redirecionando para o login do Google...');
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error("Login error:", error);
      showToast(getFriendlyAuthError(error, 'google'), "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, loginData.email.trim(), loginData.password);
      showToast(`Bem-vindo!`);
    } catch (error) {
      console.error("Login error:", error);
      showToast(getFriendlyAuthError(error, 'email'), "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = loginData.email.trim();
    if (!email) {
      showToast("Digite seu e-mail para redefinir a senha", "error");
      return;
    }

    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("E-mail de redefinição enviado");
    } catch (error) {
      console.error("Password reset error:", error);
      showToast(getFriendlyAuthError(error, 'reset'), "error");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      showToast("Sessão encerrada");
    } catch (error) {
      showToast("Erro ao sair", "error");
    }
  };

  useEffect(() => {
    let userDocUnsub: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (userDocUnsub) {
        userDocUnsub();
        userDocUnsub = null;
      }

      if (user) {
        // Check if user exists in Firestore, if not create them
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          const userCanBeMaster = isMasterEmail(user.email);

          if (!userDoc.exists()) {
            const newUser = {
              uid: user.uid,
              name: user.displayName || (userCanBeMaster ? 'Master' : 'Usuário'),
              email: user.email || '',
              role: userCanBeMaster ? 'admin' : 'user',
              isMaster: userCanBeMaster,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            await setDoc(userRef, newUser);
          } else if (userCanBeMaster && (!userDoc.data().isMaster || userDoc.data().role !== 'admin')) {
            await setDoc(userRef, {
              ...userDoc.data(),
              role: 'admin',
              isMaster: true,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }

          const userUnsub = onSnapshot(userRef, (snapshot) => {
            if (!snapshot.exists()) return;
            const data = snapshot.data();
            setCurrentUser({
              ...data,
              uid: user.uid,
              email: user.email || data.email || '',
              name: user.displayName || data.name || (userCanBeMaster ? 'Master' : 'Usuário'),
              role: userCanBeMaster ? 'admin' : normalizeAccessRole(data.role),
              isMaster: userCanBeMaster || data.isMaster || data.role === 'admin',
            });
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          });

          userDocUnsub = userUnsub;
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthReady(true);
    });
    return () => {
      if (userDocUnsub) {
        userDocUnsub();
      }
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const consumeRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          showToast('Login com Google concluído!');
        }
      } catch (error) {
        console.error('Redirect login error:', error);
        showToast(getFriendlyAuthError(error, 'google'), 'error');
      }
    };

    void consumeRedirectResult();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadEmailStatus = async () => {
      try {
        const response = await fetch('/api/email-status', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setIsEmailActive(Boolean(data?.active));
      } catch {
        if (!cancelled) setIsEmailActive(false);
      }
    };

    void loadEmailStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle ChunkLoadError
  useEffect(() => {
    const handleChunkError = (e: ErrorEvent) => {
      if (e.message?.includes('Loading chunk') || e.message?.includes('Failed to load chunk')) {
        console.warn('ChunkLoadError detected, reloading page...');
        window.location.reload();
      }
    };
    window.addEventListener('error', handleChunkError);
    return () => window.removeEventListener('error', handleChunkError);
  }, []);

  // Real-time listeners for Firestore (Static Data)
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;

    const unsubscribers: (() => void)[] = [];

    // Listen to sectors
    const sectorsUnsub = onSnapshot(collection(db, 'sectors'), (snapshot) => {
      setSectors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sectors'));
    unsubscribers.push(sectorsUnsub);

    // Listen to roles
    const rolesUnsub = onSnapshot(collection(db, 'roles'), (snapshot) => {
      setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'roles'));
    unsubscribers.push(rolesUnsub);

    if (currentUser?.isMaster) {
      // Master-only collections expose user/admin metadata and system config.
      const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        setAppUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
      unsubscribers.push(usersUnsub);

      const configUnsub = onSnapshot(collection(db, 'config'), (snapshot) => {
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (doc.id === 'rh_email') setRhEmail(data.value);
          if (doc.id === 'dark_mode') setDarkMode(data.value === 'true');
          if (doc.id === 'email_notifications') setEmailNotifications(data.value === 'true');
          if (doc.id === 'notification_absences_viewed_at') setAbsencesViewedAt(String(data.value || ''));
          if (doc.id === 'notification_double_shifts_viewed_at') setDoubleShiftsViewedAt(String(data.value || ''));
        });
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'config'));
      unsubscribers.push(configUnsub);
    }

    // Listen to special schedules
    const specialUnsub = onSnapshot(collection(db, 'special_schedules'), (snapshot) => {
      setSpecialSchedules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'special_schedules'));
    unsubscribers.push(specialUnsub);

    // Listen to alerts
    const alertsUnsub = onSnapshot(collection(db, 'alerts'), (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'alerts'));
    unsubscribers.push(alertsUnsub);

    if (canManageVacations) {
      const vacationsUnsub = onSnapshot(collection(db, 'vacations'), (snapshot) => {
        setVacations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'vacations'));
      unsubscribers.push(vacationsUnsub);
    } else {
      setVacations([]);
    }

    return () => unsubscribers.forEach(unsub => unsub());
  }, [currentUser?.uid, currentUser?.role, currentUser?.isMaster, isAuthReady, canManageVacations]);

  // Real-time listeners for Firestore (Dynamic Data - Employees & Shifts)
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;

    setIsLoading(true);

    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    // Listen to employees and their shifts efficiently
    let currentEmployees: any[] = [];
    let currentShifts: any[] = [];

    const updateEmployeesWithShifts = () => {
      const employeesWithShifts = currentEmployees.map(emp => {
        const empShifts = currentShifts.filter(s => s.employeeId === emp.id);
        const shiftsMap = new Map();
        empShifts.forEach(s => shiftsMap.set(s.day, s));

        const shiftsArray = Array.from({ length: 31 }, (_, i) => {
          const day = i + 1;
          return shiftsMap.get(day) || { type: 'empty' };
        });

        return { ...emp, shifts: shiftsArray };
      });
      setEmployees(employeesWithShifts);
      setIsLoading(false);
    };

    const employeesUnsub = onSnapshot(collection(db, 'employees'), (snapshot) => {
      currentEmployees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateEmployeesWithShifts();
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'employees'));

    const shiftsQuery = query(
      collectionGroup(db, 'shifts'),
      where('month', '==', month),
      where('year', '==', year)
    );

    const shiftsUnsub = onSnapshot(shiftsQuery, (snapshot) => {
      currentShifts = snapshot.docs.map(doc => ({
        id: doc.id,
        employeeId: doc.ref.parent.parent?.id,
        ...doc.data()
      }));
      updateEmployeesWithShifts();
    }, (error) => {
      console.error('Error fetching shifts via collectionGroup:', error);
      handleFirestoreError(error, OperationType.LIST, 'collectionGroup/shifts');
    });

    return () => {
      employeesUnsub();
      shiftsUnsub();
    };
  }, [currentDate.getMonth(), currentDate.getFullYear(), currentUser?.uid, isAuthReady]);

  // Modals state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSpecialScheduleModalOpen, setIsSpecialScheduleModalOpen] = useState(false);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
    const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
    const [isDoubleShiftModalOpen, setIsDoubleShiftModalOpen] = useState(false);
    const [isOvertimeModalOpen, setIsOvertimeModalOpen] = useState(false);
    const [isSubmittingAbsence, setIsSubmittingAbsence] = useState(false);
    const [isSubmittingDoubleShift, setIsSubmittingDoubleShift] = useState(false);
    const [isSubmittingOvertime, setIsSubmittingOvertime] = useState(false);
    const submissionLocks = useRef({
      absence: false,
      doubleShift: false,
      overtime: false,
    });
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [editingSector, setEditingSector] = useState<any>(null);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingSpecialSchedule, setEditingSpecialSchedule] = useState<any>(null);
  const [editingVacation, setEditingVacation] = useState<any>(null);
  const [editingAbsenceAlert, setEditingAbsenceAlert] = useState<any>(null);
  const [editingDoubleShiftAlert, setEditingDoubleShiftAlert] = useState<any>(null);

  // CRUD Functions
  const addEmployee = async (employeeData: any) => {
    try {
      if (!employeeData.roleId) {
        showToast("Por favor, selecione um cargo válido.", "error");
        return;
      }
      
      const data = {
        name: employeeData.name,
        email: employeeData.email || '',
        roleId: employeeData.roleId,
        sectorId: employeeData.sectorId,
        updatedAt: serverTimestamp()
      };

      if (editingEmployee) {
        await updateDoc(doc(db, 'employees', editingEmployee.id), data);
        showToast("Colaborador atualizado!");
      } else {
        await addDoc(collection(db, 'employees'), {
          ...data,
          createdAt: serverTimestamp()
        });
        showToast("Colaborador adicionado!");
      }
      setIsEmployeeModalOpen(false);
      setEditingEmployee(null);
    } catch (e) { 
      handleFirestoreError(e, editingEmployee ? OperationType.UPDATE : OperationType.CREATE, 'employees');
    }
  };

  const addRole = async (roleData: any) => {
    try {
      if (editingRole) {
        await updateDoc(doc(db, 'roles', editingRole.id), roleData);
        showToast("Cargo atualizado!");
      } else {
        await addDoc(collection(db, 'roles'), roleData);
        showToast("Cargo adicionado!");
      }
      setIsRoleModalOpen(false);
      setEditingRole(null);
    } catch (e) {
      handleFirestoreError(e, editingRole ? OperationType.UPDATE : OperationType.CREATE, 'roles');
    }
  };

  const deleteRole = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'roles', id));
      showToast("Cargo removido");
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `roles/${id}`);
    }
  };

  const addUser = async (userData: any) => {
    try {
      const normalizedRole = normalizeAccessRole(userData.role);
      if (editingUser) {
        await setDoc(doc(db, 'users', editingUser.id), {
          uid: editingUser.uid,
          name: userData.name,
          email: editingUser.email,
          role: normalizedRole,
          avatar: editingUser.avatar ?? null,
          isMaster: editingUser.isMaster || isMasterEmail(editingUser.email),
          createdAt: editingUser.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        showToast("Usuário atualizado!");
      } else {
        showToast("Novos usuários devem fazer login com Google primeiro para serem registrados.", "info");
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
    } catch (e) {
      handleFirestoreError(e, editingUser ? OperationType.UPDATE : OperationType.CREATE, 'users');
    }
  };

  const seedDatabase = async () => {
    console.log("Starting database seeding from spreadsheet...");
    try {
      setIsLoading(true);
      const batch = writeBatch(db);

      console.log("Seeding sectors...");
      for (const sector of seedSectors) {
        batch.set(doc(db, 'sectors', sector.id), {
          name: sector.name,
          color: sector.color,
          icon: sector.icon,
          updatedAt: serverTimestamp(),
        });
      }

      console.log("Seeding roles...");
      for (const role of seedRoles) {
        batch.set(doc(db, 'roles', role.id), {
          name: role.name,
          updatedAt: serverTimestamp(),
        });
      }

      console.log("Seeding employees...");
      for (const employee of seedEmployees) {
        batch.set(doc(db, 'employees', employee.id), {
          name: employee.name,
          sectorId: employee.sectorId,
          roleId: employee.roleId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      console.log("Seeding default config...");
      batch.set(doc(db, 'config', 'rh_email'), { value: seedConfig.rh_email });
      batch.set(doc(db, 'config', 'email_notifications'), { value: seedConfig.email_notifications });
      batch.set(doc(db, 'config', 'dark_mode'), { value: seedConfig.dark_mode });

      await batch.commit();
      showToast("Base da planilha importada com sucesso!");
    } catch (e) {
      console.error("Error seeding database:", e);
      handleFirestoreError(e, OperationType.WRITE, 'seed');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      showToast("Usuário removido");
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${id}`);
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'employees', id));
      showToast("Colaborador removido.");
    } catch (e) { 
      handleFirestoreError(e, OperationType.DELETE, `employees/${id}`);
    }
  };

  const addSector = async (name: string) => {
    try {
      if (editingSector) {
        await updateDoc(doc(db, 'sectors', editingSector.id), { name });
        showToast("Setor atualizado.");
      } else {
        await addDoc(collection(db, 'sectors'), { name });
        showToast("Setor criado.");
      }
      setIsSectorModalOpen(false);
      setEditingSector(null);
    } catch (e) { 
      handleFirestoreError(e, editingSector ? OperationType.UPDATE : OperationType.CREATE, 'sectors');
    }
  };

  const deleteSector = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'sectors', id));
      showToast("Setor removido.");
    } catch (e) { 
      handleFirestoreError(e, OperationType.DELETE, `sectors/${id}`);
    }
  };

  const addSpecialSchedule = async (schedule: any) => {
    try {
      const payload = { 
        ...schedule, 
        employeeIds: selectedEmployeesForSpecial,
        updatedAt: serverTimestamp()
      };
      if (editingSpecialSchedule) {
        await updateDoc(doc(db, 'special_schedules', editingSpecialSchedule.id), payload);
        showToast("Escala especial atualizada.");
      } else {
        await addDoc(collection(db, 'special_schedules'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        showToast("Escala especial criada.");
      }
      setIsSpecialScheduleModalOpen(false);
      setEditingSpecialSchedule(null);
      setSelectedEmployeesForSpecial([]);
    } catch (e) { 
      handleFirestoreError(e, editingSpecialSchedule ? OperationType.UPDATE : OperationType.CREATE, 'special_schedules');
    }
  };

  const openNewSpecialScheduleModal = () => {
    setEditingSpecialSchedule(null);
    setSelectedEmployeesForSpecial([]);
    setIsSpecialScheduleModalOpen(true);
  };

  const openEditSpecialScheduleModal = (schedule: any) => {
    setEditingSpecialSchedule(schedule);
    setSelectedEmployeesForSpecial((schedule.employees || []).map((e: any) => e.id));
    setIsSpecialScheduleModalOpen(true);
  };

  const saveConfig = async (key: string, value: string, silent = false) => {
    try {
      await setDoc(doc(db, 'config', key), { value, updatedAt: serverTimestamp() });
      if (!silent) showToast("Configuração salva!");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `config/${key}`);
    }
  };

  const markAlertNotificationsAsViewed = async (kind: 'absences' | 'double_shifts') => {
    if (!currentUser?.isMaster) return;

    const viewedAt = new Date().toISOString();
    if (kind === 'absences') {
      setAbsencesViewedAt(viewedAt);
      await saveConfig('notification_absences_viewed_at', viewedAt, true);
      return;
    }

    setDoubleShiftsViewedAt(viewedAt);
    await saveConfig('notification_double_shifts_viewed_at', viewedAt, true);
  };

  const handleBellClick = async () => {
    if (!currentUser?.isMaster) {
      showToast('As notificações em aberto ficam disponíveis para a conta master.', 'info');
      return;
    }

    if (!isNotificationMenuOpen) {
      await Promise.all([
        markAlertNotificationsAsViewed('absences'),
        markAlertNotificationsAsViewed('double_shifts'),
      ]);
    }

    setIsNotificationMenuOpen(prev => !prev);
  };

  const logAlertAudit = async (action: 'delete' | 'replace', alert: any, details?: string) => {
    if (!currentUser?.isMaster || !alert?.id) return;

    await setDoc(doc(collection(db, 'audit_logs')), {
      entity: 'alerts',
      action,
      alertId: String(alert.id),
      alertType: String(alert.type || ''),
      alertTitle: String(alert.title || ''),
      alertDescription: String(alert.description || alert.message || ''),
      alertDate: String(alert.date || ''),
      employeeId: String(alert.employeeId || ''),
      sectorId: String(alert.sectorId || ''),
      reason: String(alert.reason || ''),
      details: details || '',
      performedByUid: currentUser.uid || '',
      performedByName: currentUser.name || '',
      performedByEmail: currentUser.email || '',
      createdAt: serverTimestamp()
    });
  };

  const deleteAlertWithAudit = async (alert: any, action: 'delete' | 'replace', details?: string) => {
    await logAlertAudit(action, alert, details);
    await deleteDoc(doc(db, 'alerts', alert.id));
  };

  const deleteSpecialSchedule = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'special_schedules', id));
      showToast("Escala especial removida.");
    } catch (e) { 
      handleFirestoreError(e, OperationType.DELETE, `special_schedules/${id}`);
    }
  };

  const createAuditLogEntry = (payload: Record<string, any>) => {
    return setDoc(doc(collection(db, 'audit_logs')), {
      ...payload,
      createdAt: serverTimestamp()
    });
  };

  const addVacation = async (vacationData: any) => {
    if (!canManageVacations) {
      showToast("Você não tem permissão para gerenciar férias.", "error");
      return;
    }

    try {
      const employeeName = String(vacationData.employeeName || '').trim();
      const startDate = String(vacationData.startDate || '').trim();
      const endDate = String(vacationData.endDate || '').trim();
      const notes = String(vacationData.notes || '').trim();
      const normalizedEmployeeName = employeeName.toLowerCase();
      const employee = employees.find(emp => {
        const name = String(emp.name || '').trim().toLowerCase();
        return name === normalizedEmployeeName;
      });
      const employeeSector = employee
        ? sectors.find(item => item.id === employee.sectorId)
        : null;
      const fallbackSector = sectors.find(item => item.id === String(vacationData.sectorId || '').trim()) || sectors[0] || null;
      const sector = employeeSector || fallbackSector;

      if (!employeeName) {
        showToast("Informe o nome do colaborador.", "error");
        return;
      }

      if (!sector) {
        showToast("Não foi possível identificar um setor para este cadastro.", "error");
        return;
      }

      if (!startDate || !endDate) {
        showToast("Informe o período completo das férias.", "error");
        return;
      }

      if (new Date(`${startDate}T00:00:00`) > new Date(`${endDate}T23:59:59`)) {
        showToast("A data de início precisa ser anterior à data final.", "error");
        return;
      }

      const payload = {
        employeeId: employee?.id || employeeName,
        employeeName,
        sectorId: sector.id,
        sectorName: sector.name,
        startDate,
        endDate,
        notes,
        updatedAt: serverTimestamp(),
      };

      if (editingVacation) {
        await setDoc(doc(db, 'vacations', editingVacation.id), {
          ...payload,
          createdAt: editingVacation.createdAt || serverTimestamp(),
        }, { merge: true });
        showToast("Férias atualizadas!");
      } else {
        await addDoc(collection(db, 'vacations'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        showToast("Férias registradas!");
      }

      setIsVacationModalOpen(false);
      setEditingVacation(null);
    } catch (e) {
      handleFirestoreError(e, editingVacation ? OperationType.UPDATE : OperationType.CREATE, 'vacations');
    }
  };

  const deleteVacation = async (id: string) => {
    if (!canManageVacations) {
      showToast("Você não tem permissão para excluir férias.", "error");
      return;
    }

    try {
      await deleteDoc(doc(db, 'vacations', id));
      showToast("Férias removidas.");
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `vacations/${id}`);
    }
  };

  const openNewAbsenceModal = () => {
    setEditingAbsenceAlert(null);
    setIsAbsenceModalOpen(true);
  };

  const openEditAbsenceModal = (alert: any) => {
    setEditingAbsenceAlert(alert);
    setIsAbsenceModalOpen(true);
  };

  const openNewDoubleShiftModal = () => {
    setEditingDoubleShiftAlert(null);
    setIsDoubleShiftModalOpen(true);
  };

  const openEditDoubleShiftModal = (alert: any) => {
    setEditingDoubleShiftAlert(alert);
    setIsDoubleShiftModalOpen(true);
  };

  const openNewVacationModal = () => {
    setEditingVacation(null);
    setIsVacationModalOpen(true);
  };

  const openEditVacationModal = (vacation: any) => {
    setEditingVacation(vacation);
    setIsVacationModalOpen(true);
  };

  const applyShiftLocally = (empId: string, dayIndex: number, newShift: any) => {
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === empId
          ? {
              ...emp,
              shifts: Array.isArray(emp.shifts)
                ? emp.shifts.map((shift: any, index: number) =>
                    index === dayIndex
                      ? (newShift.type === 'empty'
                          ? { type: 'empty' }
                          : { type: newShift.type, time: newShift.time, overtime: !!newShift.overtime })
                      : shift
                  )
                : emp.shifts,
            }
          : emp
      )
    );
  };

  const updateShift = async (empId: string, dayIndex: number, newShift: any) => {
    try {
      const day = dayIndex + 1;
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const shiftId = `${year}-${month}-${day}`;
      const shiftRef = doc(db, `employees/${empId}/shifts`, shiftId);
      const employee = employees.find(emp => emp.id === empId);
      const currentShift = employee?.shifts?.[dayIndex];
      const normalizedType = normalizeShiftType(newShift.type);
      const currentShiftType = normalizeShiftType(currentShift?.type);
      const batch = writeBatch(db);
      const shiftLogRef = doc(collection(db, 'audit_logs'));

      if (normalizedType === 'empty') {
        batch.delete(shiftRef);
        batch.set(shiftLogRef, {
          entity: 'shifts',
          action: 'delete',
          employeeId: empId,
          employeeName: employee?.name || '',
          day,
          month,
          year,
          previousType: currentShiftType || '',
          nextType: 'empty',
          details: 'Escala removida pela interface.',
          performedByUid: currentUser?.uid || '',
          performedByName: currentUser?.name || '',
          performedByEmail: currentUser?.email || '',
          updatedAt: serverTimestamp()
        });
        if (currentShiftType === 'absence') {
          batch.delete(doc(db, 'alerts', `absence_${empId}_${String(year)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`));
        }
        applyShiftLocally(empId, dayIndex, newShift);
        await batch.commit();
        showToast("Escala removida.");
        return;
      }

      batch.set(shiftRef, {
        employeeId: empId,
        day,
        month,
        year,
        type: normalizedType,
        time: newShift.time,
        overtime: !!newShift.overtime,
        updatedAt: serverTimestamp()
      });

      batch.set(shiftLogRef, {
        entity: 'shifts',
        action: currentShiftType ? 'update' : 'create',
        employeeId: empId,
        employeeName: employee?.name || '',
        day,
        month,
        year,
        previousType: currentShiftType || '',
        nextType: normalizedType,
        details: `Alteração de escala para ${SHIFT_LABELS[normalizedType] || normalizedType}.`,
        performedByUid: currentUser?.uid || '',
        performedByName: currentUser?.name || '',
        performedByEmail: currentUser?.email || '',
        updatedAt: serverTimestamp()
      });

      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const absenceAlertRef = doc(db, 'alerts', `absence_${empId}_${dateString}`);
      const workedOffAlertRef = doc(db, 'alerts', `worked_off_${empId}_${dateString}`);
      if (normalizedType === 'absence') {
        batch.set(absenceAlertRef, {
          type: 'error',
          date: dateString,
          message: `Falta: ${employee?.name || 'Colaborador'} | Motivo: Lançada pela escala`,
          title: `Falta: ${employee?.name || 'Colaborador'}`,
          description: `Colaborador: ${employee?.name || 'Colaborador'} | Motivo: Lançada pela escala`,
          reason: 'Lançada pela escala',
          employeeId: empId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else if (currentShiftType === 'absence') {
        batch.delete(absenceAlertRef);
      }

      if (normalizedType === 'off_worked') {
        batch.set(workedOffAlertRef, {
          type: 'warning',
          date: dateString,
          message: `Folga Trabalhada: ${employee?.name || 'Colaborador'} | Data: ${dateString} | Setor: ${getAlertSectorName({ sectorId: employee?.sectorId }, sectors)}`,
          title: `Folga Trabalhada: ${employee?.name || 'Colaborador'}`,
          description: `Colaborador: ${employee?.name || 'Colaborador'} | Data: ${dateString} | Setor: ${getAlertSectorName({ sectorId: employee?.sectorId }, sectors)}`,
          employeeId: empId,
          sectorId: employee?.sectorId || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else if (currentShiftType === 'off_worked') {
        batch.delete(workedOffAlertRef);
      }

      applyShiftLocally(empId, dayIndex, { type: normalizedType, time: newShift.time, overtime: !!newShift.overtime });
      await batch.commit();

      showToast("Escala atualizada!");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `employees/${empId}/shifts`);
    }
  };

  const removeAlert = async (id: string) => {
    if (!currentUser?.isMaster) {
      showToast("Apenas a conta master pode excluir esses registros.", "error");
      return;
    }

    try {
      const alertSnapshot = await getDoc(doc(db, 'alerts', id));
      if (alertSnapshot.exists()) {
        await deleteAlertWithAudit({ id, ...alertSnapshot.data() }, 'delete', 'Exclusão manual pela interface.');
      } else {
        await deleteDoc(doc(db, 'alerts', id));
      }
      showToast("Alerta removido.");
    } catch (e) { 
      handleFirestoreError(e, OperationType.DELETE, `alerts/${id}`);
    }
  };

  const registerAbsence = async (employeeId: string, date: string, reason: string) => {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) return;
      if (!canManageIncidentRecords) {
        showToast("Você não tem permissão para lançar faltas retroativas.", "error");
        return;
      }
      if (!date) {
        showToast("Selecione a data da falta.", "error");
        return;
      }
      if (submissionLocks.current.absence) return;
      submissionLocks.current.absence = true;
      setIsSubmittingAbsence(true);

      try {
          const alertId = `absence_${employee.id}_${date}`;
          const alertRef = doc(db, 'alerts', alertId);
          const existingAlert = await getDoc(alertRef);
          if (existingAlert.exists() && editingAbsenceAlert?.id !== alertId) {
            const shouldOverwrite = window.confirm('Já existe uma falta lançada para este colaborador nesta data. Deseja atualizar este registro?');
            if (!shouldOverwrite) return;
          }
          const originalCreatedAt = editingAbsenceAlert?.createdAt || existingAlert.data()?.createdAt || serverTimestamp();

          const payload = {
            type: 'error',
            date,
            message: `Falta: ${employee.name} | Motivo: ${reason || 'Não informado'}`,
            title: `Falta: ${employee.name}`,
            description: `Colaborador: ${employee.name} | Motivo: ${reason || 'Não informado'}`,
            reason: reason || '',
            employeeId: employee.id,
            createdAt: originalCreatedAt
          };

          await setDoc(alertRef, payload);

          if (editingAbsenceAlert?.id && editingAbsenceAlert.id !== alertId) {
            await deleteAlertWithAudit(editingAbsenceAlert, 'replace', `Atualizado para ${alertId}.`);
          }

        showToast(editingAbsenceAlert ? 'Falta atualizada.' : 'Ausência registrada. Será enviada no resumo semanal de segunda-feira.');
        setEditingAbsenceAlert(null);
        setIsAbsenceModalOpen(false);
      } catch (e) { 
        handleFirestoreError(e, OperationType.CREATE, 'alerts');
      } finally {
        submissionLocks.current.absence = false;
        setIsSubmittingAbsence(false);
      }
    };
  
  const registerDoubleShift = async (employeeId: string, date: string, sectorId: string) => {
      const employee = employees.find(e => e.id === employeeId);
      const sector = sectors.find(s => s.id === sectorId);
      if (!employee || !sector) return;
      if (!canManageIncidentRecords) {
        showToast("Você não tem permissão para lançar dobras retroativas.", "error");
        return;
      }
      if (!date) {
        showToast("Selecione a data da dobra.", "error");
        return;
      }
      if (submissionLocks.current.doubleShift) return;
      submissionLocks.current.doubleShift = true;
      setIsSubmittingDoubleShift(true);

    try {
          const alertId = `double_${employee.id}_${date}_${sector.id}`;
          const alertRef = doc(db, 'alerts', alertId);
          const existingAlert = await getDoc(alertRef);
          if (existingAlert.exists() && editingDoubleShiftAlert?.id !== alertId) {
            const shouldOverwrite = window.confirm('Já existe uma dobra lançada para este colaborador nesta data. Deseja atualizar este registro?');
            if (!shouldOverwrite) return;
          }
          const originalCreatedAt = editingDoubleShiftAlert?.createdAt || existingAlert.data()?.createdAt || serverTimestamp();

          const payload = {
            type: 'warning',
            date,
            message: `Dobra: ${employee.name} | Data: ${date} | Setor: ${sector.name}`,
            title: `Dobra: ${employee.name}`,
            description: `Colaborador: ${employee.name} | Data: ${date} | Setor: ${sector.name}`,
            sectorId: sector.id,
            employeeId: employee.id,
            createdAt: originalCreatedAt
          };

          await setDoc(alertRef, payload);

          if (editingDoubleShiftAlert?.id && editingDoubleShiftAlert.id !== alertId) {
            await deleteAlertWithAudit(editingDoubleShiftAlert, 'replace', `Atualizado para ${alertId}.`);
          }
      
        showToast(editingDoubleShiftAlert ? 'Dobra atualizada.' : 'Dobra registrada. Será enviada no resumo semanal de segunda-feira.');
        setEditingDoubleShiftAlert(null);
        setIsDoubleShiftModalOpen(false);
      } catch (e) { 
        handleFirestoreError(e, OperationType.CREATE, 'alerts');
      } finally {
        submissionLocks.current.doubleShift = false;
        setIsSubmittingDoubleShift(false);
      }
    };

  const generateEmployeeReport = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Colaboradores", 14, 15);
    
    const tableData = employees.map(emp => [
      emp.name,
      roles.find((r: any) => r.id === emp.roleId)?.name || 'N/A',
      emp.sector || 'N/A'
    ]);

    autoTable(doc, {
      head: [['Nome', 'Cargo', 'Setor']],
      body: tableData,
      startY: 25,
    });

    doc.save("colaboradores.pdf");
    showToast("Relatório de colaboradores gerado!");
  };

  const generateShiftReport = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    doc.text(`Escala Mensal - ${monthName}`, 14, 15);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const headers = ['Colaborador', ...Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString())];
    
    const tableData = employees.map(emp => [
      emp.name,
      ...emp.shifts.slice(0, daysInMonth).map((s: any) => s.type === 'empty' ? '-' : s.type)
    ]);

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 25,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`escala_${monthName.replace(' ', '_')}.pdf`);
    showToast("Escala mensal gerada!");
  };

  const generateSpecialReport = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Escalas Especiais", 14, 15);

    const tableData = specialSchedules.map(schedule => [
      schedule.name,
      schedule.date,
      schedule.status,
      schedule.employees?.map((e: any) => e.name).join(', ') || 'Nenhum'
    ]);

    autoTable(doc, {
      head: [['Evento', 'Data', 'Status', 'Equipe']],
      body: tableData,
      startY: 25,
    });

    doc.save("escalas_especiais.pdf");
    showToast("Relatório de escalas especiais gerado!");
  };

  const buildSensitiveReportRows = async (kind: 'absences' | 'double_shifts' | 'overtime'): Promise<Array<Record<string, string>>> => {
    if (kind === 'double_shifts') {
      const [shiftResult, employeeResult, auditResult] = await Promise.allSettled([
        getDocs(collectionGroup(db, 'shifts')),
        getDocs(collection(db, 'employees')),
        getDocs(collection(db, 'audit_logs')),
      ]);

      const employeeLookup = new Map<string, { name: string; sectorId: string }>();
      if (employeeResult.status === 'fulfilled') {
        employeeResult.value.docs.forEach(employeeDoc => {
          const data = employeeDoc.data() as any;
          employeeLookup.set(employeeDoc.id, {
            name: String(data?.name || 'Colaborador'),
            sectorId: String(data?.sectorId || ''),
          });
        });
      }

      const shiftRows = shiftResult.status === 'fulfilled'
        ? shiftResult.value.docs.map(docSnap => {
            const shift = docSnap.data() as any;
            const normalizedType = normalizeShiftType(shift?.type);
            if (normalizedType !== 'off_worked') return null;
            const employeeId = String(shift?.employeeId || docSnap.ref.parent.parent?.id || '');
            const employee = employeeLookup.get(employeeId);
            const day = Number(shift?.day || 0);
            const month = Number(shift?.month || 0);
            const year = Number(shift?.year || 0);
            const dateKey = getShiftDateKey({ day, month, year });
            if (!dateKey) return null;
            const shiftCreatedAtMillis =
              Number(shift?.updatedAt?.toDate?.()?.getTime?.() || shift?.createdAt?.toDate?.()?.getTime?.() || 0);

            return {
              key: `${dateKey}|${employeeId}|Folga Trabalhada`,
              dateKey,
              createdAtMillis: shiftCreatedAtMillis || new Date(`${dateKey}T12:00:00`).getTime(),
              row: {
                Data: formatReportDate(dateKey),
                Colaborador: employee?.name || 'Colaborador',
                Setor: getAlertSectorName({ sectorId: employee?.sectorId }, sectors),
                Tipo: 'Folga Trabalhada',
              },
            };
          }).filter(Boolean) as Array<{ key: string; dateKey: string; createdAtMillis: number; row: Record<string, string> }>
        : [];

      const auditRows = auditResult.status === 'fulfilled'
        ? auditResult.value.docs
            .map(docSnap => {
              const log = docSnap.data() as any;
              if (String(log?.entity || '') !== 'shifts') return null;
              const normalizedType = normalizeShiftType(log?.nextType);
              if (normalizedType !== 'off_worked') return null;

              const employeeId = String(log?.employeeId || '');
              const employee = employeeLookup.get(employeeId);
              const day = Number(log?.day || 0);
              const month = Number(log?.month || 0);
              const year = Number(log?.year || 0);
              const dateKey = getShiftDateKey({ day, month, year });
              if (!dateKey) return null;

              return {
                key: `audit|${dateKey}|${employeeId}|Folga Trabalhada`,
                dateKey,
                createdAtMillis: getAlertCreatedAtMillis(log) || new Date(`${dateKey}T12:00:00`).getTime(),
                row: {
                  Data: formatReportDate(dateKey),
                  Colaborador: employee?.name || String(log?.employeeName || 'Colaborador'),
                  Setor: getAlertSectorName({ sectorId: employee?.sectorId }, sectors),
                  Tipo: 'Folga Trabalhada',
                },
              };
            })
            .filter(Boolean) as Array<{ key: string; dateKey: string; createdAtMillis: number; row: Record<string, string> }>
        : [];

      const alertRows = filteredDoubleShiftAlerts.map((alert: any) => {
        const title = String(alert.title || '');
        const isWorkedOff = title.startsWith('Folga Trabalhada:');
        const dateKey = getAlertDateKey(alert);
        return {
          key: `${dateKey}|${alert.employeeId || getAlertEmployeeName(alert, isWorkedOff ? 'Folga Trabalhada' : 'Dobra')}|${isWorkedOff ? 'Folga Trabalhada' : 'Dobra'}`,
          dateKey,
          createdAtMillis: getAlertCreatedAtMillis(alert),
          row: {
            Data: formatReportDate(alert.date || alert.createdAt?.toDate?.()?.toISOString?.()),
            Colaborador: isWorkedOff
              ? getAlertEmployeeName(alert, 'Folga Trabalhada')
              : getAlertEmployeeName(alert, 'Dobra'),
            Setor: getAlertSectorName(alert, sectors),
            Tipo: isWorkedOff ? 'Folga Trabalhada' : 'Dobra',
          },
        };
      });

      const mergedRows = [...shiftRows, ...auditRows, ...alertRows];
      const uniqueRows = mergedRows.reduce((acc, item) => {
        if (!acc.has(item.key)) acc.set(item.key, item);
        return acc;
      }, new Map<string, { key: string; dateKey: string; createdAtMillis: number; row: Record<string, string> }>());

      return Array.from(uniqueRows.values())
        .filter(item => !reportDateFrom || item.dateKey >= reportDateFrom)
        .filter(item => !reportDateTo || item.dateKey <= reportDateTo)
        .sort((left, right) => {
          const dateCompare = left.dateKey.localeCompare(right.dateKey);
          if (dateCompare !== 0) return dateCompare;
          if (left.createdAtMillis !== right.createdAtMillis) return left.createdAtMillis - right.createdAtMillis;
          return String(left.row.Colaborador || '').localeCompare(String(right.row.Colaborador || ''));
        })
        .map(item => item.row);
    }

    const records = kind === 'absences'
      ? filteredAbsenceAlerts
      : filteredOvertimeAlerts;

    return [...records]
      .sort((left, right) => {
        const dateCompare = getAlertDateKey(left).localeCompare(getAlertDateKey(right));
        if (dateCompare !== 0) return dateCompare;
        return getAlertCreatedAtMillis(left) - getAlertCreatedAtMillis(right);
      })
      .map((alert: any): Record<string, string> => {
        const employeeName =
          kind === 'absences'
            ? getAlertEmployeeName(alert, 'Falta')
            : getAlertEmployeeName(alert, 'Solicitação de Hora Extra');

        return {
          Data: formatReportDate(alert.date || alert.createdAt?.toDate?.()?.toISOString?.()),
          Colaborador: employeeName,
          Setor: getAlertSectorName(alert, sectors),
        };
      });
  };

  const refreshReportsCache = async () => {
    setIsPreparingReports(true);
    try {
      const [absences, doubleShifts, overtime] = await Promise.all([
        buildSensitiveReportRows('absences'),
        buildSensitiveReportRows('double_shifts'),
        buildSensitiveReportRows('overtime'),
      ]);
      setReportRowsCache({
        absences,
        double_shifts: doubleShifts,
        overtime,
      });
    } catch (error) {
      console.error('Failed to prepare reports cache:', error);
      showToast('Não foi possível preparar os relatórios no momento.', 'error');
    } finally {
      setIsPreparingReports(false);
    }
  };

  useEffect(() => {
    if (!isAuthReady || !currentUser) return;
    if (view !== 'reports' && view !== 'absences' && view !== 'double_shifts' && view !== 'overtime') return;
    void refreshReportsCache();
  }, [view, reportDateFrom, reportDateTo, isAuthReady, currentUser]);

  const exportSensitiveReportXlsx = async (
    kind: 'absences' | 'double_shifts' | 'overtime',
    filename: string,
    sheetName: string,
  ) => {
    const rows = reportRowsCache[kind].length > 0 ? reportRowsCache[kind] : await buildSensitiveReportRows(kind);
    if (rows.length === 0) {
      showToast('Não há dados para exportar.', 'info');
      return;
    }

    const workbook = XLSX.utils.book_new();
    const headers = ['Data', 'Colaborador', 'Setor', 'Tipo'].filter(header => header in rows[0]);
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
    XLSX.writeFile(workbook, filename);
    showToast(`Arquivo ${filename} gerado com sucesso!`);
  };

  const exportSensitiveReportPdf = async (
    kind: 'absences' | 'double_shifts' | 'overtime',
    title: string,
    filename: string,
  ) => {
    const rows = reportRowsCache[kind].length > 0 ? reportRowsCache[kind] : await buildSensitiveReportRows(kind);
    if (rows.length === 0) {
      showToast('Não há dados para exportar.', 'info');
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text(title, 14, 15);

    const headers = ['Data', 'Colaborador', 'Setor', 'Tipo'].filter(header => header in rows[0]);
    autoTable(doc, {
      head: [headers],
      body: rows.map((row) => headers.map((header) => row[header] || '-')),
      startY: 24,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [25, 93, 230], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { top: 18, right: 10, bottom: 10, left: 10 },
    });

    doc.save(filename);
    showToast(`${title} gerado com sucesso!`);
  };

  const exportAbsencesPdf = async () => exportSensitiveReportPdf('absences', 'Relatório de Faltas', 'faltas.pdf');
  const exportAbsencesXlsx = async () => exportSensitiveReportXlsx('absences', 'faltas.xlsx', 'Faltas');
  const exportDoubleShiftsPdf = async () => exportSensitiveReportPdf('double_shifts', 'Relatório de Dobras e Folgas Trabalhadas', 'dobras.pdf');
  const exportDoubleShiftsXlsx = async () => exportSensitiveReportXlsx('double_shifts', 'dobras.xlsx', 'Dobras');
  const exportOvertimePdf = async () => exportSensitiveReportPdf('overtime', 'Relatório de Horas Extras', 'horas-extras.pdf');
  const exportOvertimeXlsx = async () => exportSensitiveReportXlsx('overtime', 'horas-extras.xlsx', 'Horas Extras');

  const requestOvertime = async (employeeId: string, date: string, sectorId: string) => {
      const employee = employees.find(e => e.id === employeeId);
      const sector = sectors.find(s => s.id === sectorId);
      if (!employee || !sector) return;
      if (submissionLocks.current.overtime) return;
      submissionLocks.current.overtime = true;
      setIsSubmittingOvertime(true);

    try {
          const alertId = `overtime_${employee.id}_${date}_${sector.id}`;
          await setDoc(doc(db, 'alerts', alertId), {
            type: 'warning',
            date: new Date().toISOString(),
            message: `Solicitação de Hora Extra: ${employee.name} | Data: ${date} | Setor: ${sector.name}`,
            title: `Solicitação de Hora Extra: ${employee.name}`,
            description: `Colaborador: ${employee.name} | Data: ${date} | Setor: ${sector.name}`,
            sectorId: sector.id,
            employeeId: employee.id,
            createdAt: serverTimestamp()
          });
      
        showToast('Solicitação enviada ao RH para o resumo semanal.');
        setIsOvertimeModalOpen(false);
      } catch (e) { 
        handleFirestoreError(e, OperationType.CREATE, 'alerts');
      } finally {
        submissionLocks.current.overtime = false;
        setIsSubmittingOvertime(false);
      }
    };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            className="bg-white p-5 sm:p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-[95vw] sm:max-w-md"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/20">
              <Shield size={32} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Escala Ipanema</h1>
            <p className="text-slate-500 text-sm">Acesse sua conta para gerenciar escalas</p>
          </div>

          <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                autoComplete="email"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                placeholder="seuemail@talhodelicatessen.com.br"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                placeholder="Sua senha"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Entrar'
              )}
            </button>
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={isResettingPassword}
              className="w-full text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-primary transition-colors disabled:opacity-50"
            >
              {isResettingPassword ? 'Enviando...' : 'Esqueci minha senha'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs uppercase text-slate-400 font-bold">ou</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-blue-100 transition-all group disabled:opacity-50"
          >
            <Image src="https://www.google.com/favicon.ico" alt="Google" width={20} height={20} />
            Entrar com Google
          </button>
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Sistema de Gestão de Escalas & Turnos v2.0
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={cn(
        "flex min-h-screen lg:h-screen overflow-hidden font-display relative transition-colors duration-200",
        darkMode ? "bg-slate-950 text-slate-100" : "bg-background-light text-slate-900"
      )}>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r flex flex-col shrink-0 transition-transform lg:relative lg:translate-x-0 lg:w-64",
        darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Shield size={24} />
            </div>
            <div>
              <h1 className={cn("font-bold leading-tight", darkMode ? "text-white" : "text-slate-900")}>Escala Ipanema</h1>
              <p className="text-xs text-slate-500">Gestão de Turnos</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Painel" 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
            darkMode={darkMode}
          />
          <SidebarItem 
            icon={Clock} 
            label="Presença" 
            active={view === 'overtime'}
            onClick={() => { setView('overtime'); setIsSidebarOpen(false); }}
            darkMode={darkMode}
          />
          <SidebarItem 
            icon={CalendarDays} 
            label="Escalas" 
            active={view === 'planner'} 
            onClick={() => { setView('planner'); setIsSidebarOpen(false); }}
            darkMode={darkMode}
          />
          <SidebarItem 
            icon={UserMinus} 
            label="Ausências" 
            badge={currentUser?.isMaster && unreadAbsenceAlerts.length > 0 ? unreadAbsenceAlerts.length.toString() : undefined} 
            active={view === 'absences'}
            onClick={async () => {
              await markAlertNotificationsAsViewed('absences');
              setView('absences');
              setIsSidebarOpen(false);
            }}
            darkMode={darkMode}
          />
          <SidebarItem 
            icon={Layers} 
            label="Dobras" 
            badge={currentUser?.isMaster && unreadDoubleShiftAlerts.length > 0 ? unreadDoubleShiftAlerts.length.toString() : undefined} 
            active={view === 'double_shifts'}
            onClick={async () => {
              await markAlertNotificationsAsViewed('double_shifts');
              setView('double_shifts');
              setIsSidebarOpen(false);
            }}
            darkMode={darkMode}
          />
          <SidebarItem 
            icon={Users} 
            label="Colaboradores" 
            active={view === 'employees'}
            onClick={() => { setView('employees'); setIsSidebarOpen(false); }}
            darkMode={darkMode}
          />
          <SidebarItem 
            icon={Briefcase} 
            label="Cargos" 
            active={view === 'roles'}
            onClick={() => { setView('roles'); setIsSidebarOpen(false); }}
            darkMode={darkMode}
          />
          <SidebarItem 
            icon={Layers} 
            label="Setores" 
            active={view === 'sectors'}
            onClick={() => { setView('sectors'); setIsSidebarOpen(false); }}
            darkMode={darkMode}
          />
          <SidebarItem 
            icon={CalendarDays} 
            label="Escalas Especiais" 
            active={view === 'special_schedules'}
            onClick={() => { setView('special_schedules'); setIsSidebarOpen(false); }}
            darkMode={darkMode}
          />
          {canManageVacations && (
            <SidebarItem 
              icon={Umbrella} 
              label="Férias" 
              active={view === 'vacations'}
              onClick={() => { setView('vacations'); setIsSidebarOpen(false); }}
              darkMode={darkMode}
            />
          )}
          <SidebarItem 
            icon={FileText} 
            label="Relatórios" 
            active={view === 'reports'}
            onClick={() => { setView('reports'); setIsSidebarOpen(false); }}
            darkMode={darkMode}
          />
          {currentUser?.isMaster && (
            <SidebarItem 
              icon={Shield} 
              label="Usuários" 
              active={view === 'users'}
              onClick={() => { setView('users'); setIsSidebarOpen(false); }}
              darkMode={darkMode}
            />
          )}
          <SidebarItem 
            icon={Settings} 
            label="Configurações" 
            active={view === 'settings'}
            onClick={() => { setView('settings'); setIsSidebarOpen(false); }}
            darkMode={darkMode}
          />
        </nav>

        <div className={cn("p-4 border-t", darkMode ? "border-slate-800" : "border-slate-200")}>
          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {currentUser?.name?.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className={cn("text-sm font-semibold truncate", darkMode ? "text-white" : "text-slate-900")}>{currentUser?.name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">{getAccessRoleLabel(currentUser?.role, currentUser?.isMaster)}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col overflow-hidden",
        darkMode ? "bg-slate-950" : "bg-slate-50"
      )}>
        {/* Header */}
        <header className={cn(
          "backdrop-blur-md border-b px-4 lg:px-8 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0",
          darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"
        )}>
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
            >
              <LayoutDashboard size={20} />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg lg:text-xl font-bold">
                {view === 'dashboard' && 'Escala Ipanema'}
                {view === 'planner' && 'Planejador de Turnos'}
                {view === 'employees' && 'Gestão de Colaboradores'}
                {view === 'roles' && 'Gestão de Cargos'}
                {view === 'sectors' && 'Gestão de Setores'}
                {view === 'users' && 'Gestão de Usuários'}
                {view === 'absences' && 'Gestão de Ausências'}
                {view === 'double_shifts' && 'Gestão de Dobras'}
                {view === 'overtime' && 'Horas Extras'}
                {view === 'vacations' && 'Controle de Férias'}
              </h2>
              <p className="text-xs lg:text-sm text-slate-500 hidden sm:block">
  {view === 'dashboard' ? 'Visão geral em tempo real da força de trabalho e turnos' : 'Armazém Principal • 24 Funcionários Ativos'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-4 self-end sm:self-auto">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-primary w-48 lg:w-64 text-sm" 
                placeholder="Buscar..." 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={handleBellClick}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative"
                title="Ver notificações em aberto"
              >
                <Bell size={20} />
                {currentUser?.isMaster && notificationFeed.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              {isNotificationMenuOpen && currentUser?.isMaster && (
                <div className="absolute right-0 top-full mt-3 w-[min(92vw,26rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Notificações em aberto</p>
                      <p className="text-xs text-slate-500">{notificationFeed.length} item(ns)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNotificationMenuOpen(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900"
                    >
                      Fechar
                    </button>
                  </div>
                  <div className="max-h-[24rem] overflow-y-auto">
                    {notificationFeed.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500">Nenhuma notificação em aberto.</div>
                    ) : (
                      notificationFeed.map((item, index) => (
                        <button
                          key={`notification-${item.kind}-${item.alert.id ?? index}`}
                          type="button"
                          onClick={() => {
                            setView(item.kind === 'absences' ? 'absences' : 'double_shifts');
                            setIsNotificationMenuOpen(false);
                            setIsSidebarOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
                              <p className="text-xs text-slate-500 truncate">{item.detail}</p>
                            </div>
                            <span className={cn(
                              "shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                              item.kind === 'absences' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                            )}>
                              {item.kind === 'absences' ? 'Falta' : 'Dobra'}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400">{formatReportDate(item.alert.date || item.alert.createdAt?.toDate?.()?.toISOString?.())}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsEmployeeModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-white px-3 lg:px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Novo Colaborador</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Zap size={48} className="text-primary opacity-50" />
              </motion.div>
              <p className="mt-4 font-bold">Carregando dados do sistema...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
            {view === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard 
                    icon={Users} 
                    label="Total de Funcionários" 
                    value={employees.length.toString()} 
                    subValue=" ativos" 
                    trend="+2.4%" 
                    trendColor="text-green-600 bg-green-100"
                    iconBg="bg-primary/10"
                    iconColor="text-primary"
                    darkMode={darkMode}
                  />
                  <MetricCard 
                    icon={UserMinus} 
                    label="Ausências Ativas" 
                    value={alerts.filter(a => a.type === 'error').length.toString()} 
                    subValue=" alertas" 
                    trend="Alerta" 
                    trendColor="text-red-600 bg-red-100"
                    iconBg="bg-red-100"
                    iconColor="text-red-500"
                    darkMode={darkMode}
                  />
                  <MetricCard 
                    icon={Clock} 
                    label="Horas Extras Pendentes" 
                    value={overtimeAlerts.length.toString()} 
                    subValue=" total" 
                    trend="Revisar" 
                    trendColor="text-slate-500 bg-slate-100"
                    iconBg="bg-yellow-100"
                    iconColor="text-yellow-500"
                    darkMode={darkMode}
                  />
                  <MetricCard 
                    icon={AlertTriangle} 
                    label="Escalas de Eventos" 
                    value={specialSchedules.length.toString()} 
                    subValue=" ativas" 
                    trend="Urgentes" 
                    trendColor="text-orange-600 bg-orange-100"
                    iconBg="bg-orange-100"
                    iconColor="text-orange-500"
                    darkMode={darkMode}
                  />
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
                    <div>
                      <h4 className="font-bold text-lg">Presença em Tempo Real por Departamento</h4>
                      <p className="text-sm text-slate-500">Porcentagem de presença ao vivo hoje</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">94.6%</p>
                      <p className="text-xs font-medium text-slate-400">Média Global</p>
                    </div>
                  </div>
                  <div className="flex items-end justify-between h-48 px-4">
                    {DEPARTMENTS.map((dept, i) => {
                      const heights = [96, 85, 92, 78, 88, 94];
                      return (
                        <div key={`dept-chart-${dept}`} className="flex flex-col items-center gap-3 w-full group">
                          <div className="w-12 bg-primary/10 rounded-t-lg relative flex items-end justify-center group-hover:bg-primary/20 transition-colors h-full">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${heights[i]}%` }}
                              className="w-12 bg-primary rounded-t-lg"
                            />
                            <span className="absolute -top-7 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                              {heights[i]}%
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-500">{dept}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : view === 'roles' ? (
              <motion.div
                key="roles"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "rounded-xl border shadow-sm p-6",
                  darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <h3 className="text-xl font-bold">Gestão de Cargos</h3>
                  <button 
                    onClick={() => { setEditingRole(null); setIsRoleModalOpen(true); }}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2"
                  >
                    <Plus size={18} /> Novo Cargo
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roles.map(role => (
                    <div key={`role-${role.id}`} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group">
                      <div>
                        <p className="font-bold text-slate-900">{role.name}</p>
                        <p className="text-xs text-slate-500">
                          {employees.filter(e => e.roleId === role.id).length} Colaboradores
                        </p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingRole(role); setIsRoleModalOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => deleteRole(role.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : view === 'users' ? (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "rounded-xl border shadow-sm p-6",
                  darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <h3 className="text-xl font-bold">Gestão de Usuários</h3>
                  <button 
                    onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2"
                  >
                    <Plus size={18} /> Novo Usuário
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-3 pl-2">Nome</th>
                        <th className="pb-3">Nível de Acesso</th>
                        <th className="pb-3 text-right pr-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {appUsers.map(user => (
                        <tr key={`user-${user.id}`} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 pl-2">
                            <div className="flex flex-col">
                              <span className="font-medium">{user.name}</span>
                              <span className="text-xs text-slate-400">{user.email}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                              normalizeAccessRole(user.role) === 'admin' ? "bg-purple-100 text-purple-700" : 
                              normalizeAccessRole(user.role) === 'supervisor' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                            )}>
                              {getAccessRoleLabel(user.role, user.isMaster)}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-2">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all"
                              >
                                <Edit2 size={16} />
                              </button>
                              {user.uid !== currentUser.uid && (
                                <button 
                                  onClick={() => deleteUser(user.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : view === 'planner' ? (
              <motion.div
                key="planner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "rounded-xl border shadow-sm flex flex-col h-full overflow-hidden",
                  darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                )}
              >
                {/* Planner Sub-header */}
                <div className={cn(
                  "p-6 border-b flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0",
                  darkMode ? "border-slate-800" : "border-slate-200"
                )}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 group relative">
                      <h3 className="text-2xl font-black tracking-tight capitalize">
                        {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                      </h3>
                      <div className="relative flex items-center">
                        <input 
                          type="date" 
                          value={`${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`}
                          onChange={(e) => {
                            const [y, m, d] = e.target.value.split('-').map(Number);
                            const newDate = new Date(y, m - 1, d);
                            if (!isNaN(newDate.getTime())) {
                              setCurrentDate(newDate);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                          title="Escolher data, mês e ano"
                        />
                        <button className="p-2 text-slate-400 hover:text-primary transition-colors bg-slate-50 rounded-lg border border-slate-200">
                          <CalendarDays size={18} />
                        </button>
                      </div>
                      <button 
                        onClick={() => setCurrentDate(new Date())}
                        className="p-2 text-slate-400 hover:text-primary transition-colors bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold"
                        title="Ir para hoje"
                      >
                        Hoje
                      </button>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button 
                        onClick={() => setPlannerViewMode('monthly')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", plannerViewMode === 'monthly' ? "bg-white shadow-sm" : "text-slate-500 hover:text-slate-900")}
                      >
                        Vista Mensal
                      </button>
                      <button 
                        onClick={() => setPlannerViewMode('weekly')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", plannerViewMode === 'weekly' ? "bg-white shadow-sm" : "text-slate-500 hover:text-slate-900")}
                      >
                        Vista Semanal
                      </button>
                      <button 
                        onClick={() => setPlannerViewMode('daily')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", plannerViewMode === 'daily' ? "bg-white shadow-sm" : "text-slate-500 hover:text-slate-900")}
                      >
                        Vista Diária
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <button 
                        onClick={() => {
                          const newDate = new Date(currentDate);
                          if (plannerViewMode === 'monthly') {
                            newDate.setMonth(newDate.getMonth() - 1);
                          } else if (plannerViewMode === 'weekly') {
                            newDate.setDate(newDate.getDate() - 7);
                          } else {
                            newDate.setDate(newDate.getDate() - 1);
                          }
                          setCurrentDate(newDate);
                        }}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                        title="Anterior"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          const newDate = new Date(currentDate);
                          if (plannerViewMode === 'monthly') {
                            newDate.setMonth(newDate.getMonth() + 1);
                          } else if (plannerViewMode === 'weekly') {
                            newDate.setDate(newDate.getDate() + 7);
                          } else {
                            newDate.setDate(newDate.getDate() + 1);
                          }
                          setCurrentDate(newDate);
                        }}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                        title="Próximo"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                    <button 
                      onClick={() => setSortAlphabetical(!sortAlphabetical)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-bold transition-colors",
                        sortAlphabetical ? "bg-primary/10 border-primary text-primary" : "border-slate-200 hover:bg-slate-50"
                      )}
                      title="Ordenar Alfabeticamente"
                    >
                      <ArrowDownAZ size={18} />
                      <span className="hidden sm:inline">A-Z</span>
                    </button>
                    <select 
                      value={plannerSectorFilter}
                      onChange={(e) => setPlannerSectorFilter(e.target.value)}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="all">Todos os Setores</option>
                      {sectors.map(s => (
                        <option key={`filter-sector-${s.id}`} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button 
                      onClick={generatePDF}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm transition-colors"
                    >
                      <Download size={18} />
                      Gerar PDF
                    </button>
                    <button 
                      onClick={() => showToast("Exportando dados para CSV...")}
                      className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50"
                    >
                      <Download size={18} />
                      Exportar CSV
                    </button>
                  </div>
                </div>

                {/* Planner Grid */}
                <div className="flex-1 overflow-auto">
                  <table className={cn(
                    "w-full border-separate border-spacing-0",
                    plannerViewMode === 'monthly' ? "min-w-[1500px]" : plannerViewMode === 'weekly' ? "min-w-[800px]" : "min-w-full"
                  )}>
                    <thead className="sticky top-0 z-20 bg-white shadow-sm">
                      <tr>
                        <th className="w-64 p-4 text-left text-xs font-bold uppercase text-slate-400 border-b border-r border-slate-200 sticky left-0 bg-white">Funcionário</th>
                        {(() => {
                          const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                          const daysToShow = plannerViewMode === 'monthly' ? daysInMonth : plannerViewMode === 'weekly' ? 7 : 1;
                          const startDay = plannerViewMode === 'monthly' ? 1 : 
                                           plannerViewMode === 'weekly' ? Math.max(1, Math.min(daysInMonth - 6, currentDate.getDate() - currentDate.getDay())) :
                                           currentDate.getDate();
                          return Array.from({ length: daysToShow }).map((_, i) => {
                            const day = startDay + i;
                            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            const dayName = date.toLocaleString('pt-BR', { weekday: 'short' }).toUpperCase();
                            return (
                              <th key={`header-day-${day}`} className="p-2 text-center border-b border-slate-200 min-w-[80px]">
                                <span className="block text-xs font-bold text-slate-400">{dayName}</span>
                                <span className={cn("text-lg", day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear() && "text-primary font-bold")}>
                                  {day.toString().padStart(2, '0')}
                                </span>
                              </th>
                            );
                          });
                        })()}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedEmployees.map((emp, idx) => (
                        <tr key={`planner-emp-${emp.id ?? `idx-${idx}`}`} className="group hover:bg-slate-50/50">
                          <td className="p-4 border-b border-r border-slate-200 sticky left-0 bg-white z-10">
                            <div className="flex items-center gap-3">
                              <Image src={getAvatarUrl(emp.avatar, emp.name)} width={32} height={32} className="rounded-full bg-slate-200 object-cover" alt={emp.name} referrerPolicy="no-referrer" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{emp.name}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{emp.role}</p>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => generateIndividualPDF(emp)}
                                  className="text-slate-300 hover:text-primary p-1"
                                  title="Gerar PDF Individual"
                                >
                                  <FileText size={14} />
                                </button>
                                <button 
                                  onClick={() => deleteEmployee(emp.id)}
                                  className="text-slate-300 hover:text-red-500 p-1"
                                  title="Excluir Colaborador"
                                >
                                  <Ban size={14} />
                                </button>
                              </div>
                            </div>
                          </td>
                          {(() => {
                            const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                            const daysToShow = plannerViewMode === 'monthly' ? daysInMonth : plannerViewMode === 'weekly' ? 7 : 1;
                            const startDay = plannerViewMode === 'monthly' ? 1 : 
                                             plannerViewMode === 'weekly' ? Math.max(1, Math.min(daysInMonth - 6, currentDate.getDate() - currentDate.getDay())) :
                                             currentDate.getDate();
                            return emp.shifts.slice(startDay - 1, startDay - 1 + daysToShow).map((shift: any, i: number) => (
                              <td key={`shift-${emp.id ?? `idx-${idx}`}-${i}`} className="p-1 border-b border-slate-200">
                                {shift.type === 'empty' ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShiftPickerTarget({ empId: emp.id, dayIndex: startDay - 1 + i });
                                      setIsShiftPickerOpen(true);
                                    }}
                                    className="w-full"
                                    title="Selecionar escala"
                                  >
                                    <div className="h-10 rounded flex items-center justify-center text-slate-300 cursor-pointer transition-colors border-2 border-dashed border-slate-200 hover:bg-slate-50">
                                      <Plus size={14} />
                                    </div>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="w-full"
                                    onClick={() => {
                                      setEditingShift({ empId: emp.id, dayIndex: startDay - 1 + i });
                                      setIsShiftModalOpen(true);
                                    }}
                                  >
                                    <ShiftBadge {...shift} />
                                  </button>
                                )}
                              </td>
                            ));
                          })()}
                        </tr>
                      ))}
                      {/* Special Schedules Row */}
                      <tr className="bg-slate-50/80">
                        <td className="p-4 border-b border-r border-slate-200 sticky left-0 bg-slate-50 z-10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                              <Zap size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">Escalas Especiais</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Eventos do Mês</p>
                            </div>
                          </div>
                        </td>
                        {(() => {
                          const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                          const daysToShow = plannerViewMode === 'monthly' ? daysInMonth : plannerViewMode === 'weekly' ? 7 : 1;
                          const startDay = plannerViewMode === 'monthly' ? 1 : 
                                           plannerViewMode === 'weekly' ? Math.max(1, Math.min(daysInMonth - 6, currentDate.getDate() - currentDate.getDay())) :
                                           currentDate.getDate();
                          return Array.from({ length: daysToShow }).map((_, i) => {
                            const day = startDay + i;
                            const dayEvents = specialSchedules.filter(s => {
                              const [sYear, sMonth, sDay] = s.date.split('-').map(Number);
                              return sDay === day && 
                                     (sMonth - 1) === currentDate.getMonth() && 
                                     sYear === currentDate.getFullYear();
                            });
                            
                            return (
                              <td key={`special-day-${i}`} className="p-1 border-b border-slate-200">
                                {dayEvents.length > 0 ? (
                                  <div className="flex flex-col gap-1">
                                    {dayEvents.map(event => (
                                      <div key={`event-${event.id}`} className="px-2 py-1 bg-amber-50 border border-amber-200 rounded text-[10px] font-bold text-amber-700 truncate" title={event.name}>
                                        {event.name}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="h-6" />
                                )}
                              </td>
                            );
                          });
                        })()}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className={cn(
                  "border-t p-4 flex flex-wrap items-center justify-between gap-6 shrink-0",
                  darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                )}>
                  <div className="flex items-center gap-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Legenda:</span>
                    {SHIFT_PRESETS.map((preset) => (
                      <div key={`legend-${preset.type}`} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent">
                        <div className={cn("size-3 rounded", preset.color.split(' ')[0])}></div>
                        <span className="text-xs font-medium">{preset.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Zap size={14} />
                      <span>Hora Extra Aprovada</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} />
                      <span>Turno Duplo</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
                    <span className="px-2 py-1 rounded bg-slate-100 font-bold">Total de Equipe Necessária: 18</span>
                    <span className="px-2 py-1 rounded bg-primary/10 text-primary font-bold">Atribuído: 16</span>
                    <span className="px-2 py-1 rounded bg-red-50 text-red-600 font-bold">Lacuna: -2</span>
                  </div>
                </div>
              </motion.div>
            ) : view === 'employees' ? (
              <motion.div
                key="employees"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "rounded-xl border shadow-sm p-6",
                  darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold">Colaboradores</h3>
                    <button 
                      onClick={() => setSortAlphabetical(!sortAlphabetical)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors",
                        sortAlphabetical ? "bg-primary/10 border-primary text-primary" : "border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <ArrowDownAZ size={14} />
                      A-Z
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsEmployeeModalOpen(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold"
                  >
                    Adicionar Colaborador
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAndSortedEmployees.map(emp => (
                    <div key={`emp-card-${emp.id}`} className="p-4 border border-slate-100 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:border-primary/30 transition-colors group relative">
                      <button 
                        onClick={() => {
                          setEditingEmployee(emp);
                          setIsEmployeeModalOpen(true);
                        }}
                        className="absolute top-2 right-8 p-1 text-slate-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Settings size={14} />
                      </button>
                      <Image src={getAvatarUrl(emp.avatar, emp.name)} width={48} height={48} className="rounded-full object-cover" alt={emp.name} referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <p className="font-bold">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.role}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => generateIndividualPDF(emp)}
                          className="text-slate-300 hover:text-primary p-1.5"
                          title="Gerar PDF Individual"
                        >
                          <FileText size={18} />
                        </button>
                        <button onClick={() => deleteEmployee(emp.id)} className="text-slate-300 hover:text-red-500 p-1.5" title="Excluir">
                          <Ban size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : view === 'absences' ? (
              <motion.div
                key="absences"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">Gestão de Ausências</h3>
                    <p className="text-sm text-slate-500">Registros permanentes de faltas no banco</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={exportAbsencesPdf}
                      className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      <Download size={16} /> PDF
                    </button>
                    <button 
                      onClick={exportAbsencesXlsx}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      <Download size={16} /> XLSX
                    </button>
                    <button 
                    onClick={openNewAbsenceModal}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                  >
                      <Plus size={16} /> Registrar Falta
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {alerts.filter(a => a.type === 'error').map((alert, idx) => (
                    <div key={`absence-alert-${alert.id ?? `idx-${idx}`}`} className={cn(
                      "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
                      darkMode ? "bg-slate-900 border-red-900/30" : "bg-white border-red-100"
                    )}>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 bg-red-50 rounded-lg text-red-500">
                          <UserMinus size={20} />
                        </div>
                        <div>
                          <p className="font-bold">{alert.title}</p>
                          <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-500")}>{alert.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {canManageIncidentRecords && (
                          <button onClick={() => openEditAbsenceModal(alert)} className="text-slate-400 hover:text-primary" title="Editar falta">
                            <Edit2 size={18} />
                          </button>
                        )}
                        {currentUser?.isMaster && (
                          <button onClick={() => removeAlert(alert.id)} className="text-slate-400 hover:text-red-500">
                            <Ban size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {alerts.filter(a => a.type === 'error').length === 0 && (
                    <div className={cn(
                      "text-center py-12 rounded-xl border border-dashed text-slate-400",
                      darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                    )}>
                      Nenhuma ausência crítica registrada.
                    </div>
                  )}
                </div>
              </motion.div>
            ) : view === 'double_shifts' ? (
              <motion.div
                key="double_shifts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">Gestão de Dobras</h3>
                    <p className="text-sm text-slate-500">Turnos duplos registrados no sistema</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={exportDoubleShiftsPdf}
                      className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      <Download size={16} /> PDF
                    </button>
                    <button 
                      onClick={exportDoubleShiftsXlsx}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      <Download size={16} /> XLSX
                    </button>
                    <button 
                    onClick={openNewDoubleShiftModal}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                  >
                      <Plus size={16} /> Registrar Dobra
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {doubleShiftAlerts.length > 0 ? doubleShiftAlerts.map((alert, idx) => {
                    const employeeName = String(alert.title || 'Dobra').replace(/^Dobra:\s*/, '') || 'Colaborador';
                    return (
                      <div key={`double-shift-alert-${alert.id ?? `idx-${idx}`}`} className={cn(
                        "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
                        darkMode ? "bg-slate-900 border-yellow-900/30" : "bg-white border-yellow-100"
                      )}>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="p-2 bg-yellow-50 rounded-lg text-yellow-500">
                            <CalendarDays size={20} />
                          </div>
                          <div>
                            <p className="font-bold">{employeeName}</p>
                            <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-500")}>
                              {alert.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-yellow-100 text-yellow-700">
                            Dobra
                          </span>
                          {canManageIncidentRecords && (
                            <button onClick={() => openEditDoubleShiftModal(alert)} className="text-slate-400 hover:text-primary" title="Editar dobra">
                              <Edit2 size={18} />
                            </button>
                          )}
                          {currentUser?.isMaster && (
                            <button onClick={() => removeAlert(alert.id)} className="text-slate-400 hover:text-red-500">
                              <Ban size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className={cn(
                      "text-center py-12 rounded-xl border border-dashed text-slate-400",
                      darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                    )}>
                      Nenhuma dobra registrada.
                    </div>
                  )}
                </div>
              </motion.div>
            ) : view === 'overtime' ? (
              <motion.div
                key="overtime"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">Horas Extras</h3>
                    <p className="text-sm text-slate-500">Registros consolidados e exportáveis</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={exportOvertimePdf}
                      className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      <Download size={16} /> PDF
                    </button>
                    <button 
                      onClick={exportOvertimeXlsx}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      <Download size={16} /> XLSX
                    </button>
                    <button 
                      onClick={() => setIsOvertimeModalOpen(true)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      <Plus size={16} /> Solicitar Hora Extra
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {overtimeAlerts.map((alert, idx) => (
                    <div key={`overtime-alert-${alert.id ?? `idx-${idx}`}`} className="bg-white p-4 rounded-xl border border-yellow-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-yellow-50 rounded-lg text-yellow-500">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="font-bold">{alert.title}</p>
                          <p className="text-sm text-slate-500">{alert.description}</p>
                        </div>
                      </div>
                      {currentUser?.isMaster && (
                        <button onClick={() => removeAlert(alert.id)} className="text-slate-400 hover:text-red-500">
                          <Ban size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  {overtimeAlerts.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
                      Nenhum alerta de hora extra pendente.
                    </div>
                  )}
                </div>
              </motion.div>
            ) : view === 'sectors' ? (
              <motion.div
                key="sectors"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "rounded-xl border shadow-sm p-6",
                  darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <h3 className="text-xl font-bold">Gestão de Setores</h3>
                  <button 
                    onClick={() => { setEditingSector(null); setIsSectorModalOpen(true); }}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                  >
                    <Plus size={16} /> Novo Setor
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sectors.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(sector => (
                    <div key={`sector-${sector.id}`} className="p-4 border border-slate-100 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <Users size={20} />
                        </div>
                        <p className="font-bold">{sector.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setEditingSector(sector); setIsSectorModalOpen(true); }}
                          className="text-slate-400 hover:text-primary"
                        >
                          <Settings size={16} />
                        </button>
                        <button 
                          onClick={() => deleteSector(sector.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Ban size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : view === 'settings' ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-xl border shadow-sm p-5 sm:p-8 max-w-full sm:max-w-2xl mx-auto",
                  darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                )}
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-8">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <Settings size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Configurações do Sistema</h3>
                    <p className="text-slate-500">Gerencie as preferências da sua aplicação</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <section>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Preferências Gerais</h4>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-semibold">Resumo Semanal por E-mail</p>
                          <p className="text-sm text-slate-500">Receba o resumo de faltas, horas extras e dobras toda segunda-feira</p>
                        </div>
                        <div 
                          onClick={() => setEmailNotifications(!emailNotifications)}
                          className={cn(
                            "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
                            emailNotifications ? "bg-primary" : "bg-slate-300"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                            emailNotifications ? "right-1" : "left-1"
                          )} />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-semibold">Modo Escuro</p>
                          <p className="text-sm text-slate-500">Ajuste a interface para ambientes escuros</p>
                        </div>
                        <div 
                          onClick={() => setDarkMode(!darkMode)}
                          className={cn(
                            "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
                            darkMode ? "bg-primary" : "bg-slate-300"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                            darkMode ? "right-1" : "left-1"
                          )} />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Configurações de RH</h4>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-blue-800 uppercase mb-1">E-mail para Relatórios</label>
                        <div className="flex gap-2">
                          <input 
                            type="email"
                            value={rhEmail}
                            onChange={(e) => setRhEmail(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-md text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="rh@exemplo.com"
                          />
                          <button 
                            onClick={() => {
                              if (!rhEmail.includes('@') || !rhEmail.includes('.')) {
                                showToast("Por favor, insira um e-mail válido.", "error");
                                return;
                              }
                              saveConfig('rh_email', rhEmail);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition-colors"
                          >
                            Salvar E-mail
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-blue-800">
                        Os relatórios consolidados (Faltas, Horas Extras e Dobras) são enviados automaticamente para <strong>{rhEmail}</strong> toda segunda-feira, com referência à semana anterior.
                      </p>
                      
                      {/* Email Status Indicator */}
                      <div className="p-3 bg-white/50 rounded-md border border-blue-200 flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full animate-pulse",
                          isEmailActive ? "bg-emerald-500" : "bg-amber-500"
                        )} />
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Status do E-mail: {isEmailActive ? "Ativo (Real)" : "Modo Simulação (Falta API Key)"}
                        </span>
                      </div>

                      <button 
                        onClick={async () => {
                          try {
                            const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                            const res = await fetch('/api/send-email', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                to: rhEmail,
                                subject: `RELATÓRIO CONSOLIDADO - ${monthName.toUpperCase()}`,
                                html: `
                                  <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                                    <h2 style="color: #2563eb;">Relatório Consolidado de RH</h2>
<p><strong>Mês de Referência:</strong> ${monthName}</p>
                                    <p><strong>Resumo de Alertas:</strong></p>
                                    <ul>
                                      <li><strong>Faltas:</strong> ${alerts.filter(a => a.type === 'error').length}</li>
                                      <li><strong>Horas Extras:</strong> ${overtimeAlerts.length}</li>
                                      <li><strong>Dobras:</strong> ${doubleShiftAlerts.length}</li>
                                    </ul>
                                    <p><strong>Detalhes dos Alertas:</strong></p>
                                    <table style="width: 100%; border-collapse: collapse;">
                                      <thead>
                                        <tr style="background-color: #f8fafc;">
                                          <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Tipo</th>
                                          <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Título</th>
                                          <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Descrição</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        ${alerts.map(a => `
                                          <tr>
                                            <td style="padding: 8px; border: 1px solid #e2e8f0;">${a.type === 'error' ? 'Falta' : 'Aviso'}</td>
                                            <td style="padding: 8px; border: 1px solid #e2e8f0;">${a.title}</td>
                                            <td style="padding: 8px; border: 1px solid #e2e8f0;">${a.description}</td>
                                          </tr>
                                        `).join('')}
                                      </tbody>
                                    </table>
                                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #666;">Este é um e-mail automático do sistema Escala do Talho.</p>
                                  </div>
                                `
                              })
                            });
                            
                            if (res.ok) {
                              const data = await res.json();
                              if (data.simulated) {
                                showToast(`Simulação: Relatório gerado (E-mail não enviado pois a API Key não está configurada)`);
                              } else {
                                showToast(`Relatório consolidado enviado com sucesso para ${rhEmail}`);
                              }
                            } else {
                              const errorData = await res.json();
                              showToast(`Erro ao enviar relatório: ${errorData.error}`, "error");
                            }
                          } catch (error) {
                            console.error(error);
                            showToast("Erro ao processar relatório", "error");
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
                      >
                        <Download size={18} /> Enviar Relatório Mensal Agora (E-mail)
                      </button>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Ações de Sistema</h4>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-sm text-slate-600 mb-4">
                        Importe a base da planilha para criar Setores, Cargos normalizados e Colaboradores no sistema.
                      </p>
                      <button 
                        onClick={() => {
                          console.log("Seed button clicked, opening confirmation modal...");
                          setIsSeedConfirmOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-all"
                      >
                        <Database size={18} />
                        Importar Base da Planilha
                      </button>
                    </div>
                  </section>

                  <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <button 
                      onClick={async () => {
                        try {
                          await Promise.all([
                            saveConfig('rh_email', rhEmail, true),
                            saveConfig('dark_mode', darkMode.toString(), true),
                            saveConfig('email_notifications', emailNotifications.toString(), true)
                          ]);
                          showToast("Configurações salvas com sucesso!");
                        } catch (error) {
                          showToast("Erro ao salvar configurações", "error");
                        }
                      }}
                      className="bg-primary text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : view === 'special_schedules' ? (
              <motion.div
                key="special_schedules"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-xl font-bold">Escalas Especiais (Eventos)</h3>
                  <button 
                    onClick={openNewSpecialScheduleModal}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                  >
                    <Plus size={16} /> Nova Escala de Evento
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {specialSchedules.map(schedule => (
                    <div key={`special-schedule-${schedule.id}`} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg">{schedule.name}</h4>
                          <p className="text-sm text-slate-500 flex items-center gap-1.5">
                            <CalendarDays size={14} /> {schedule.date}
                          </p>
                        </div>
                        <span className={cn(
                          "px-2 py-1 text-[10px] font-bold rounded-full",
                          schedule.status === 'Planejado' ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                        )}>
                          {schedule.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {schedule.employees && schedule.employees.length > 0 ? (
                            schedule.employees.slice(0, 5).map((emp: any) => (
                              <Image 
                                key={`special-emp-${schedule.id}-${emp.id}`} 
                                src={getAvatarUrl(emp.avatar, emp.name)} 
                                width={32} 
                                height={32} 
                                className="rounded-full border-2 border-white bg-slate-200" 
                                alt={emp.name} 
                                referrerPolicy="no-referrer" 
                              />
                            ))
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-400">
                              0
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {schedule.employees && schedule.employees.length > 5 
                            ? `+${schedule.employees.length - 5} colaboradores` 
                            : schedule.employees && schedule.employees.length > 0
                              ? `${schedule.employees.length} colaborador(es)`
                              : "Nenhum colaborador"}
                        </span>
                      </div>
                      <div className="flex gap-3 pt-2 border-t border-slate-50">
                        <button 
                          onClick={() => openEditSpecialScheduleModal(schedule)}
                          className="flex-1 text-xs font-bold py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100"
                        >
                          Editar Escala
                        </button>
                        <button 
                          onClick={() => deleteSpecialSchedule(schedule.id)}
                          className="text-xs font-bold py-2 px-3 rounded-lg text-red-500 hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : view === 'vacations' ? (
              <motion.div
                key="vacations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">Controle de Férias</h3>
                    <p className="text-sm text-slate-500">Períodos de férias organizados por setor.</p>
                  </div>
                  <button 
                    onClick={openNewVacationModal}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                  >
                    <Plus size={16} /> Nova Férias
                  </button>
                </div>

                {vacations.length === 0 ? (
                  <div className={cn(
                    "text-center py-12 rounded-xl border border-dashed text-slate-400",
                    darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                  )}>
                    Nenhum período de férias registrado.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {[
                      ...sectors.map(sector => ({
                        id: sector.id,
                        name: sector.name,
                        vacations: vacationsBySector.get(sector.id) || [],
                      })),
                      {
                        id: 'sem-setor',
                        name: 'Sem setor',
                        vacations: vacationsBySector.get('sem-setor') || [],
                      },
                    ].map(group => {
                      if (group.vacations.length === 0) return null;

                      return (
                        <div key={`vac-sector-${group.id}`} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-100">
                            <div>
                              <h4 className="font-bold text-red-600">{group.name}</h4>
                              <p className="text-xs text-slate-500">{group.vacations.length} período(s) agendado(s)</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                              <Umbrella size={20} />
                            </div>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {group.vacations.map((vacation: any) => (
                              <div key={`vac-${vacation.id}`} className="px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                <div>
                                  <p className="font-bold text-black">{vacation.employeeName}</p>
                                  <p className="text-sm text-slate-500">
                                    {formatVacationDate(vacation.startDate)} até {formatVacationDate(vacation.endDate)}
                                  </p>
                                  {vacation.notes && (
                                    <p className="text-xs text-slate-400 mt-1">{vacation.notes}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                    Férias
                                  </span>
                                  <button
                                    onClick={() => openEditVacationModal(vacation)}
                                    className="text-slate-400 hover:text-primary"
                                    title="Editar férias"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => deleteVacation(vacation.id)}
                                    className="text-slate-400 hover:text-red-500"
                                    title="Excluir férias"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : view === 'reports' ? (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">Relatórios e Exportação</h3>
                    <p className="text-sm text-slate-500">Acesse todas as saídas do sistema em um único lugar.</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">De</label>
                        <input
                          type="date"
                          value={reportDateFrom}
                          onChange={(e) => setReportDateFrom(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Até</label>
                        <input
                          type="date"
                          value={reportDateTo}
                          onChange={(e) => setReportDateTo(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReportDateFrom('');
                        setReportDateTo('');
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Limpar filtro
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    O período acima é aplicado aos relatórios de faltas, dobras e horas extras.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h4 className="font-bold">Exportação rápida</h4>
                      <p className="text-sm text-slate-500">Relatórios operacionais e consolidados no mesmo painel.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                      <button onClick={exportAbsencesPdf} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors">Faltas PDF</button>
                      <button onClick={exportAbsencesXlsx} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">Faltas XLSX</button>
                      <button onClick={exportDoubleShiftsPdf} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors">Dobras/Folgas PDF</button>
                      <button onClick={exportDoubleShiftsXlsx} className="px-4 py-2 rounded-lg bg-yellow-500 text-white text-sm font-bold hover:bg-yellow-600 transition-colors">Dobras/Folgas XLSX</button>
                      <button onClick={exportOvertimePdf} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors">HE PDF</button>
                      <button onClick={exportOvertimeXlsx} className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors">HE XLSX</button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center mb-4">
                      <Users size={24} />
                    </div>
                    <h4 className="font-bold mb-2">Lista de Colaboradores</h4>
                    <p className="text-sm text-slate-500 mb-4">Gere um PDF com a lista completa de todos os colaboradores e seus cargos.</p>
                    <button 
                      onClick={() => generateEmployeeReport()}
                      className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors"
                    >
                      Gerar PDF
                    </button>
                  </div>
                  
                  <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center mb-4">
                      <CalendarDays size={24} />
                    </div>
                    <h4 className="font-bold mb-2">Escala Mensal</h4>
                    <p className="text-sm text-slate-500 mb-4">Exporte a escala de turnos do mês atual para todos os colaboradores.</p>
                    <button 
                      onClick={() => generateShiftReport()}
                      className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors"
                    >
                      Gerar PDF
                    </button>
                  </div>

                  <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center mb-4">
                      <Zap size={24} />
                    </div>
                    <h4 className="font-bold mb-2">Escalas Especiais</h4>
                    <p className="text-sm text-slate-500 mb-4">Relatório de eventos e escalas especiais com equipes designadas.</p>
                    <button 
                      onClick={() => generateSpecialReport()}
                      className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors"
                    >
                      Gerar PDF
                    </button>
                  </div>

                  <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-lg flex items-center justify-center mb-4">
                      <UserMinus size={24} />
                    </div>
                    <h4 className="font-bold mb-2">Relatório de Faltas</h4>
                    <p className="text-sm text-slate-500 mb-4">Exporte todos os registros de faltas em PDF ou XLSX.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={exportAbsencesPdf}
                        className="py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors"
                      >
                        PDF
                      </button>
                      <button 
                        onClick={exportAbsencesXlsx}
                        className="py-2 bg-red-500 text-white rounded-lg font-bold text-sm hover:bg-red-600 transition-colors"
                      >
                        XLSX
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-yellow-50 text-yellow-500 rounded-lg flex items-center justify-center mb-4">
                      <Layers size={24} />
                    </div>
                    <h4 className="font-bold mb-2">Relatório de Dobras e Folgas Trabalhadas</h4>
                    <p className="text-sm text-slate-500 mb-4">Exporte os turnos duplos registrados em PDF ou XLSX.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={exportDoubleShiftsPdf}
                        className="py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors"
                      >
                        PDF
                      </button>
                      <button 
                        onClick={exportDoubleShiftsXlsx}
                        className="py-2 bg-yellow-500 text-white rounded-lg font-bold text-sm hover:bg-yellow-600 transition-colors"
                      >
                        XLSX
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center mb-4">
                      <Clock size={24} />
                    </div>
                    <h4 className="font-bold mb-2">Relatório de Horas Extras</h4>
                    <p className="text-sm text-slate-500 mb-4">Exporte os registros de horas extras em PDF ou XLSX.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={exportOvertimePdf}
                        className="py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors"
                      >
                        PDF
                      </button>
                      <button 
                        onClick={exportOvertimeXlsx}
                        className="py-2 bg-amber-500 text-white rounded-lg font-bold text-sm hover:bg-amber-600 transition-colors"
                      >
                        XLSX
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Info size={48} className="mb-4 opacity-20" />
                <p>Esta tela está em desenvolvimento ou não possui dados.</p>
                <button onClick={() => setView('dashboard')} className="mt-4 text-primary font-bold">Voltar ao Painel</button>
              </div>
            )}
          </AnimatePresence>
        )}
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isEmployeeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEmployeeModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md p-5 sm:p-8"
            >
              <h3 className="text-xl font-bold mb-6">{editingEmployee ? 'Editar Colaborador' : 'Novo Colaborador'}</h3>
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addEmployee({
                  name: formData.get('name'),
                  roleId: formData.get('roleId') as string,
                  sectorId: formData.get('sectorId') as string || null,
                  avatar: null
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                  <input name="name" defaultValue={editingEmployee?.name || ''} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cargo</label>
                  <select name="roleId" defaultValue={editingEmployee?.roleId || roles[0]?.id} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                    {roles.map(role => (
                      <option key={`opt-role-${role.id}`} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Setor</label>
                  <select name="sectorId" defaultValue={editingEmployee?.sectorId || sectors[0]?.id} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                    <option value="">Nenhum</option>
                    {sectors.map((sector) => (
                      <option key={`opt-sector-${sector.id}`} value={sector.id}>{sector.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => {
                    setIsEmployeeModalOpen(false);
                    setEditingEmployee(null);
                  }} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold">
                    {editingEmployee ? 'Salvar Alterações' : 'Salvar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isRoleModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsRoleModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md p-5 sm:p-8"
            >
              <h3 className="text-xl font-bold mb-6">{editingRole ? 'Editar Cargo' : 'Novo Cargo'}</h3>
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addRole({ name: formData.get('name') });
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Cargo</label>
                  <input name="name" defaultValue={editingRole?.name || ''} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsRoleModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isUserModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsUserModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md p-5 sm:p-8"
            >
              <h3 className="text-xl font-bold mb-6">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addUser({
                  name: formData.get('name'),
                  role: formData.get('role')
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Usuário</label>
                  <input name="name" defaultValue={editingUser?.name || ''} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                {editingUser && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
                    <input value={editingUser?.email || ''} disabled className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg outline-none text-slate-500 cursor-not-allowed" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nível de Acesso</label>
                                    <select name="role" defaultValue={normalizeAccessRole(editingUser?.role) || 'user'} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                    <option value="user">Usuário (Visualização)</option>
                    <option value="supervisor">Supervisor (Edição Operacional)</option>
                    <option value="admin">Administrador (Total)</option>
                  </select>
                </div>
                {!editingUser && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-xs text-amber-800">
                      <strong>Nota:</strong> Novos usuários devem primeiro fazer login com Google para serem registrados no sistema. Após o login, você poderá alterar o nível de acesso deles aqui.
                    </p>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {isShiftPickerOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => {
                setIsShiftPickerOpen(false);
                setShiftPickerTarget(null);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md p-5 sm:p-8"
            >
              <h3 className="text-xl font-bold mb-2">Selecionar Escala</h3>
              <p className="text-sm text-slate-500 mb-6">Escolha o preenchimento para este quadrinho.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'day', label: 'Manhã', time: '07:00', color: 'bg-blue-500 text-white' },
                  { type: 'night', label: 'Tarde', time: '15:00', color: 'bg-orange-500 text-white' },
                  { type: 'vacation', label: 'Férias', time: '-', color: 'bg-amber-500 text-white' },
                  { type: 'absence', label: 'Falta', time: '-', color: 'bg-rose-500 text-white' },
                  { type: 'off_worked', label: 'Folga Trabalhada', time: '-', color: 'bg-emerald-500 text-white' },
                  { type: 'off_taken', label: 'Folga Tirada', time: '-', color: 'bg-red-500/10 text-red-600 border border-red-100' },
                ].map(option => (
                  <button
                    key={`picker-${option.type}`}
                    type="button"
                    onClick={() => {
                      if (!shiftPickerTarget) return;
                      applyShiftLocally(shiftPickerTarget.empId, shiftPickerTarget.dayIndex, option);
                      setIsShiftPickerOpen(false);
                      setShiftPickerTarget(null);
                      void updateShift(shiftPickerTarget.empId, shiftPickerTarget.dayIndex, option);
                    }}
                    className={cn(
                      "p-4 border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left",
                      option.color
                    )}
                  >
                    <p className="font-bold text-sm">{option.label}</p>
                    <p className="text-xs opacity-80">{option.time}</p>
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsShiftPickerOpen(false);
                    setShiftPickerTarget(null);
                  }}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {isShiftModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsShiftModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md p-5 sm:p-8"
            >
              <h3 className="text-xl font-bold mb-6">Trocar ou Limpar Escala</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'day', label: 'Manhã', time: '07:00' },
                  { type: 'night', label: 'Tarde', time: '15:00' },
                  { type: 'vacation', label: 'Férias', time: '-' },
                  { type: 'absence', label: 'Falta', time: '-' },
                  { type: 'off_worked', label: 'Folga Trabalhada', time: '-' },
                  { type: 'off_taken', label: 'Folga Tirada', time: '-' },
                ].map(s => (
                  <button
                    type="button"
                    key={`shift-type-${s.type}`}
                    onClick={() => {
                      updateShift(editingShift.empId, editingShift.dayIndex, s);
                      setIsShiftModalOpen(false);
                      setEditingShift(null);
                    }}
                    className="p-4 border border-slate-100 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <p className="font-bold text-sm">{s.label}</p>
                    <p className="text-xs text-slate-400">{s.time}</p>
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (!editingShift) return;
                    updateShift(editingShift.empId, editingShift.dayIndex, { type: 'empty' });
                    setIsShiftModalOpen(false);
                    setEditingShift(null);
                  }}
                  className="w-full p-4 rounded-xl border border-red-100 bg-red-50 text-red-700 font-bold hover:bg-red-100 transition-colors"
                >
                  Limpar Escala
                </button>
                <p className="mt-2 text-[11px] text-slate-400">
                  Use esta opção quando a escala foi preenchida por engano.
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {isVacationModalOpen && canManageVacations && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => {
                setIsVacationModalOpen(false);
                setEditingVacation(null);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-lg p-5 sm:p-8"
            >
              <h3 className="text-xl font-bold mb-2">{editingVacation ? 'Editar Férias' : 'Nova Férias'}</h3>
              <p className="text-sm text-slate-500 mb-6">Cadastre o nome do colaborador e o período das férias. O setor é identificado automaticamente.</p>
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addVacation({
                  employeeName: formData.get('employeeName'),
                  startDate: formData.get('startDate'),
                  endDate: formData.get('endDate'),
                  notes: formData.get('notes'),
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Colaborador</label>
                  <input
                    name="employeeName"
                    list="vacation-employee-names"
                    defaultValue={editingVacation?.employeeName || ''}
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Digite o nome do colaborador"
                  />
                  <datalist id="vacation-employee-names">
                    {employees.map(emp => (
                      <option key={`vacation-name-${emp.id}`} value={emp.name} />
                    ))}
                  </datalist>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Início</label>
                    <input
                      name="startDate"
                      type="date"
                      defaultValue={editingVacation?.startDate || ''}
                      required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fim</label>
                    <input
                      name="endDate"
                      type="date"
                      defaultValue={editingVacation?.endDate || ''}
                      required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observação</label>
                  <textarea
                    name="notes"
                    defaultValue={editingVacation?.notes || ''}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                    placeholder="Opcional"
                  />
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-800">
                  Se o colaborador existir na base, o setor é preenchido automaticamente. Se não, o registro fica em Sem setor.
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVacationModalOpen(false);
                      setEditingVacation(null);
                    }}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold">
                    {editingVacation ? 'Salvar Alterações' : 'Salvar Férias'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isSectorModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSectorModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md p-5 sm:p-8"
            >
              <h3 className="text-xl font-bold mb-6">{editingSector ? 'Editar Setor' : 'Novo Setor'}</h3>
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addSector(formData.get('name') as string);
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Setor</label>
                  <input name="name" defaultValue={editingSector?.name || ''} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsSectorModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold">
                    {editingSector ? 'Salvar Alterações' : 'Criar Setor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isSpecialScheduleModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => {
                setIsSpecialScheduleModalOpen(false);
                setEditingSpecialSchedule(null);
                setSelectedEmployeesForSpecial([]);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md p-5 sm:p-8 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold mb-6">{editingSpecialSchedule ? 'Editar Escala de Evento' : 'Nova Escala de Evento'}</h3>
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addSpecialSchedule({
                  name: formData.get('name'),
                  date: formData.get('date'),
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Evento</label>
                  <input name="name" defaultValue={editingSpecialSchedule?.name || ''} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data do Evento</label>
                  <input name="date" type="date" defaultValue={editingSpecialSchedule?.date || ''} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Colaboradores Escalados</label>
                  <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg p-2 space-y-1 bg-slate-50">
                    {employees.sort((a, b) => a.name.localeCompare(b.name)).map(emp => (
                      <label key={`select-emp-${emp.id}`} className="flex items-center gap-3 p-2 hover:bg-white rounded-md cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={selectedEmployeesForSpecial.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployeesForSpecial([...selectedEmployeesForSpecial, emp.id]);
                            } else {
                              setSelectedEmployeesForSpecial(selectedEmployeesForSpecial.filter(id => id !== emp.id));
                            }
                          }}
                          className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                        />
                        <div className="flex items-center gap-2">
                          <Image src={getAvatarUrl(emp.avatar, emp.name)} width={24} height={24} className="rounded-full" alt="" referrerPolicy="no-referrer" />
                          <span className="text-sm font-medium text-slate-700">{emp.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold">
                    {selectedEmployeesForSpecial.length} selecionado(s)
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => {
                    setIsSpecialScheduleModalOpen(false);
                    setEditingSpecialSchedule(null);
                    setSelectedEmployeesForSpecial([]);
                  }} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold">
                    {editingSpecialSchedule ? 'Salvar Alterações' : 'Criar Escala'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {isAbsenceModalOpen && canManageIncidentRecords && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAbsenceModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md p-5 sm:p-8"
            >
              <h3 className="text-xl font-bold mb-6">{editingAbsenceAlert ? 'Editar Falta' : 'Registrar Falta'}</h3>
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                registerAbsence(
                  formData.get('employeeId') as string,
                  formData.get('date') as string,
                  formData.get('reason') as string
                );
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data da falta</label>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={editingAbsenceAlert ? String(editingAbsenceAlert.date || '').slice(0, 10) : ''}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Colaborador</label>
                  <select name="employeeId" required defaultValue={editingAbsenceAlert?.employeeId || ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                    <option value="">Selecione um colaborador</option>
                    {employees.map(emp => (
                      <option key={`opt-absence-emp-${emp.id}`} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo (Opcional)</label>
                  <textarea
                    name="reason"
                    defaultValue={editingAbsenceAlert ? getAlertReason(editingAbsenceAlert) : ''}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none h-24"
                    placeholder="Ex: Problemas de saúde, emergência familiar..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setIsAbsenceModalOpen(false); setEditingAbsenceAlert(null); }} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600">Cancelar</button>
                  <button type="submit" disabled={isSubmittingAbsence} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmittingAbsence ? 'Registrando...' : editingAbsenceAlert ? 'Salvar Alterações' : 'Registrar Falta'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {isDoubleShiftModalOpen && canManageIncidentRecords && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDoubleShiftModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md p-5 sm:p-8"
            >
              <h3 className="text-xl font-bold mb-6">{editingDoubleShiftAlert ? 'Editar Dobra' : 'Registrar Dobra'}</h3>
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                registerDoubleShift(
                  formData.get('employeeId') as string,
                  formData.get('date') as string,
                  formData.get('sectorId') as string
                );
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={editingDoubleShiftAlert ? String(editingDoubleShiftAlert.date || '').slice(0, 10) : ''}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Colaborador</label>
                  <select name="employeeId" required defaultValue={editingDoubleShiftAlert?.employeeId || ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                    <option value="">Selecione um colaborador</option>
                    {employees.map(emp => (
                      <option key={`opt-double-emp-${emp.id}`} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Setor</label>
                  <select name="sectorId" required defaultValue={editingDoubleShiftAlert?.sectorId || ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                    <option value="">Selecione um setor</option>
                    {sectors.map(sector => (
                      <option key={`opt-double-sector-${sector.id}`} value={sector.id}>{sector.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setIsDoubleShiftModalOpen(false); setEditingDoubleShiftAlert(null); }} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600">Cancelar</button>
                  <button type="submit" disabled={isSubmittingDoubleShift} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmittingDoubleShift ? 'Registrando...' : editingDoubleShiftAlert ? 'Salvar Alterações' : 'Registrar Dobra'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {isOvertimeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOvertimeModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md p-5 sm:p-8"
            >
              <h3 className="text-xl font-bold mb-6">Solicitar Hora Extra</h3>
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                requestOvertime(
                  formData.get('employeeId') as string,
                  formData.get('date') as string,
                  formData.get('sectorId') as string
                );
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                  <input name="date" type="date" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Colaborador</label>
                  <select name="employeeId" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                    <option value="">Selecione um colaborador</option>
                    {employees.map(emp => (
                      <option key={`opt-overtime-emp-${emp.id}`} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Setor</label>
                  <select name="sectorId" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                    <option value="">Selecione um setor</option>
                    {sectors.map(sector => (
                      <option key={`opt-overtime-sector-${sector.id}`} value={sector.id}>{sector.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsOvertimeModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600">Cancelar</button>
                  <button type="submit" disabled={isSubmittingOvertime} className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmittingOvertime ? 'Enviando...' : 'Solicitar Hora Extra'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* Toast Notification */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 z-[200] px-4 sm:px-6 py-3 rounded-xl shadow-2xl font-bold text-white flex items-center gap-3 sm:max-w-sm",
              toast.type === 'success' ? "bg-emerald-600" : toast.type === 'info' ? "bg-blue-600" : "bg-red-600"
            )}
          >
            {toast.type === 'success' ? <Zap size={18} /> : toast.type === 'info' ? <Info size={18} /> : <AlertCircle size={18} />}
            {toast.message}
          </motion.div>
        )}

        {/* Seed Confirmation Modal */}
        {isSeedConfirmOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSeedConfirmOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-sm p-5 sm:p-8 text-center"
            >
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Database size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Importar base da planilha?</h3>
              <p className="text-slate-500 text-sm mb-8">
                Isso irá adicionar todos os setores, cargos e colaboradores reais ao sistema. Esta ação não pode ser desfeita facilmente.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsSeedConfirmOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    setIsSeedConfirmOpen(false);
                    seedDatabase();
                  }}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

