import baseColaboradoresData from '@/data/base-colaboradores.json';

export type BaseColaboradorRow = {
  name: string;
  sector: string;
  shift: string;
  role: string;
  normalizedRole: string;
};

type SectorMeta = {
  color: string;
  icon: string;
};

const DATA = baseColaboradoresData as {
  sourceFile: string;
  importedAt: string;
  employees: BaseColaboradorRow[];
};

const SECTOR_META: Record<string, SectorMeta> = {
  'ATENDIMENTO CAIXAS': { color: '#14b8a6', icon: 'Users' },
  'ATENDIMENTO LOJA': { color: '#6366f1', icon: 'Users' },
  'ATENDIMENTO MESAS': { color: '#3b82f6', icon: 'Users' },
  'AÇOUGUE': { color: '#b91c1c', icon: 'Layers' },
  'BALCÃO FRIOS': { color: '#ef4444', icon: 'Layers' },
  'BALCÃO PÃES E PASTAS': { color: '#8b5cf6', icon: 'Layers' },
  'BALCÃO SANDUÍCHE': { color: '#ec4899', icon: 'Layers' },
  'CONFEITARIA': { color: '#f43f5e', icon: 'Layers' },
  'COZINHA': { color: '#059669', icon: 'Layers' },
  'COZINHA DELI': { color: '#10b981', icon: 'Layers' },
  'EMPADA': { color: '#f59e0b', icon: 'Layers' },
  'ENTREGADOR MOTO': { color: '#7c3aed', icon: 'Briefcase' },
  'ESCRITÓRIO': { color: '#475569', icon: 'Briefcase' },
  'ESTOQUE': { color: '#64748b', icon: 'Database' },
  'EXPEDIÇÃO': { color: '#84cc16', icon: 'Database' },
  'MANUTENÇÃO': { color: '#0ea5e9', icon: 'Settings' },
  'MASSAS': { color: '#d97706', icon: 'Layers' },
  'PADARIA': { color: '#f97316', icon: 'Layers' },
  'PADARIA EMBALAGEM': { color: '#d946ef', icon: 'Layers' },
  'SERVIÇOS GERAIS': { color: '#94a3b8', icon: 'Briefcase' },
  'SUCOS': { color: '#fbbf24', icon: 'Layers' },
};

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const uniqueByOrder = <T,>(items: T[], key: (item: T) => string) => {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const value = key(item);
    if (!seen.has(value)) {
      seen.add(value);
      result.push(item);
    }
  }
  return result;
};

export const baseColaboradores = DATA;

export const seedSectors = uniqueByOrder(
  DATA.employees.map((employee) => employee.sector),
  (sector) => sector
).map((sector) => {
  const meta = SECTOR_META[sector] ?? { color: '#64748b', icon: 'Layers' };
  return {
    id: slugify(sector),
    name: sector,
    color: meta.color,
    icon: meta.icon,
  };
});

export const seedRoles = uniqueByOrder(
  DATA.employees.map((employee) => employee.normalizedRole || employee.role),
  (role) => role
).map((role) => ({
  id: slugify(role),
  name: role,
}));

export const seedEmployees = DATA.employees.map((employee) => ({
  id: slugify(employee.name),
  name: employee.name,
  sectorId: slugify(employee.sector),
  roleId: slugify(employee.normalizedRole || employee.role),
}));

export const seedConfig = {
  rh_email: 'sistemas@talhodelicatessen.com.br',
  email_notifications: 'true',
  dark_mode: 'false',
} as const;
