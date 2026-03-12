-- SQL para criar as tabelas no Supabase (PostgreSQL)

-- 1. Setores
CREATE TABLE sectors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- 2. Cargos
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- 3. Colaboradores
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  role_id INTEGER REFERENCES roles(id),
  avatar TEXT,
  sector_id INTEGER REFERENCES sectors(id)
);

-- 4. Usuários (Sistema)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  is_master BOOLEAN DEFAULT FALSE
);

-- 5. Turnos (Escala)
CREATE TABLE shifts (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'Manhã', 'Tarde', 'vacation', 'off'
  time TEXT,
  overtime BOOLEAN DEFAULT FALSE,
  is_double BOOLEAN DEFAULT FALSE,
  shift_b_time TEXT
);

-- 6. Alertas/Notificações
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL, -- 'error', 'warning', 'info'
  title TEXT NOT NULL,
  description TEXT,
  sector_id INTEGER REFERENCES sectors(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Escalas Especiais (Eventos)
CREATE TABLE special_schedules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  date TEXT NOT NULL,
  status TEXT NOT NULL
);

-- 8. Atribuições de Escalas Especiais
CREATE TABLE special_schedule_assignments (
  id SERIAL PRIMARY KEY,
  special_schedule_id INTEGER NOT NULL REFERENCES special_schedules(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE
);

-- Inserir dados iniciais (opcional)
INSERT INTO roles (name) VALUES ('Gerente'), ('Vendedor'), ('Operador'), ('Estoquista');
INSERT INTO sectors (name) VALUES ('Vendas'), ('Logística'), ('Administrativo');
INSERT INTO users (name, password, is_master) VALUES ('admin@shiftmaster.com', 'admin', true);
INSERT INTO users (name, password, is_master) VALUES ('Marcelo Pereira Bittencourt de Souza', 'admin', true);
