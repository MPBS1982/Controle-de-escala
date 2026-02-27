import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const sectors = sqliteTable('sectors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const roles = sqliteTable('roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const employees = sqliteTable('employees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  roleId: integer('role_id').references(() => roles.id),
  avatar: text('avatar'),
  sectorId: integer('sector_id').references(() => sectors.id),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  password: text('password').notNull(),
  isMaster: integer('is_master', { mode: 'boolean' }).default(false),
});

export const shifts = sqliteTable('shifts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id),
  day: integer('day').notNull(), // 1-31
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  type: text('type').notNull(), // 'Manhã', 'Tarde', 'vacation', 'off'
  time: text('time'),
  overtime: integer('overtime', { mode: 'boolean' }).default(false),
  isDouble: integer('is_double', { mode: 'boolean' }).default(false),
  shiftBTime: text('shift_b_time'),
});

export const alerts = sqliteTable('alerts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // 'error', 'warning', 'info'
  title: text('title').notNull(),
  description: text('description'),
  sectorId: integer('sector_id').references(() => sectors.id),
});

export const specialSchedules = sqliteTable('special_schedules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  date: text('date').notNull(),
  status: text('status').notNull(),
});
