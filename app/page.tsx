'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import Image from 'next/image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Firebase Imports
import { 
  auth, 
  db, 
  signInWithPopup, 
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

type View = 'dashboard' | 'planner' | 'employees' | 'absences' | 'overtime' | 'sectors' | 'special_schedules' | 'settings' | 'roles' | 'users' | 'reports';

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
    avatar: 'https://picsum.photos/seed/jordan/100/100'
  },
  {
    id: 2,
    name: 'Elena Rodriguez',
    dept: 'Suporte',
    shiftA: '08:00 - 16:00',
    shiftB: '22:00 - 06:00',
    status: 'Consentimento Pendente',
    avatar: 'https://picsum.photos/seed/elena/100/100'
  },
  {
    id: 3,
    name: 'David Chen',
    dept: 'Tecnologia',
    shiftA: '09:00 - 17:00',
    shiftB: '17:00 - 01:00',
    status: 'Período de Descanso OK',
    avatar: 'https://picsum.photos/seed/david/100/100'
  }
];

const PLANNER_DATA = [
  {
    id: 1,
    name: 'Alex Johnson',
    role: 'Supervisor',
    avatar: 'https://picsum.photos/seed/alex/100/100',
    shifts: [
      { day: 1, type: 'day', time: '08:00' },
      { day: 2, type: 'day', time: '08:00' },
      { day: 3, type: 'day', time: '08:00', overtime: true },
      { day: 4, type: 'empty' },
      { day: 5, type: '12x36', time: '08:00' },
      { day: 6, type: 'off' },
      { day: 7, type: 'off' },
      { day: 8, type: 'day', time: '08:00' },
      { day: 9, type: 'vacation' },
      { day: 10, type: 'vacation' },
    ]
  },
  {
    id: 2,
    name: 'Sarah Chen',
    role: 'Técnico',
    avatar: 'https://picsum.photos/seed/sarah/100/100',
    shifts: [
      { day: 1, type: 'empty' },
      { day: 2, type: 'night', time: '22:00' },
      { day: 3, type: 'night', time: '22:00' },
      { day: 4, type: 'night', time: '22:00' },
      { day: 5, type: 'empty' },
      { day: 6, type: 'off', label: 'Folga' },
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
    avatar: 'https://picsum.photos/seed/marcus/100/100',
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

const ShiftBadge = ({ type, time, overtime }: any) => {
  const styles: any = {
    'Manhã': "bg-blue-500 text-white",
    'Tarde': "bg-orange-500 text-white",
    vacation: "bg-amber-500 text-white",
    off: "bg-red-500/10 text-red-600 border border-red-100",
    empty: "border-2 border-dashed border-slate-200 hover:bg-slate-50"
  };

  if (type === 'empty') {
    return (
      <div className={cn("h-10 rounded flex items-center justify-center text-slate-300 cursor-pointer transition-colors", styles.empty)}>
        <Plus size={14} />
      </div>
    );
  }

  if (type === 'off') {
    return (
      <div className={cn("h-10 rounded text-[10px] p-1.5 font-bold flex items-center gap-1", styles.off)}>
        <Ban size={12} />
        <span>Folga</span>
      </div>
    );
  }

  return (
    <div className={cn("h-10 rounded text-[10px] p-1.5 font-bold shadow-sm cursor-move relative", styles[type] || "bg-slate-100 text-slate-400")}>
      <span>{time}</span>
      <br />
      <span className="capitalize">{type}</span>
      {overtime && <Zap size={10} className="absolute bottom-1 right-1 fill-current" />}
      {type === 'vacation' && <Umbrella size={12} className="absolute bottom-1 right-1" />}
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
  const [loginData, setLoginData] = useState({ name: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAlphabetical, setSortAlphabetical] = useState(false);
  const [isSeedConfirmOpen, setIsSeedConfirmOpen] = useState(false);

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
          switch(shift.type) {
            case 'day': typeLabel = 'D'; break;
            case 'night': typeLabel = 'N'; break;
            case '12x36': typeLabel = '12'; break;
            case 'vacation': typeLabel = 'F'; break;
            case 'off': typeLabel = 'O'; break;
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
      
      switch(shift.type) {
        case 'day': typeLabel = 'Manhã'; break;
        case 'night': typeLabel = 'Noite'; break;
        case '12x36': typeLabel = '12x36'; break;
        case 'vacation': typeLabel = 'Férias'; timeLabel = '-'; break;
        case 'off': typeLabel = 'Folga'; timeLabel = '-'; break;
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
          if (data.row.cells[2].raw === 'Folga') {
            data.cell.styles.textColor = [239, 68, 68];
          }
          if (data.row.cells[2].raw === 'Férias') {
            data.cell.styles.textColor = [245, 158, 11];
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

  // Error handling for Firestore
  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  const getAvatarUrl = (url: string | undefined | null, seed: string = 'user') => {
    if (!url || url.trim() === '') {
      return `https://picsum.photos/seed/${seed}/100/100`;
    }
    return url;
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showToast(`Bem-vindo!`);
    } catch (error) {
      console.error("Login error:", error);
      showToast("Erro ao fazer login com Google", "error");
    } finally {
      setIsLoggingIn(false);
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user exists in Firestore, if not create them
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            const newUser = {
              uid: user.uid,
              name: user.displayName || 'Usuário',
              email: user.email || '',
              role: 'user', // Default role
              createdAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', user.uid), newUser);
            setCurrentUser(newUser);
          } else {
            setCurrentUser(userDoc.data());
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
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

    // Listen to users
    const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      setAppUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
    unsubscribers.push(usersUnsub);

    // Listen to config
    const configUnsub = onSnapshot(collection(db, 'config'), (snapshot) => {
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (doc.id === 'rh_email') setRhEmail(data.value);
        if (doc.id === 'dark_mode') setDarkMode(data.value === 'true');
        if (doc.id === 'email_notifications') setEmailNotifications(data.value === 'true');
        if (doc.id === 'email_status') setIsEmailActive(data.active);
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'config'));
    unsubscribers.push(configUnsub);

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

    return () => unsubscribers.forEach(unsub => unsub());
  }, [currentUser?.uid, isAuthReady]);

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
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isDoubleShiftModalOpen, setIsDoubleShiftModalOpen] = useState(false);
  const [isOvertimeModalOpen, setIsOvertimeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [editingSector, setEditingSector] = useState<any>(null);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingSpecialSchedule, setEditingSpecialSchedule] = useState<any>(null);

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
      if (editingUser) {
        await updateDoc(doc(db, 'users', editingUser.id), {
          role: userData.role,
          name: userData.name
        });
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
    console.log("Starting database seeding...");
    try {
      setIsLoading(true);
      const batch = writeBatch(db);

      // 1. Sectors
      console.log("Seeding sectors...");
      const sectorRefs: { [key: string]: string } = {};
      const sectorsData = [
        { name: 'BALCÃO FRIOS', color: '#ef4444', icon: 'Layers' },
        { name: 'EMPADA', color: '#f59e0b', icon: 'Layers' },
        { name: 'ATENDIMENTO MESAS', color: '#3b82f6', icon: 'Users' },
        { name: 'COZINHA DELI', color: '#10b981', icon: 'Layers' },
        { name: 'BALCÃO PÃES E PASTAS', color: '#8b5cf6', icon: 'Layers' },
        { name: 'ATENDIMENTO LOJA', color: '#6366f1', icon: 'Users' },
        { name: 'PADARIA', color: '#f97316', icon: 'Layers' },
        { name: 'ESTOQUE', color: '#64748b', icon: 'Database' },
        { name: 'ESCRITÓRIO', color: '#475569', icon: 'Briefcase' },
        { name: 'BALCÃO SANDUÍCHE', color: '#ec4899', icon: 'Layers' },
        { name: 'SERVIÇOS GERAIS', color: '#94a3b8', icon: 'Briefcase' },
        { name: 'PADARIA EMBALAGEM', color: '#d946ef', icon: 'Layers' },
        { name: 'CONFEITARIA', color: '#f43f5e', icon: 'Layers' },
        { name: 'MANUTENÇÃO', color: '#0ea5e9', icon: 'Settings' },
        { name: 'ATENDIMENTO CAIXAS', color: '#14b8a6', icon: 'Users' },
        { name: 'EXPEDIÇÃO', color: '#84cc16', icon: 'Database' },
        { name: 'AÇOUGUE', color: '#b91c1c', icon: 'Layers' },
        { name: 'ENTREGADOR MOTO', color: '#7c3aed', icon: 'Briefcase' },
        { name: 'SUCOS', color: '#fbbf24', icon: 'Layers' },
        { name: 'MASSAS', color: '#d97706', icon: 'Layers' }
      ];

      for (const sector of sectorsData) {
        const ref = doc(collection(db, 'sectors'));
        batch.set(ref, sector);
        sectorRefs[sector.name] = ref.id;
      }

      // 2. Roles
      console.log("Seeding roles...");
      const roleRefs: { [key: string]: string } = {};
      const roleNames = [
        'ATENDENTE 2', 'COZINHEIRO(A) 1', 'CUMIM', 'AJUDANTE DE COZINHA', 'LANCHEIRO 2 A',
        'ATENDENTE EXPERIÊNCIA', 'ATENDENTE 4', 'PADEIRO 4', 'JOVEM APRENDIZ A', 'ESTOQUISTA 2',
        'TÉCNICA EM NUTRIÇÃO', 'ASSIST. ADMINISTRATIVO 2', 'GARÇOM', 'SUPERVISOR 1',
        'AUXILIAR DE LANCHEIRO', 'AUX. SERVIÇOS GERAIS', 'JOVEM APRENDIZ B', 'GARÇOM 1',
        'LANCHEIRO 4', 'CONFEITEIRO 2', 'LANCHEIRO', 'AUX. MANUTENÇÃO 3', 'CONFEITEIRO 3',
        'PADEIRO 3', 'OPERADOR(A) DE CAIXA', 'AUX. SERV. GERAIS EXPERIÊNCIA', 'ATENDENTE',
        'PADEIRO 1', 'CUMIM 2', 'COZINHEIRO(A) 2', 'AJUDANTE DE PADEIRO',
        'OPERADOR(A) DE CAIXA EXPERIÊNCIA', 'EMBALADOR', 'LANCHEIRO 3', 'AÇOUGUEIRO 2',
        'AUX. MANUTENÇÃO III', 'PADEIRO', 'AUXILIAR DE CONFEITEIRO', 'PADEIRO 2 A',
        'ATENDENTE 3', 'COZINHEIRO(A) 3', 'SUPERVISOR', 'SUPERVISOR 2', 'COMPRADOR 1',
        'PADEIRO 2 B', 'CONFEITEIRO', 'ATENDENTE 1', 'MOTOCICLISTA', 'LANCHEIRO 2 B',
        'ESTOQUISTA AUXILIAR', 'EMBALADOR 1', 'COORDENADORA DE SUPRIMENTOS',
        'COORDENADOR ADMINISTRATIVO', 'SUPERVISOR 3', 'ESTOQUISTA', 'AÇOUGUEIRO 1'
      ];

      for (const name of roleNames) {
        const ref = doc(collection(db, 'roles'));
        batch.set(ref, { name });
        roleRefs[name] = ref.id;
      }

      // 3. Employees
      console.log("Seeding employees...");
      const employeesData = [
        { n: 'Abraão Resende Ivo', s: 'BALCÃO FRIOS', r: 'ATENDENTE 2' },
        { n: 'Ademilson da Cruz Santana', s: 'EMPADA', r: 'COZINHEIRO(A) 1' },
        { n: 'Adrielly Xavier da Silva', s: 'ATENDIMENTO MESAS', r: 'CUMIM' },
        { n: 'Alane da Silva Duarte', s: 'EMPADA', r: 'AJUDANTE DE COZINHA' },
        { n: 'Aldenir Severino da Silva', s: 'COZINHA DELI', r: 'LANCHEIRO 2 A' },
        { n: 'Aleksandra de Mesquita', s: 'BALCÃO PÃES E PASTAS', r: 'ATENDENTE EXPERIÊNCIA' },
        { n: 'Aleksandro Suarez', s: 'ATENDIMENTO LOJA', r: 'ATENDENTE 4' },
        { n: 'Alex Alexandre de Aguiar', s: 'PADARIA', r: 'PADEIRO 4' },
        { n: 'Alex Braga Nunes', s: 'EMPADA', r: 'JOVEM APRENDIZ A' },
        { n: 'Alex Silva de Souza', s: 'ESTOQUE', r: 'ESTOQUISTA 2' },
        { n: 'Alexia dos Santos Sambonha', s: 'ESCRITÓRIO', r: 'TÉCNICA EM NUTRIÇÃO' },
        { n: 'Amanda Andrade da Silva', s: 'ESCRITÓRIO', r: 'ASSIST. ADMINISTRATIVO 2' },
        { n: 'Amilton de Jesus Ferreira dos Santos', s: 'ATENDIMENTO MESAS', r: 'GARÇOM' },
        { n: 'Ana Carolina Mendonça Romeu', s: 'ATENDIMENTO LOJA', r: 'SUPERVISOR 1' },
        { n: 'Ana Roberta Gomes de Brito', s: 'BALCÃO SANDUÍCHE', r: 'AUXILIAR DE LANCHEIRO' },
        { n: 'Andrea da Conceição Rosa', s: 'SERVIÇOS GERAIS', r: 'AUX. SERVIÇOS GERAIS' },
        { n: 'Anna Paula Fabiola Gomes', s: 'PADARIA EMBALAGEM', r: 'JOVEM APRENDIZ A' },
        { n: 'Antonia Lailane Farias Veras', s: 'ATENDIMENTO MESAS', r: 'GARÇOM 1' },
        { n: 'Antonio Carlos Torres', s: 'BALCÃO SANDUÍCHE', r: 'LANCHEIRO 4' },
        { n: 'Antonio Cleiton Lopes Leitão', s: 'CONFEITARIA', r: 'CONFEITEIRO 2' },
        { n: 'Antonio Dos Reis de Sena Rosa', s: 'COZINHA DELI', r: 'LANCHEIRO' },
        { n: 'Antonio Feliciano da Silva', s: 'BALCÃO SANDUÍCHE', r: 'LANCHEIRO 2 A' },
        { n: 'Antonio Itamar Silva Camelo', s: 'COZINHA', r: 'COZINHEIRO(A) 1' },
        { n: 'Antonio José de Freitas Neto', s: 'MANUTENÇÃO', r: 'AUX. MANUTENÇÃO 3' },
        { n: 'Antonio Marcio Victor Otaviano', s: 'CONFEITARIA', r: 'CONFEITEIRO 3' },
        { n: 'Antonio Raquel da Silva', s: 'PADARIA', r: 'PADEIRO 3' },
        { n: 'Brenda Alves do Carmo', s: 'ATENDIMENTO CAIXAS', r: 'OPERADOR(A) DE CAIXA' },
        { n: 'Brendom Tavares de Melo', s: 'SERVIÇOS GERAIS', r: 'AUX. SERV. GERAIS EXPERIÊNCIA' },
        { n: 'Bruna Roberta de Andrade', s: 'BALCÃO PÃES E PASTAS', r: 'ATENDENTE' },
        { n: 'Bruno Mendonça Edizio', s: 'BALCÃO FRIOS', r: 'ATENDENTE 2' },
        { n: 'Caiane Mendonça Serra', s: 'BALCÃO PÃES E PASTAS', r: 'ATENDENTE' },
        { n: 'Camille de Campos Alves', s: 'CONFEITARIA', r: 'JOVEM APRENDIZ A' },
        { n: 'Carlos Alberto Silva Bezerra', s: 'COZINHA', r: 'COZINHEIRO(A) 1' },
        { n: 'Carlos Henrique Viana Felicio', s: 'COZINHA DELI', r: 'AUXILIAR DE LANCHEIRO' },
        { n: 'Carolina Alonso Gonçalves', s: 'ATENDIMENTO CAIXAS', r: 'OPERADOR(A) DE CAIXA EXPERIÊNCIA' },
        { n: 'Cecilia Brum Maciel', s: 'BALCÃO PÃES E PASTAS', r: 'ATENDENTE' },
        { n: 'Celso Santos de Souza', s: 'PADARIA', r: 'PADEIRO 1' },
        { n: 'Cintia Teixeira Coelho', s: 'BALCÃO PÃES E PASTAS', r: 'ATENDENTE' },
        { n: 'Cirlene Rodrigues de Souza Ferreira de Andrade', s: 'EMPADA', r: 'AJUDANTE DE COZINHA' },
        { n: 'Claudia Regina Moreira Santana', s: 'ATENDIMENTO MESAS', r: 'CUMIM 2' },
        { n: 'Clenilson Oliveira Santos', s: 'MASSAS', r: 'COZINHEIRO(A) 2' },
        { n: 'Cosme Viana Felicio', s: 'PADARIA', r: 'AJUDANTE DE PADEIRO' },
        { n: 'Cristiana Alves de Souza', s: 'ATENDIMENTO CAIXAS', r: 'OPERADOR(A) DE CAIXA EXPERIÊNCIA' },
        { n: 'Daniela Silva do Nascimento', s: 'ATENDIMENTO MESAS', r: 'CUMIM' },
        { n: 'Dayane Coelho Moreira', s: 'ATENDIMENTO CAIXAS', r: 'OPERADOR(A) DE CAIXA' },
        { n: 'Deuselina Gomes da Silva', s: 'EXPEDIÇÃO', r: 'ATENDENTE 2' },
        { n: 'Diogo Roberto de Sousa Gonçalves', s: 'PADARIA', r: 'PADEIRO 1' },
        { n: 'Eduardo de Oliveira', s: 'COZINHA', r: 'COZINHEIRO(A)' },
        { n: 'Elibaldo dos Santos Costa', s: 'PADARIA', r: 'PADEIRO 3' },
        { n: 'Elinai Felizardo dos Santos', s: 'BALCÃO FRIOS', r: 'ATENDENTE 2' },
        { n: 'Elizangela Alves Cardoso', s: 'PADARIA EMBALAGEM', r: 'EMBALADOR' },
        { n: 'Elizângela da Silva Santana', s: 'BALCÃO PÃES E PASTAS', r: 'ATENDENTE EXPERIÊNCIA' },
        { n: 'Emerson Ferreira da Silva', s: 'EXPEDIÇÃO', r: 'ATENDENTE 2' },
        { n: 'Enestine Pereira do Carmo Araújo', s: 'ATENDIMENTO MESAS', r: 'CUMIM' },
        { n: 'Eriberto Ferreira da Silva', s: 'BALCÃO SANDUÍCHE', r: 'LANCHEIRO 3' },
        { n: 'Evillyn Ingrid da Silva', s: 'CONFEITARIA', r: 'JOVEM APRENDIZ A' },
        { n: 'Fabio Soares Barrão', s: 'MASSAS', r: 'COZINHEIRO(A)' },
        { n: 'Francinaldo Guedes da Silva', s: 'ATENDIMENTO MESAS', r: 'GARÇOM' },
        { n: 'Francirany Alves de Sousa', s: 'BALCÃO PÃES E PASTAS', r: 'ATENDENTE EXPERIÊNCIA' },
        { n: 'Francisca Evanilde de Lima Souza', s: 'COZINHA', r: 'COZINHEIRO(A)' },
        { n: 'Francisco Edson Pereira Moura', s: 'COZINHA DELI', r: 'AUXILIAR DE LANCHEIRO' },
        { n: 'Francisco Leonardo Braga Lima', s: 'ATENDIMENTO CAIXAS', r: 'OPERADOR(A) DE CAIXA EXPERIÊNCIA' },
        { n: 'Francisco Marquilane dos Santos', s: 'AÇOUGUE', r: 'AÇOUGUEIRO 2' },
        { n: 'Gabriel Pereira da Silva', s: 'MANUTENÇÃO', r: 'AUX. MANUTENÇÃO III' },
        { n: 'Gabriel Vidal Teles de Carvalho', s: 'COZINHA DELI', r: 'AUXILIAR DE LANCHEIRO' },
        { n: 'Gideão Xavier Sant\'anna Martins', s: 'COZINHA DELI', r: 'AUXILIAR DE LANCHEIRO' },
        { n: 'Gilson Rodolfo da Costa', s: 'ATENDIMENTO MESAS', r: 'GARÇOM' },
        { n: 'Giovanni José F Gomes', s: 'PADARIA', r: 'PADEIRO' },
        { n: 'Giselle Favianna Splendiani Yanez', s: 'CONFEITARIA', r: 'AUXILIAR DE CONFEITEIRO' },
        { n: 'Gizele Marinho Nunes', s: 'SERVIÇOS GERAIS', r: 'AUX. SERV. GERAIS EXPERIÊNCIA' },
        { n: 'Graciele Marques de Sousa Mesquita', s: 'ATENDIMENTO MESAS', r: 'GARÇOM 1' },
        { n: 'Guilherme Vitelly Marinho da Rocha', s: 'ESTOQUE', r: 'JOVEM APRENDIZ A' },
        { n: 'Gustavo Batista da Costa', s: 'PADARIA', r: 'PADEIRO 2 A' },
        { n: 'Gutemberg Martins de Farias', s: 'COZINHA', r: 'COZINHEIRO(A) 2' },
        { n: 'Helber Pinheiro dos Santos', s: 'COZINHA DELI', r: 'AUXILIAR DE LANCHEIRO' },
        { n: 'Henrique Ernesto da Silva', s: 'COZINHA DELI', r: 'AUXILIAR DE LANCHEIRO' },
        { n: 'Iago Miguel Barbosa de Oliveira', s: 'SERVIÇOS GERAIS', r: 'AUX. SERV. GERAIS EXPERIÊNCIA' },
        { n: 'Igor Bezerra Ferreira', s: 'BALCÃO PÃES E PASTAS', r: 'ATENDENTE' },
        { n: 'Inácia Ribeiro da Silva', s: 'COZINHA DELI', r: 'LANCHEIRO' },
        { n: 'Inan Rosa Rodrigues', s: 'COZINHA DELI', r: 'LANCHEIRO' },
        { n: 'Isabella Cristine Chavantes Rafael', s: 'CONFEITARIA', r: 'OPERADOR(A) DE CAIXA EXPERIÊNCIA' },
        { n: 'Isis Mayara Candido Albuquerque', s: 'BALCÃO PÃES E PASTAS', r: 'ATENDENTE' },
        { n: 'Israel da Conceição Gama', s: 'BALCÃO SANDUÍCHE', r: 'ATENDENTE EXPERIÊNCIA' },
        { n: 'Janaína Gomes Soares', s: 'PADARIA', r: 'AJUD. PADEIRO EXPERIÊNCIA' },
        { n: 'Jaqueline Santos da Silva', s: 'ATENDIMENTO MESAS', r: 'GARÇOM' },
        { n: 'Jeferson Alves Daniel', s: 'BALCÃO FRIOS', r: 'ATENDENTE 3' },
        { n: 'Joelane Rocha de O Santos', s: 'COZINHA', r: 'COZINHEIRO(A) 3' },
        { n: 'Joana Maria Ferreira Sousa', s: 'ATENDIMENTO LOJA', r: 'SUPERVISOR' },
        { n: 'João Antonio Marques de Araujo', s: 'ATENDIMENTO LOJA', r: 'SUPERVISOR 2' },
        { n: 'João Batista Ferreira da Silva', s: 'ESTOQUE', r: 'COMPRADOR 1' },
        { n: 'João Douglas Pereira de Vasconcelos', s: 'ATENDIMENTO MESAS', r: 'CUMIM' },
        { n: 'João Paulo Raquel da Silva', s: 'PADARIA', r: 'PADEIRO 2 B' },
        { n: 'João Vitor Rodrigues da Silva', s: 'ESTOQUE', r: 'ESTOQUISTA 2' },
        { n: 'John Lenon Sousa Araújo', s: 'BALCÃO SANDUÍCHE', r: 'AUXILIAR DE LANCHEIRO' },
        { n: 'Jonatham Batista Tavares', s: 'SERVIÇOS GERAIS', r: 'AUX. SERVIÇOS GERAIS' },
        { n: 'Jorge Henrique Lobo Leite da Costa', s: 'SERVIÇOS GERAIS', r: 'JOVEM APRENDIZ A' },
        { n: 'Jorge Luiz Carvalho Silva', s: 'ESTOQUE', r: 'ESTOQUISTA 2' },
        { n: 'José Ailton Gonçalves Araújo', s: 'PADARIA', r: 'PADEIRO 2 B' },
        { n: 'José Carlos Higino de Oliveira', s: 'BALCÃO FRIOS', r: 'ATENDENTE 4' },
        { n: 'José Francisco de Souza', s: 'SERVIÇOS GERAIS', r: 'AUX. SERVIÇOS GERAIS' },
        { n: 'José Pedro da Silva Pereira', s: 'CONFEITARIA', r: 'CONFEITEIRO' },
        { n: 'José Roberto de Sousa Matias', s: 'PADARIA', r: 'PADEIRO 1' },
        { n: 'Josean da Silva', s: 'AÇOUGUE', r: 'AÇOUGUEIRO 2' },
        { n: 'Joselito Ferreira de França', s: 'BALCÃO FRIOS', r: 'ATENDENTE 3' },
        { n: 'Josiel de Jesus França da Silva', s: 'ESTOQUE', r: 'COMPRADOR 1' },
        { n: 'Julia Conceição Corrêa', s: 'COZINHA', r: 'COZINHEIRO(A) 1' },
        { n: 'Juliana Alves Ferreira', s: 'ATENDIMENTO LOJA', r: 'SUPERVISOR 2' },
        { n: 'Kayane Juvino do Nascimento', s: 'ATENDIMENTO CAIXAS', r: 'ATENDENTE' },
        { n: 'Laerto Cipriano de Paula', s: 'PADARIA', r: 'PADEIRO 1' },
        { n: 'Layla Araújo Pereira', s: 'BALCÃO PÃES E PASTAS', r: 'ATENDENTE 1' },
        { n: 'Leandro Rodrigues da Silva', s: 'ENTREGADOR MOTO', r: 'MOTOCICLISTA' },
        { n: 'Lediana Maria da Silva', s: 'EXPEDIÇÃO', r: 'OPERADOR(A) DE CAIXA' },
        { n: 'Leonardo Barbosa Tavares Simplicio', s: 'PADARIA', r: 'PADEIRO 3' },
        { n: 'Leonardo de Sousa Mota', s: 'PADARIA', r: 'PADEIRO 3' },
        { n: 'Leonardo Silva dos Santos', s: 'BALCÃO FRIOS', r: 'ATENDENTE 2' },
        { n: 'Leticia Campos de Araujo da Silva', s: 'ESCRITÓRIO', r: 'ASSIST. ADMINISTRATIVO 2' },
        { n: 'Lorrana Cristina de Souza Bento', s: 'ATENDIMENTO MESAS', r: 'CUMIM 1' },
        { n: 'Luana dos Santos Peçanha', s: 'EMPADA', r: 'AJUDANTE DE COZINHA' },
        { n: 'Luis Horacio Filho', s: 'PADARIA', r: 'PADEIRO 4' },
        { n: 'Luisa Eliete de Abreu', s: 'BALCÃO SANDUÍCHE', r: 'LANCHEIRO 2 B' },
        { n: 'Luiz Carlos da Silva', s: 'BALCÃO FRIOS', r: 'ATENDENTE EXPERIÊNCIA' },
        { n: 'Luiz Henrique Frazão de Azevedo', s: 'ESTOQUE', r: 'ESTOQUISTA AUXILIAR' },
        { n: 'Maico de Mesquita Torres', s: 'CONFEITARIA', r: 'CONFEITEIRO 2' },
        { n: 'Maise Estefani Soares Pinheiro', s: 'BALCÃO PÃES E PASTAS', r: 'ATENDENTE EXPERIÊNCIA' },
        { n: 'Manoella Ernesto Silva', s: 'PADARIA EMBALAGEM', r: 'EMBALADOR 1' },
        { n: 'Marcela Zampari', s: 'ESCRITÓRIO', r: 'COORDENADORA DE SUPRIMENTOS' },
        { n: 'Marcelo Benedito de Abreu', s: 'EXPEDIÇÃO', r: 'ATENDENTE 2' },
        { n: 'Marcelo Pereira Bittencourt de Souza', s: 'ESCRITÓRIO', r: 'COORDENADOR ADMINISTRATIVO' },
        { n: 'Marcelo Pereira da Costa', s: 'ATENDIMENTO MESAS', r: 'CUMIM' },
        { n: 'Marcelo Sousa da Silva', s: 'EMPADA', r: 'COZINHEIRO(A) 1' },
        { n: 'Marco Antonio da Conceição Pereira', s: 'BALCÃO FRIOS', r: 'ATENDENTE 2' },
        { n: 'Marcos Barbosa Cavalcante', s: 'COZINHA DELI', r: 'LANCHEIRO 2 A' },
        { n: 'Maria Elizangela Ferreira Miranda', s: 'ATENDIMENTO CAIXAS', r: 'OPERADOR(A) DE CAIXA' },
        { n: 'Maria Lorrainy dos Santos Freitas', s: 'ATENDIMENTO CAIXAS', r: 'OPERADOR(A) DE CAIXA EXPERIÊNCIA' },
        { n: 'Maria Luiza Paulo Silva', s: 'PADARIA EMBALAGEM', r: 'EMBALADOR 1' },
        { n: 'Maria Luzia dos Santos', s: 'SERVIÇOS GERAIS', r: 'AUX. SERV. GERAIS EXPERIÊNCIA' },
        { n: 'Maria Salete da Silva Pereira', s: 'EXPEDIÇÃO', r: 'ATENDENTE 3' },
        { n: 'Maria Tainá Araújo Veras', s: 'ATENDIMENTO LOJA', r: 'SUPERVISOR 3' },
        { n: 'Maria Weslaine da Silva', s: 'BALCÃO PÃES E PASTAS', r: 'ATENDENTE EXPERIÊNCIA' },
        { n: 'Mariana da Silva Mendes', s: 'ATENDIMENTO LOJA', r: 'SUPERVISOR 1' },
        { n: 'Marys Stella Correa Alves', s: 'PADARIA EMBALAGEM', r: 'EMBALADOR' },
        { n: 'Matheus Araújo dos Anjos', s: 'PADARIA', r: 'AJUDANTE DE PADEIRO' },
        { n: 'Mauro da Silva Ezidio', s: 'COZINHA DELI', r: 'LANCHEIRO 3' },
        { n: 'Michael Douglas Madeira de Sousa', s: 'ESTOQUE', r: 'ESTOQUISTA AUXILIAR' },
        { n: 'Nadila Silene Correia Alves', s: 'CONFEITARIA', r: 'CONFEITEIRO 3' },
        { n: 'Nicolas Mesquita Nascimento', s: 'COZINHA DELI', r: 'AUXILIAR DE LANCHEIRO' },
        { n: 'Pablo Souza Melo', s: 'ESTOQUE', r: 'ESTOQUISTA' },
        { n: 'Pamela Rosa dos Santos', s: 'BALCÃO SANDUÍCHE', r: 'AUXILIAR DE LANCHEIRO' },
        { n: 'Paulo Edgley Serafim', s: 'COZINHA DELI', r: 'AUX. SERV. GERAIS EXPERIÊNCIA' },
        { n: 'Paulo Sérgio da Cunha', s: 'AÇOUGUE', r: 'AÇOUGUEIRO 1' },
        { n: 'Pedro Henrique de Paiva da Silva', s: 'PADARIA', r: 'AJUDANTE DE PADEIRO' },
        { n: 'Pedro Ryan Silva Martins', s: 'PADARIA', r: 'JOVEM APRENDIZ A' },
        { n: 'Rafael Silva Lima', s: 'SERVIÇOS GERAIS', r: 'AUX. SERVIÇOS GERAIS' },
        { n: 'Raionara Pequeno', s: 'CONFEITARIA', r: 'CONFEITEIRO 2' },
        { n: 'Raniery Alisson dos Santos', s: 'PADARIA', r: 'AUX. SERV. GERAIS EXPERIÊNCIA' },
        { n: 'Raquel de Cassia Kmipp', s: 'BALCÃO PÃES E PASTAS', r: 'ATENDENTE' },
        { n: 'Rhayellen de Sousa Chaves', s: 'ATENDIMENTO CAIXAS', r: 'OPERADOR(A) DE CAIXA EXPERIÊNCIA' },
        { n: 'Risomar Teles Capitulino', s: 'SERVIÇOS GERAIS', r: 'AUX. SERVIÇOS GERAIS' },
        { n: 'Roberto Barbosa da Silva', s: 'BALCÃO FRIOS', r: 'ATENDENTE 3' },
        { n: 'Robson Barros de Oliveira Júnior', s: 'COZINHA', r: 'COZINHEIRO(A) 1' },
        { n: 'Ruan Kmipp Velasco da Silva', s: 'COZINHA', r: 'AJUDANTE DE COZINHA' },
        { n: 'Sarah Batista Bittencourt', s: 'COZINHA', r: 'JOVEM APRENDIZ A' },
        { n: 'Sérgio Paulino da Silva', s: 'AÇOUGUE', r: 'AÇOUGUEIRO 2' },
        { n: 'Silvana dos Reis Gomes', s: 'SUCOS', r: 'AUXILIAR DE LANCHEIRO' },
        { n: 'Stephanie Luiza Torres', s: 'ATENDIMENTO CAIXAS', r: 'OPERADOR(A) DE CAIXA EXPERIÊNCIA' },
        { n: 'Sueli Rodrigues dos Santos', s: 'SERVIÇOS GERAIS', r: 'AUX. SERVIÇOS GERAIS' },
        { n: 'Suellen Alves do Nascimento', s: 'ATENDIMENTO MESAS', r: 'GARÇOM' },
        { n: 'Taele Santos Cunha', s: 'CONFEITARIA', r: 'AUXILIAR DE CONFEITEIRO' },
        { n: 'Tamara de Souza Prazeres', s: 'CONFEITARIA', r: 'JOVEM APRENDIZ A' },
        { n: 'Tamires Mendes Fernandes', s: 'ATENDIMENTO MESAS', r: 'GARÇOM' },
        { n: 'Tereza Alves da Silva', s: 'SERVIÇOS GERAIS', r: 'AUX. SERV. GERAIS EXPERIÊNCIA' },
        { n: 'Virna Maria Bezerra Nascimento', s: 'EXPEDIÇÃO', r: 'ATENDENTE 1' },
        { n: 'Wellington de Menezes de Lima', s: 'SERVIÇOS GERAIS', r: 'AUX. SERV. GERAIS EXPERIÊNCIA' },
        { n: 'Weras Johnson Damião da Silva', s: 'CONFEITARIA', r: 'CONFEITEIRO' },
        { n: 'Zenilton da Silva Basilio', s: 'SERVIÇOS GERAIS', r: 'AJUDANTE DE PADEIRO' },
        { n: 'Zuilene Rodrigues de Sousa', s: 'SERVIÇOS GERAIS', r: 'AUX. SERVIÇOS GERAIS' }
      ];

      // Split into chunks of 100 to avoid batch limits if needed, 
      // but here we have ~176 employees + ~20 sectors + ~50 roles = ~250 ops.
      // Firestore batch limit is 500.

      for (const emp of employeesData) {
        const ref = doc(collection(db, 'employees'));
        batch.set(ref, {
          name: emp.n,
          sectorId: sectorRefs[emp.s] || sectorRefs['SERVIÇOS GERAIS'],
          roleId: roleRefs[emp.r] || roleRefs['ATENDENTE'],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // 4. Default Config
      console.log("Seeding default config...");
      const rhEmailRef = doc(db, 'config', 'rh_email');
      batch.set(rhEmailRef, { value: 'sistemas@talhodelicatessen.com.br' });

      const emailNotifRef = doc(db, 'config', 'email_notifications');
      batch.set(emailNotifRef, { value: 'true' });

      console.log("Committing batch...");
      await batch.commit();
      console.log("Batch committed successfully!");
      showToast("Banco de dados populado com sucesso!");
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

  const saveConfig = async (key: string, value: string, silent = false) => {
    try {
      await setDoc(doc(db, 'config', key), { value, updatedAt: serverTimestamp() });
      if (!silent) showToast("Configuração salva!");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `config/${key}`);
    }
  };

  const deleteSpecialSchedule = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'special_schedules', id));
      showToast("Escala especial removida.");
    } catch (e) { 
      handleFirestoreError(e, OperationType.DELETE, `special_schedules/${id}`);
    }
  };

  const updateShift = async (empId: string, dayIndex: number, newShift: any) => {
    try {
      const day = dayIndex + 1;
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const shiftId = `${year}-${month}-${day}`;
      
      const shiftRef = doc(db, `employees/${empId}/shifts`, shiftId);
      await setDoc(shiftRef, {
        day,
        month,
        year,
        type: newShift.type,
        time: newShift.time,
        overtime: newShift.overtime || false,
        updatedAt: serverTimestamp()
      });
      
      showToast("Escala atualizada!");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `employees/${empId}/shifts`);
    }
  };

  const removeAlert = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'alerts', id));
      showToast("Alerta removido.");
    } catch (e) { 
      handleFirestoreError(e, OperationType.DELETE, `alerts/${id}`);
    }
  };

  const registerAbsence = async (employeeId: string, reason: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    try {
      // Send real email
      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: rhEmail,
          subject: `NOTIFICAÇÃO DE FALTA: ${employee.name}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #e11d48;">Notificação de Falta</h2>
              <p><strong>Colaborador:</strong> ${employee.name}</p>
              <p><strong>Cargo:</strong> ${employee.role}</p>
              <p><strong>Motivo:</strong> ${reason || 'Não informado'}</p>
              <p><strong>Data do Registro:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666;">Este é um e-mail automático do sistema ShiftMaster.</p>
            </div>
          `
        })
      });

      if (!emailRes.ok) {
        const errorData = await emailRes.json();
        console.error("Email error:", errorData.error);
        showToast(`Alerta: O registro foi feito, mas o e-mail para o RH falhou: ${errorData.error}`, "error");
      }

      await addDoc(collection(db, 'alerts'), {
        type: 'error',
        title: `Falta: ${employee.name}`,
        description: `Colaborador: ${employee.name} | Motivo: ${reason || 'Não informado'} | Notificação enviada para ${rhEmail}`,
        employeeId: employee.id,
        createdAt: serverTimestamp()
      });
      
      showToast("Ausência registrada e RH notificado por e-mail!");
      setIsAbsenceModalOpen(false);
    } catch (e) { 
      handleFirestoreError(e, OperationType.CREATE, 'alerts');
    }
  };
  
  const registerDoubleShift = async (employeeId: string, date: string, sectorId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    const sector = sectors.find(s => s.id === sectorId);
    if (!employee || !sector) return;

    try {
      // Send real email
      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: rhEmail,
          subject: `NOTIFICAÇÃO DE DOBRA: ${employee.name}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #f59e0b;">Notificação de Dobra</h2>
              <p><strong>Colaborador:</strong> ${employee.name}</p>
              <p><strong>Data da Dobra:</strong> ${date}</p>
              <p><strong>Setor:</strong> ${sector.name}</p>
              <p><strong>Data do Registro:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666;">Este é um e-mail automático do sistema ShiftMaster.</p>
            </div>
          `
        })
      });

      if (!emailRes.ok) {
        const errorData = await emailRes.json();
        console.error("Email error:", errorData.error);
        showToast(`Alerta: O registro foi feito, mas o e-mail para o RH falhou: ${errorData.error}`, "error");
      }

      await addDoc(collection(db, 'alerts'), {
        type: 'warning',
        title: `Dobra: ${employee.name}`,
        description: `Colaborador: ${employee.name} | Data: ${date} | Setor: ${sector.name} | Notificação enviada para ${rhEmail}`,
        sectorId: sector.id,
        employeeId: employee.id,
        createdAt: serverTimestamp()
      });
      
      showToast("Dobra registrada e RH notificado por e-mail!");
      setIsDoubleShiftModalOpen(false);
    } catch (e) { 
      handleFirestoreError(e, OperationType.CREATE, 'alerts');
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

  const requestOvertime = async (employeeId: string, date: string, sectorId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    const sector = sectors.find(s => s.id === sectorId);
    if (!employee || !sector) return;

    try {
      // Send real email
      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: rhEmail,
          subject: `SOLICITAÇÃO DE HORA EXTRA: ${employee.name}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #f59e0b;">Solicitação de Hora Extra</h2>
              <p><strong>Colaborador:</strong> ${employee.name}</p>
              <p><strong>Data Solicitada:</strong> ${date}</p>
              <p><strong>Setor:</strong> ${sector.name}</p>
              <p><strong>Data do Registro:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666;">Este é um e-mail automático do sistema ShiftMaster.</p>
            </div>
          `
        })
      });

      if (!emailRes.ok) {
        const errorData = await emailRes.json();
        console.error("Email error:", errorData.error);
        showToast(`Alerta: A solicitação foi feita, mas o e-mail para o RH falhou: ${errorData.error}`, "error");
      }

      await addDoc(collection(db, 'alerts'), {
        type: 'warning',
        title: `Solicitação de Hora Extra: ${employee.name}`,
        description: `Colaborador: ${employee.name} | Data: ${date} | Setor: ${sector.name} | Notificação enviada para ${rhEmail}`,
        sectorId: sector.id,
        employeeId: employee.id,
        createdAt: serverTimestamp()
      });
      
      showToast("Solicitação enviada ao RH por e-mail!");
      setIsOvertimeModalOpen(false);
    } catch (e) { 
      handleFirestoreError(e, OperationType.CREATE, 'alerts');
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
          className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/20">
              <Shield size={32} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Escala Ipanema</h1>
            <p className="text-slate-500 text-sm">Acesse sua conta para gerenciar escalas</p>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-blue-100 transition-all group disabled:opacity-50"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Image src="https://www.google.com/favicon.ico" alt="Google" width={20} height={20} />
                Entrar com Google
              </>
            )}
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
        "flex h-screen overflow-hidden font-display relative transition-colors duration-200",
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
        "fixed inset-y-0 left-0 z-50 w-64 border-r flex flex-col shrink-0 transition-transform lg:relative lg:translate-x-0",
        darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
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
            badge={alerts.length.toString()} 
            active={view === 'absences'}
            onClick={() => { setView('absences'); setIsSidebarOpen(false); }}
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
              <p className="text-[10px] text-slate-500 uppercase font-bold">{currentUser?.isMaster ? "Master" : "Admin"}</p>
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
          "backdrop-blur-md border-b px-4 lg:px-8 py-4 flex items-center justify-between shrink-0",
          darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"
        )}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
            >
              <LayoutDashboard size={20} />
            </button>
            <div>
              <h2 className="text-lg lg:text-xl font-bold">
                {view === 'dashboard' && 'Escala Ipanema'}
                {view === 'planner' && 'Planejador de Turnos'}
                {view === 'employees' && 'Gestão de Colaboradores'}
                {view === 'roles' && 'Gestão de Cargos'}
                {view === 'sectors' && 'Gestão de Setores'}
                {view === 'users' && 'Gestão de Usuários'}
                {view === 'absences' && 'Gestão de Ausências'}
                {view === 'overtime' && 'Horas Extras'}
              </h2>
              <p className="text-xs lg:text-sm text-slate-500 hidden sm:block">
                {view === 'dashboard' ? 'Visão geral em tempo real da força de trabalho e turnos' : 'Armazém Principal • 24 Funcionários Ativos'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
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
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative">
              <Bell size={20} />
              {alerts.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
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
        <div className="flex-1 overflow-y-auto p-8">
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
                    value={alerts.filter(a => a.type === 'warning').length.toString()} 
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Presence Chart Placeholder */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
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

                  {/* Alerts */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-bold text-lg">Alertas Recentes</h4>
                      <button className="text-primary text-xs font-bold hover:underline">Ver Tudo</button>
                    </div>
                    <div className="space-y-4">
                      {alerts.length > 0 ? alerts.slice(0, 3).map((alert, idx) => (
                        <div key={`alert-dash-${alert.id ?? `idx-${idx}`}`} className={cn(
                          "flex gap-4 p-3 rounded-lg border",
                          alert.type === 'error' ? "bg-red-50 border-red-100" : 
                          alert.type === 'warning' ? "bg-yellow-50 border-yellow-100" : "bg-blue-50 border-blue-100"
                        )}>
                          <div className={cn(
                            "p-1.5 rounded-lg h-fit",
                            alert.type === 'error' ? "text-red-500 bg-red-100" : 
                            alert.type === 'warning' ? "text-yellow-500 bg-yellow-100" : "text-blue-500 bg-blue-100"
                          )}>
                            {alert.type === 'error' ? <AlertCircle size={18} /> : 
                             alert.type === 'warning' ? <AlertTriangle size={18} /> : <Info size={18} />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900">{alert.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{alert.description}</p>
                            <div className="flex gap-2 mt-2">
                              <button 
                                onClick={() => removeAlert(alert.id)}
                                className="text-[10px] font-bold px-2 py-1 rounded bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                              >
                                Resolver
                              </button>
                              <button 
                                onClick={() => removeAlert(alert.id)}
                                className="text-[10px] font-bold px-2 py-1 rounded bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                              >
                                Ignorar
                              </button>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                          Nenhum alerta pendente.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Double Shifts Table */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="font-bold text-lg">Resumo de Próximos Turnos Duplos</h4>
                      <p className="text-xs text-slate-500">Gestão de dobras e turnos estendidos</p>
                    </div>
                    <div className="flex gap-4 items-center">
                      <button 
                        onClick={() => setIsDoubleShiftModalOpen(true)}
                        className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                      >
                        <Plus size={14} /> Registrar Dobra
                      </button>
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span> Confirmado
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Pendente
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                          <th className="pb-3 pl-2">Funcionário</th>
                          <th className="pb-3">Departamento</th>
                          <th className="pb-3">Turno A (Horário)</th>
                          <th className="pb-3">Turno B (Horário)</th>
                          <th className="pb-3">Conformidade</th>
                          <th className="pb-3 text-right pr-2">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {doubleShifts.map((shift, idx) => (
                          <tr key={`double-shift-${shift.id ?? `idx-${idx}`}`} className="group hover:bg-slate-50 transition-colors">
                            <td className="py-4 pl-2">
                              <div className="flex items-center gap-3">
                                <Image src={getAvatarUrl(shift.avatar, shift.name)} width={32} height={32} className="rounded-full bg-slate-200 object-cover" alt={shift.name} referrerPolicy="no-referrer" />
                                <span className="text-sm font-semibold">{shift.name}</span>
                              </div>
                            </td>
                            <td className="py-4 text-sm text-slate-600">{shift.dept}</td>
                            <td className="py-4 text-sm">{shift.shiftA}</td>
                            <td className="py-4 text-sm">{shift.shiftB}</td>
                            <td className="py-4">
                              <span className={cn(
                                "px-2 py-1 text-[10px] font-bold rounded-full",
                                shift.status === 'Período de Descanso OK' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                              )}>
                                {shift.status}
                              </span>
                            </td>
                            <td className="py-4 text-right pr-2 relative">
                              <button 
                                onClick={() => setActiveActionMenu(activeActionMenu === shift.id ? null : shift.id)}
                                className="text-slate-400 hover:text-primary p-1 rounded-full hover:bg-slate-100 transition-colors"
                              >
                                <MoreVertical size={20} />
                              </button>
                              
                              <AnimatePresence>
                                {activeActionMenu === shift.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-30" 
                                      onClick={() => setActiveActionMenu(null)}
                                    />
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-40 py-2 text-left"
                                    >
                                      <button 
                                        onClick={() => {
                                          showToast(`Turno de ${shift.name} aprovado!`);
                                          setActiveActionMenu(null);
                                        }}
                                        className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                      >
                                        <Zap size={14} className="text-emerald-500" /> Aprovar Turno
                                      </button>
                                      <button 
                                        onClick={() => {
                                          showToast(`Solicitação de revisão enviada para ${shift.name}`);
                                          setActiveActionMenu(null);
                                        }}
                                        className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                      >
                                        <AlertTriangle size={14} className="text-yellow-500" /> Solicitar Revisão
                                      </button>
                                      <div className="h-px bg-slate-100 my-1" />
                                      <button 
                                        onClick={() => {
                                          setDoubleShifts(prev => prev.filter(s => s.id !== shift.id));
                                          showToast("Turno removido da lista.");
                                          setActiveActionMenu(null);
                                        }}
                                        className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                      >
                                        <Ban size={14} /> Remover da Lista
                                      </button>
                                    </motion.div>
                                  </>
                                )}
                              </AnimatePresence>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                <div className="flex items-center justify-between mb-6">
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
                    <div key={`role-${role.id}`} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between group">
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
                <div className="flex items-center justify-between mb-6">
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
                              user.role === 'admin' ? "bg-purple-100 text-purple-700" : 
                              user.role === 'manager' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                            )}>
                              {user.role || 'user'}
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
                  "p-6 border-b flex items-center justify-between shrink-0",
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
                                <div onClick={() => {
                                  setEditingShift({ empId: emp.id, dayIndex: startDay - 1 + i });
                                  setIsShiftModalOpen(true);
                                }}>
                                  <ShiftBadge {...shift} />
                                </div>
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
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded bg-blue-500"></div>
                      <span className="text-xs font-medium">Turno Manhã</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded bg-orange-500"></div>
                      <span className="text-xs font-medium">Turno Tarde</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded bg-amber-500"></div>
                      <span className="text-xs font-medium">Licença/Férias</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Zap size={14} />
                      <span>Hora Extra Aprovada</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} />
                      <span>Turno Duplo</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
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
                <div className="flex justify-between items-center mb-6">
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
                    <div key={`emp-card-${emp.id}`} className="p-4 border border-slate-100 rounded-xl flex items-center gap-4 hover:border-primary/30 transition-colors group relative">
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
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Gestão de Ausências</h3>
                  <button 
                    onClick={() => setIsAbsenceModalOpen(true)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                  >
                    <Plus size={16} /> Registrar Falta
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {alerts.filter(a => a.type === 'error').map((alert, idx) => (
                    <div key={`absence-alert-${alert.id ?? `idx-${idx}`}`} className={cn(
                      "p-4 rounded-xl border flex items-center justify-between",
                      darkMode ? "bg-slate-900 border-red-900/30" : "bg-white border-red-100"
                    )}>
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-red-50 rounded-lg text-red-500">
                          <UserMinus size={20} />
                        </div>
                        <div>
                          <p className="font-bold">{alert.title}</p>
                          <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-500")}>{alert.description}</p>
                        </div>
                      </div>
                      <button onClick={() => removeAlert(alert.id)} className="text-slate-400 hover:text-red-500">
                        <Ban size={18} />
                      </button>
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
            ) : view === 'overtime' ? (
              <motion.div
                key="overtime"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Horas Extras</h3>
                  <button 
                    onClick={() => setIsOvertimeModalOpen(true)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                  >
                    <Plus size={16} /> Solicitar Hora Extra
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {alerts.filter(a => a.type === 'warning').map((alert, idx) => (
                    <div key={`overtime-alert-${alert.id ?? `idx-${idx}`}`} className="bg-white p-4 rounded-xl border border-yellow-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-yellow-50 rounded-lg text-yellow-500">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="font-bold">{alert.title}</p>
                          <p className="text-sm text-slate-500">{alert.description}</p>
                        </div>
                      </div>
                      <button onClick={() => removeAlert(alert.id)} className="text-slate-400 hover:text-red-500">
                        <Ban size={18} />
                      </button>
                    </div>
                  ))}
                  {alerts.filter(a => a.type === 'warning').length === 0 && (
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
                <div className="flex justify-between items-center mb-6">
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
                    <div key={`sector-${sector.id}`} className="p-4 border border-slate-100 rounded-xl flex items-center justify-between hover:border-primary/30 transition-colors">
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
                  "rounded-xl border shadow-sm p-8 max-w-2xl mx-auto",
                  darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                )}
              >
                <div className="flex items-center gap-4 mb-8">
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
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-semibold">Notificações por E-mail</p>
                          <p className="text-sm text-slate-500">Receba alertas de ausências por e-mail</p>
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
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
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
                        Os relatórios consolidados (Faltas, Horas Extras e Dobras) são enviados automaticamente para <strong>{rhEmail}</strong> todo dia 20.
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
                                      <li><strong>Horas Extras/Dobras:</strong> ${alerts.filter(a => a.type === 'warning').length}</li>
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
                                    <p style="font-size: 12px; color: #666;">Este é um e-mail automático do sistema ShiftMaster.</p>
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
                        <Download size={18} /> Enviar Relatório Agora (E-mail)
                      </button>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Ações de Sistema</h4>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-sm text-slate-600 mb-4">
                        Popule o banco de dados com dados iniciais (Setores, Cargos e Colaboradores) para começar a usar o sistema rapidamente.
                      </p>
                      <button 
                        onClick={() => {
                          console.log("Seed button clicked, opening confirmation modal...");
                          setIsSeedConfirmOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-all"
                      >
                        <Database size={18} />
                        Popular Banco de Dados Inicial
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
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Escalas Especiais (Eventos)</h3>
                  <button 
                    onClick={() => setIsSpecialScheduleModalOpen(true)}
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
                          onClick={() => {
                            setEditingSpecialSchedule(schedule);
                            setSelectedEmployeesForSpecial(schedule.employees.map((e: any) => e.id));
                            setIsSpecialScheduleModalOpen(true);
                          }}
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
            ) : view === 'reports' ? (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Relatórios e Exportação</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
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
                  
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
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

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
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
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
            >
              <h3 className="text-xl font-bold mb-6">{editingEmployee ? 'Editar Colaborador' : 'Novo Colaborador'}</h3>
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addEmployee({
                  name: formData.get('name'),
                  roleId: formData.get('roleId') as string,
                  sectorId: formData.get('sectorId') as string || null,
                  avatar: editingEmployee?.avatar || `https://picsum.photos/seed/${formData.get('name')}/100/100`
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
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
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
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
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
                  <select name="role" defaultValue={editingUser?.role || 'user'} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                    <option value="user">Usuário (Visualização)</option>
                    <option value="manager">Gerente (Edição de Escalas)</option>
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
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
            >
              <h3 className="text-xl font-bold mb-6">Editar Turno</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'Manhã', label: 'Manhã', time: '07:00' },
                  { type: 'Tarde', label: 'Tarde', time: '15:00' },
                  { type: 'vacation', label: 'Férias', time: '-' },
                  { type: 'off', label: 'Folga', time: '-' },
                ].map(s => (
                  <button
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
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
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
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 max-h-[90vh] overflow-y-auto"
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
        {isAbsenceModalOpen && (
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
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
            >
              <h3 className="text-xl font-bold mb-6">Registrar Falta</h3>
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                registerAbsence(
                  formData.get('employeeId') as string,
                  formData.get('reason') as string
                );
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Colaborador</label>
                  <select name="employeeId" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                    <option value="">Selecione um colaborador</option>
                    {employees.map(emp => (
                      <option key={`opt-absence-emp-${emp.id}`} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo (Opcional)</label>
                  <textarea name="reason" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none h-24" placeholder="Ex: Problemas de saúde, emergência familiar..." />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsAbsenceModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold">Registrar Falta</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {isDoubleShiftModalOpen && (
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
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
            >
              <h3 className="text-xl font-bold mb-6">Registrar Dobra</h3>
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
                  <input name="date" type="date" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Colaborador</label>
                  <select name="employeeId" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                    <option value="">Selecione um colaborador</option>
                    {employees.map(emp => (
                      <option key={`opt-double-emp-${emp.id}`} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Setor</label>
                  <select name="sectorId" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                    <option value="">Selecione um setor</option>
                    {sectors.map(sector => (
                      <option key={`opt-double-sector-${sector.id}`} value={sector.id}>{sector.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsDoubleShiftModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold">Registrar Dobra</button>
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
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
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
                  <button type="submit" className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg font-bold">Solicitar Hora Extra</button>
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
              "fixed bottom-8 right-8 z-[200] px-6 py-3 rounded-xl shadow-2xl font-bold text-white flex items-center gap-3",
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
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center"
            >
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Database size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Popular Banco de Dados?</h3>
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
