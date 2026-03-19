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
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
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

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
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

  const [plannerSectorFilter, setPlannerSectorFilter] = useState<string>('all');

  const filteredAndSortedEmployees = useMemo(() => {
    let result = employees.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (plannerSectorFilter !== 'all') {
      result = result.filter(e => e.sector_id === parseInt(plannerSectorFilter));
    }

    if (sortAlphabetical) {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [employees, searchQuery, sortAlphabetical, plannerSectorFilter]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        localStorage.setItem('shiftmaster_user', JSON.stringify(user));
        showToast(`Bem-vindo, ${user.name}!`);
      } else {
        showToast("Credenciais inválidas", "error");
      }
    } catch (error) {
      showToast("Erro ao fazer login", "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('shiftmaster_user');
    showToast("Sessão encerrada");
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('shiftmaster_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
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

  // Fetch data on mount and when currentDate changes
  useEffect(() => {
    if (!currentUser) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch email status and config separately with their own error handling
        try {
          const statusRes = await fetch('/api/email-status');
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setIsEmailActive(statusData.active);
          }
        } catch (e) {
          console.error("Error fetching email status:", e);
        }

        try {
          const configRes = await fetch('/api/config');
          if (configRes.ok) {
            const configData = await configRes.json();
            if (configData.rh_email) setRhEmail(configData.rh_email);
            if (configData.dark_mode) setDarkMode(configData.dark_mode === 'true');
            if (configData.email_notifications) setEmailNotifications(configData.email_notifications === 'true');
          }
        } catch (e) {
          console.error("Error fetching config:", e);
        }

        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        
        const endpoints = [
          { name: 'employees', url: `/api/employees?month=${month}&year=${year}` },
          { name: 'sectors', url: '/api/sectors' },
          { name: 'special-schedules', url: '/api/special-schedules' },
          { name: 'alerts', url: '/api/alerts' },
          { name: 'roles', url: '/api/roles' },
          { name: 'users', url: '/api/users' }
        ];

        const results = await Promise.all(
          endpoints.map(async (ep) => {
            try {
              const res = await fetch(ep.url);
              if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const msg = errorData.error || res.statusText;
                console.error(`Error fetching ${ep.name}: ${res.status} ${msg}`);
                return null;
              }
              const contentType = res.headers.get("content-type");
              if (contentType && contentType.indexOf("application/json") !== -1) {
                return await res.json();
              } else {
                console.error(`Error fetching ${ep.name}: Response not JSON`);
                return null;
              }
            } catch (e) {
              console.error(`Network error fetching ${ep.name}:`, e);
              return null;
            }
          })
        );

        const [empData, secData, specData, alertData, roleData, userData] = results;

        if (empData) setEmployees(empData);
        if (secData) setSectors(secData);
        if (roleData) setRoles(roleData);
        if (userData) setAppUsers(userData);
        if (specData) setSpecialSchedules(specData);
        if (alertData) setAlerts(alertData);
      } catch (error) {
        console.error("Unexpected error in fetchData:", error);
        showToast("Erro ao carregar dados. Verifique sua conexão.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentDate, currentUser]);

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
  const setupSupabase = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/setup-supabase');
      const data = await res.json();
      if (data.success) {
        showToast("Supabase inicializado com sucesso!");
        window.location.reload();
      } else {
        showToast(`Erro: ${data.error}`, "error");
      }
    } catch (e) {
      showToast("Erro ao conectar com Supabase", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [editingSector, setEditingSector] = useState<any>(null);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingSpecialSchedule, setEditingSpecialSchedule] = useState<any>(null);

  // CRUD Functions
  const addEmployee = async (employeeData: any) => {
    try {
      if (!employeeData.roleId || isNaN(employeeData.roleId)) {
        showToast("Por favor, selecione um cargo válido.", "error");
        return;
      }
      console.log("Saving employee:", employeeData);
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEmployee ? { ...employeeData, id: editingEmployee.id } : employeeData)
      });
      if (!res.ok) throw new Error("Failed to save employee");
      const saved = await res.json();
      const roleName = roles.find(r => r.id === saved.role_id)?.name;
      const updatedEmp = { 
        ...saved, 
        role: roleName, 
        roleId: saved.role_id, 
        sectorId: saved.sector_id 
      };

      if (editingEmployee) {
        setEmployees(employees.map(e => e.id === saved.id ? { ...e, ...updatedEmp } : e));
        showToast("Colaborador atualizado!");
      } else {
        setEmployees([...employees, { ...updatedEmp, shifts: Array(31).fill({ type: 'empty' }) }]);
        showToast("Colaborador adicionado!");
      }
      setIsEmployeeModalOpen(false);
      setEditingEmployee(null);
    } catch (e) { 
      console.error(e);
      showToast("Erro ao salvar colaborador. Verifique os dados.", "error");
    }
  };

  const addRole = async (roleData: any) => {
    try {
      console.log("Saving role:", roleData);
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRole ? { ...roleData, id: editingRole.id } : roleData)
      });
      if (!res.ok) throw new Error("Failed to save role");
      const saved = await res.json();
      if (editingRole) {
        setRoles(roles.map(r => r.id === saved.id ? saved : r));
        showToast("Cargo atualizado!");
      } else {
        setRoles([...roles, saved]);
        showToast("Cargo adicionado!");
      }
      setIsRoleModalOpen(false);
      setEditingRole(null);
    } catch (e) {
      console.error(e);
      showToast("Erro ao salvar cargo", "error");
    }
  };

  const deleteRole = async (id: number) => {
    try {
      await fetch(`/api/roles?id=${id}`, { method: 'DELETE' });
      setRoles(roles.filter(r => r.id !== id));
      showToast("Cargo removido");
    } catch (e) {
      showToast("Erro ao remover cargo", "error");
    }
  };

  const addUser = async (userData: any) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser ? { ...userData, id: editingUser.id } : userData)
      });
      const saved = await res.json();
      if (editingUser) {
        setAppUsers(appUsers.map(u => u.id === saved.id ? saved : u));
        showToast("Usuário atualizado!");
      } else {
        setAppUsers([...appUsers, saved]);
        showToast("Usuário adicionado!");
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
    } catch (e) {
      showToast("Erro ao salvar usuário", "error");
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      setAppUsers(appUsers.filter(u => u.id !== id));
      showToast("Usuário removido");
    } catch (e) {
      showToast("Erro ao remover usuário", "error");
    }
  };

  const deleteEmployee = async (id: number) => {
    try {
      await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
      setEmployees(employees.filter(e => e.id !== id));
      showToast("Colaborador removido.");
    } catch (e) { 
      console.error(e);
      showToast("Erro ao remover colaborador", "error");
    }
  };

  const addSector = async (name: string) => {
    try {
      if (editingSector) {
        const res = await fetch('/api/sectors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingSector.id, name })
        });
        const saved = await res.json();
        setSectors(sectors.map(s => s.id === saved.id ? saved : s));
        setEditingSector(null);
        showToast("Setor atualizado.");
      } else {
        const res = await fetch('/api/sectors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        const saved = await res.json();
        setSectors([...sectors, saved]);
        showToast("Setor criado.");
      }
      setIsSectorModalOpen(false);
    } catch (e) { 
      console.error(e);
      showToast("Erro ao processar setor", "error");
    }
  };

  const deleteSector = async (id: number) => {
    try {
      await fetch(`/api/sectors?id=${id}`, { method: 'DELETE' });
      setSectors(sectors.filter(s => s.id !== id));
      showToast("Setor removido.");
    } catch (e) { 
      console.error(e);
      showToast("Erro ao remover setor", "error");
    }
  };

  const addSpecialSchedule = async (schedule: any) => {
    try {
      const payload = { ...schedule, employeeIds: selectedEmployeesForSpecial };
      if (editingSpecialSchedule) {
        const res = await fetch('/api/special-schedules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingSpecialSchedule.id })
        });
        const updated = await res.json();
        setSpecialSchedules(specialSchedules.map(s => s.id === updated.id ? { ...updated, employees: employees.filter(e => selectedEmployeesForSpecial.includes(e.id)) } : s));
        setEditingSpecialSchedule(null);
        showToast("Escala especial atualizada.");
      } else {
        const res = await fetch('/api/special-schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const saved = await res.json();
        setSpecialSchedules([...specialSchedules, { ...saved, employees: employees.filter(e => selectedEmployeesForSpecial.includes(e.id)) }]);
        showToast("Escala especial criada.");
      }
      setIsSpecialScheduleModalOpen(false);
      setSelectedEmployeesForSpecial([]);
    } catch (e) { 
      console.error(e);
      showToast("Erro ao salvar escala", "error");
    }
  };

  const saveConfig = async (key: string, value: string, silent = false) => {
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (key === 'rh_email') setRhEmail(value);
      if (!silent) showToast("Configuração salva!");
    } catch (e) {
      if (!silent) showToast("Erro ao salvar configuração", "error");
      throw e;
    }
  };

  const deleteSpecialSchedule = async (id: number) => {
    try {
      await fetch(`/api/special-schedules?id=${id}`, { method: 'DELETE' });
      setSpecialSchedules(specialSchedules.filter(s => s.id !== id));
      showToast("Escala especial removida.");
    } catch (e) { 
      console.error(e);
      showToast("Erro ao remover escala", "error");
    }
  };

  const updateShift = async (empId: number, dayIndex: number, newShift: any) => {
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          day: dayIndex + 1,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          type: newShift.type,
          time: newShift.time,
          overtime: newShift.overtime || false
        })
      });
      
      setEmployees(employees.map(emp => {
        if (emp.id === empId) {
          const newShifts = [...emp.shifts];
          newShifts[dayIndex] = newShift;
          return { ...emp, shifts: newShifts };
        }
        return emp;
      }));
      setIsShiftModalOpen(false);
      showToast("Turno atualizado.");
    } catch (e) { 
      console.error(e);
      showToast("Erro ao atualizar turno", "error");
    }
  };

  const removeAlert = async (id: number) => {
    try {
      await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
      setAlerts(alerts.filter(a => a.id !== id));
      showToast("Alerta removido.");
    } catch (e) { 
      console.error(e);
      showToast("Erro ao remover alerta", "error");
    }
  };

  const registerAbsence = async (employeeId: number, reason: string) => {
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

      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'error',
          title: `Falta: ${employee.name}`,
          description: `Colaborador: ${employee.name} | Motivo: ${reason || 'Não informado'} | Notificação enviada para ${rhEmail}`
        })
      });
      const saved = await res.json();
      setAlerts([saved, ...alerts]);
      showToast("Ausência registrada e RH notificado por e-mail!");
      setIsAbsenceModalOpen(false);
    } catch (e) { console.error(e); }
  };
  
  const registerDoubleShift = async (employeeId: number, date: string, sectorId: number) => {
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

      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'warning',
          title: `Dobra: ${employee.name}`,
          description: `Colaborador: ${employee.name} | Data: ${date} | Setor: ${sector.name} | Notificação enviada para ${rhEmail}`,
          sectorId: sector.id
        })
      });
      const saved = await res.json();
      setAlerts([saved, ...alerts]);
      showToast("Dobra registrada e RH notificado por e-mail!");
      setIsDoubleShiftModalOpen(false);
    } catch (e) { console.error(e); }
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

  const requestOvertime = async (employeeId: number, date: string, sectorId: number) => {
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

      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'warning',
          title: `Solicitação de Hora Extra: ${employee.name}`,
          description: `Colaborador: ${employee.name} | Data: ${date} | Setor: ${sector.name} | Notificação enviada para ${rhEmail}`,
          sectorId: sector.id
        })
      });
      const saved = await res.json();
      setAlerts([saved, ...alerts]);
      showToast("Solicitação enviada ao RH por e-mail!");
      setIsOvertimeModalOpen(false);
    } catch (e) { console.error(e); }
  };

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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Usuário</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                  placeholder="Seu nome de usuário"
                  value={loginData.name}
                  onChange={(e) => setLoginData({ ...loginData, name: e.target.value })}
                />
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Senha</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                />
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? <Zap className="animate-spin" size={18} /> : "Entrar no Sistema"}
            </button>
          </form>
          
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
                        <div key={`alert-dash-${alert.id || idx}`} className={cn(
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
                          <tr key={`double-shift-${shift.id || idx}`} className="group hover:bg-slate-50 transition-colors">
                            <td className="py-4 pl-2">
                              <div className="flex items-center gap-3">
                                <Image src={shift.avatar} width={32} height={32} className="rounded-full bg-slate-200 object-cover" alt={shift.name} referrerPolicy="no-referrer" />
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
                          <td className="py-4 pl-2 font-medium">{user.name}</td>
                          <td className="py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[10px] font-bold",
                              user.isMaster ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                            )}>
                              {user.isMaster ? "MASTER" : "ADMINISTRADOR"}
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
                              {user.name !== currentUser.name && (
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
                        <tr key={`planner-emp-${emp.id || idx}`} className="group hover:bg-slate-50/50">
                          <td className="p-4 border-b border-r border-slate-200 sticky left-0 bg-white z-10">
                            <div className="flex items-center gap-3">
                              <Image src={emp.avatar} width={32} height={32} className="rounded-full bg-slate-200 object-cover" alt={emp.name} referrerPolicy="no-referrer" />
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
                              <td key={`shift-${emp.id}-${i}`} className="p-1 border-b border-slate-200">
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
                      <Image src={emp.avatar} width={48} height={48} className="rounded-full object-cover" alt={emp.name} referrerPolicy="no-referrer" />
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
                    <div key={`absence-alert-${alert.id || idx}`} className={cn(
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
                    <div key={`overtime-alert-${alert.id || idx}`} className="bg-white p-4 rounded-xl border border-yellow-100 flex items-center justify-between">
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

                  {currentUser?.isMaster && (
                    <section>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Banco de Dados</h4>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                          <p className="text-sm text-slate-600 mb-4">
                            <strong>Importante:</strong> Antes de clicar no botão abaixo, você deve copiar o conteúdo do arquivo <code>supabase_schema.sql</code> e executá-lo no <strong>SQL Editor</strong> do seu painel Supabase para criar as tabelas.
                          </p>
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={setupSupabase}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors"
                            >
                              <Database size={18} /> 1. Inicializar Dados no Supabase
                            </button>
                            <p className="text-[10px] text-slate-400 text-center uppercase font-bold">
                              Isso carregará os 162 colaboradores, setores e cargos.
                            </p>
                          </div>
                        </div>
                    </section>
                  )}

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
                                src={emp.avatar || `https://picsum.photos/seed/${emp.id}/100/100`} 
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
                  roleId: parseInt(formData.get('roleId') as string),
                  sectorId: formData.get('sectorId') ? parseInt(formData.get('sectorId') as string) : null,
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
                  password: formData.get('password'),
                  isMaster: formData.get('isMaster') === 'on'
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome de Usuário</label>
                  <input name="name" defaultValue={editingUser?.name || ''} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
                  <input name="password" type="password" required={!editingUser} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder={editingUser ? "Deixe em branco para manter" : ""} />
                </div>
                <div className="flex items-center gap-2">
                  <input name="isMaster" type="checkbox" defaultChecked={editingUser?.isMaster} className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary" id="isMaster" />
                  <label htmlFor="isMaster" className="text-sm font-medium text-slate-700">Acesso Master (Pode criar usuários)</label>
                </div>
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
                          <Image src={emp.avatar} width={24} height={24} className="rounded-full" alt="" referrerPolicy="no-referrer" />
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
                  parseInt(formData.get('employeeId') as string),
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
                  parseInt(formData.get('employeeId') as string),
                  formData.get('date') as string,
                  parseInt(formData.get('sectorId') as string)
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
                  parseInt(formData.get('employeeId') as string),
                  formData.get('date') as string,
                  parseInt(formData.get('sectorId') as string)
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
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={cn(
                "fixed bottom-8 right-8 z-[200] px-6 py-3 rounded-xl shadow-2xl font-bold text-white flex items-center gap-3",
                toast.type === 'success' ? "bg-emerald-600" : "bg-red-600"
              )}
            >
              {toast.type === 'success' ? <Zap size={18} /> : <AlertCircle size={18} />}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  );
}
