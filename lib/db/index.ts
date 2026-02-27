import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import Database from 'better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite, { schema });

let isInitialized = false;

// Simple migration/init helper
export function initDb() {
  if (isInitialized) return;
  
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role_id INTEGER REFERENCES roles(id),
      avatar TEXT,
      sector_id INTEGER REFERENCES sectors(id)
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      is_master INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      day INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      type TEXT NOT NULL,
      time TEXT,
      overtime INTEGER DEFAULT 0,
      is_double INTEGER DEFAULT 0,
      shift_b_time TEXT
    );
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      sector_id INTEGER REFERENCES sectors(id)
    );
    CREATE TABLE IF NOT EXISTS special_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL
    );
  `);

  // Migration: Add role_id to employees if it doesn't exist
  try {
    sqlite.exec(`ALTER TABLE employees ADD COLUMN role_id INTEGER REFERENCES roles(id)`);
  } catch (e) {
    // Column might already exist
  }

  try {
    sqlite.exec(`ALTER TABLE shifts ADD COLUMN is_double INTEGER DEFAULT 0`);
  } catch (e) {}
  try {
    sqlite.exec(`ALTER TABLE shifts ADD COLUMN shift_b_time TEXT`);
  } catch (e) {}

  // Seed initial data if empty
    const employeeCount = db.select().from(schema.employees).all().length;
    
    // Seed roles first
    const roleCount = db.select().from(schema.roles).all().length;
    if (roleCount === 0) {
      const initialRoles = ["Supervisor", "Técnico", "Operador", "Junior Staff"];
      for (const name of initialRoles) {
        db.insert(schema.roles).values({ name }).run();
      }
    }

    const allRoles = db.select().from(schema.roles).all();

    // Seed master user
    const masterUser = db.select().from(schema.users).where(eq(schema.users.name, "Marcelo Pereira Bittencourt de Souza")).get();
    if (!masterUser) {
      db.insert(schema.users).values({
        name: "Marcelo Pereira Bittencourt de Souza",
        password: "admin", // Default password
        isMaster: true
      }).run();
    }
    
    if (employeeCount === 0) {
      const initialEmployees = [
        "Abraão Resende Ivo", "Ademilson da Cruz Santana", "Adrielly Xavier da Silva", "Alane da Silva Duarte",
        "Aldenir Severino da Silva", "Aleksandra de Mesquita", "Aleksandro Suarez", "Alex Alexandre de Aguiar",
        "Alex Braga Nunes", "Alex Silva de Souza", "Alexia dos Santos Sambonha", "Amanda Andrade da Silva",
        "Amilton de Jesus Ferreira dos Santos", "Ana Carolina Mendonça Romeu", "Ana Roberta Gomes de Brito",
        "Anderson da Silva Ferreira", "Andréa da Conceição Rosa", "Anna Paula Fabíola Gomes", "Antonia Laiane Farias Veras",
        "Antonia Carlos Torres", "Antonio Cleitos Lopes Leitão", "Antonio dos Reis de Sena Rosa", "Antonio Feliciano da Silva",
        "Antonio Itamar Silva Camelo", "Antonio José de Freitas Neto", "Antonio Marcio Victor Otaviano", "Antonio Raquel da Silva",
        "Brenda Alves do Carmo", "Bruna Roberta de Andrade", "Bruno Mendonça Ezidio", "Caiane Mendonça Serra",
        "Camille de Campos Alves", "Carlos Alberto Silva Bezerra", "Carlos Henrique Viana Felício", "Celso Santos de Souza",
        "Cíntia Teixeira Coelho", "Cleiton Araújo dos Anjos Marques", "Clenilson Oliveira Santos", "Cosme Viana Felício",
        "Daniel dos Santos Galdino", "Daniela Silva do Nascimento", "Dayane Coelho Moreira", "Deuselina Gomes da Silva",
        "Diogo Roberto de Sousa Gonçalves", "Eduardo de Oliveira", "Elivaldo dos Santos Costa", "Elizeu Feliciano dos Santos",
        "Elizangela Alves Cardoso", "Elizângela da Silva Santana", "Eluan Souza da Silva", "Emerson Ferreira da Silva",
        "Enestina Pereira do Carmo Araújo", "Eriberto Ferreira da Silva", "Eronilson Pinheiro", "Evillyn Ingrid da Silva",
        "Fabio Soares Berião", "Fagner Alves Lima", "Francinaldo Guedes da Silva", "Francisca Evanilde de Lima Souza",
        "Francisco de Azevedo Gomes", "Francisco Edson Pereira Moura", "Francisco Leonardo Braga Lima", "Francisco Marquilane dos Santos",
        "Gabriel Pereira da Silva", "Gabriel Vidal Teles de Carvalho", "Gilson Randolfo da Costa", "Giovanni José F Gomes",
        "Giselle Favianna Splendiani Yanez", "Gizele Marinho Nunes", "Graciele Marques de Souza Mesquita", "Guilherme Vitelly Marinho da Rocha",
        "Gustavo Batista da Costa", "Gutemberg Martins de Farias", "Helber Pinheiro dos Santos", "Henrique Ernesto da Silva",
        "Iago Miguel Rodrigues da Silva", "Igor Bezerra Ferreira", "Inácia Ribeiro da Silva", "Inan Rosa Rodrigues",
        "Isabella Cristine Chavantos Rafael", "Isis Mayara Candido Albuquerque", "Israel da Conceição Gama", "Ivaldo Ferreira Sousa",
        "Jaqueline Santos da Silva", "Jeferson Alves Daniel", "Joalane Rocha de O Santos", "Joana Maria Ferreira Sousa",
        "João Antonio Marques de Araujo", "João Batista Ferreira da Silva", "João Douglas Pereira de Vasconcelos",
        "João Paulo Raquel da Silva", "João Vitor Rodrigues da Silva", "John Lenon Souza Araújo", "Jonatham Batista Tavares",
        "Jorge Luiz Carvalho Silva", "José Ailton Gonçalves Araújo", "José Carlos Higino de Oliveira", "José Francisco de Souza",
        "José Pedro da Silva Pereira", "José Roberto de Sousa Matias", "Josivan da Silva", "Joselito Ferreira de França",
        "Josué de Jesus França da Silva", "Julia Conceição Corrêa", "Juliana Alves Ferreira", "Kayane Juvino do Nascimento",
        "Layla Araújo Pereira", "Leandro Rodrigues da Silva", "Lediana Maria da Silva", "Leonardo de Sousa Mota",
        "Leonardo Silva dos Santos", "Leticia Campos de Araujo da Silva", "Lorrana Cristina de Souza Bento", "Luiz Henrique Frazão de Azevedo",
        "Luana dos Santos Peçanha", "Luísa Eliete de Abreu", "Luiz Carlos da Silva", "Maico de Mesquita Torres",
        "Maise Estefani Soares Pinheiro", "Manoella Ernesto Silva", "Marcela Zampari", "Marcele Benedito de Abreu",
        "Marcelo Pereira Bittencourt de Souza", "Marcelo Sousa da Silva", "Marco Antonio da Conceição Pereira", "Marcos Barbosa Cavalcante",
        "Maria Elizangela Ferreira Miranda", "Maria Luiza Paulo Silva", "Maria Luzia dos Santos", "Maria Salete da Silva Pereira",
        "Maria Tainá Araújo Veras", "Maria Weslaine da Silva", "Mariana da Silva Mendes", "Marys Stella Correa Alves",
        "Matheus Araújo dos Anjos", "Mauro da Silva Ezidio", "Michael Douglas Madeira de Sousa", "Nadia Silene Correia Alves",
        "Natalia Gomes Soares", "Pablo Souza Melo", "Pamela Rosa dos Santos", "Paulo Edgley Serafim", "Paulo Sergio da Cunha",
        "Pedro Ryan Silva Martins", "Priscilla Dayana Pereira Moraes", "Rafael Silva Lima", "Raionara Pequeno", "Raniery Alisson dos Santos",
        "Raquel de Cassia Kmpp", "Rhayellen de Sousa Chaves", "Roberto Barbosa de Oliveira", "Robson Barros de Oliveira Júnior",
        "Ruan Kmpp Velasco da Silva", "Sarah Batista Bittencourt", "Sergio Paulino da Silva", "Silvana dos Reis Gomes",
        "Stephanie Luiza Torres", "Sueli Rodrigues dos Santos", "Suellen Alves do Nascimento", "Taele Santos Cunha",
        "Tamara de Souza Prazeres", "Tamires Mendes Fernandes", "Thamyres da Silva Sousa", "Victor Domingues Tavares",
        "Virna Maria Bezerra Nascimento", "William Araújo de Andrade", "Yasmim Oliveira", "Zenilton da Silva Basílio", "Zulene Rodrigues de Sousa"
      ];

      for (let i = 0; i < initialEmployees.length; i++) {
        db.insert(schema.employees).values({
          name: initialEmployees[i],
          roleId: allRoles[i % allRoles.length].id,
          avatar: `https://picsum.photos/seed/${initialEmployees[i]}/100/100`,
          sectorId: null
        }).run();
      }
    }

    const sectorCount = db.select().from(schema.sectors).all().length;
    if (sectorCount === 0) {
      const initialSectors = ['RH', 'Vendas', 'Tec', 'Suporte', 'Ops', 'Admin'];
      for (const name of initialSectors) {
        db.insert(schema.sectors).values({ name }).run();
      }
    }

    const alertCount = db.select().from(schema.alerts).all().length;
    if (alertCount === 0) {
      const initialAlerts = [
        { type: 'error', title: 'Ausência não Justificada', description: 'Marcus Webb - Depto Tec' },
        { type: 'warning', title: 'Hora Extra não Autorizada', description: 'Sarah Jenkins +2.5h' },
        { type: 'info', title: 'Nova Solicitação de Folga', description: 'Leo G. solicitou 3 dias' },
      ];
      for (const alert of initialAlerts) {
        db.insert(schema.alerts).values(alert).run();
      }
    }

    const specialCount = db.select().from(schema.specialSchedules).all().length;
    if (specialCount === 0) {
      const initialSpecials = [
        { name: 'Inventário Geral', date: '2026-03-15', status: 'Confirmado' },
        { name: 'Treinamento CIPA', date: '2026-03-20', status: 'Pendente' },
      ];
      for (const item of initialSpecials) {
        db.insert(schema.specialSchedules).values(item).run();
      }
    }

    // Seed some initial shifts for the current month if empty
    const shiftCount = db.select().from(schema.shifts).all().length;
    if (shiftCount === 0) {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const allEmployees = db.select().from(schema.employees).all();
      
      // Seed first 10 employees with some shifts
      for (let i = 0; i < Math.min(allEmployees.length, 10); i++) {
        const emp = allEmployees[i];
        for (let day = 1; day <= 5; day++) {
          db.insert(schema.shifts).values({
            employeeId: emp.id,
            day,
            month,
            year,
            type: day % 2 === 0 ? 'Manhã' : 'Tarde',
            time: day % 2 === 0 ? '08:00 - 16:00' : '14:00 - 22:00',
            overtime: false
          }).run();
        }
      }
    }
    isInitialized = true;
}
