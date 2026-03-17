import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 0. Check if tables exist
    const { error: checkError } = await supabase.from('roles').select('id').limit(1);
    if (checkError && (checkError.code === '42P01' || checkError.message?.includes('does not exist'))) {
      return NextResponse.json({ 
        success: false, 
        error: "As tabelas ainda não foram criadas no Supabase. Por favor, execute o script 'supabase_schema.sql' no SQL Editor do seu painel Supabase antes de inicializar os dados.",
        code: 'TABLES_MISSING'
      }, { status: 400 });
    }

    // 1. Seed Roles
    console.log("Seeding roles...");
    const initialRoles = ["Supervisor", "Técnico", "Operador", "Junior Staff"];
    for (const name of initialRoles) {
      const { error } = await supabase.from('roles').upsert({ name }, { onConflict: 'name' });
      if (error) throw new Error(`Error seeding roles: ${error.message}`);
    }

    // 2. Seed Sectors
    console.log("Seeding sectors...");
    const initialSectors = ['RH', 'Vendas', 'Tec', 'Suporte', 'Ops', 'Admin'];
    for (const name of initialSectors) {
      const { error } = await supabase.from('sectors').upsert({ name }, { onConflict: 'name' });
      if (error) throw new Error(`Error seeding sectors: ${error.message}`);
    }

    // 3. Seed Master User
    console.log("Seeding master user...");
    const { error: userError } = await supabase.from('users').upsert({
      name: "Marcelo Pereira Bittencourt de Souza",
      password: "admin",
      is_master: true
    }, { onConflict: 'name' });
    if (userError) throw new Error(`Error seeding master user: ${userError.message}`);
    
    // 3.1 Seed RH Email
    console.log("Seeding RH email...");
    const { error: configError } = await supabase.from('config').upsert({
      key: 'rh_email',
      value: 'rh@talhodelicatessen.com.br'
    }, { onConflict: 'key' });
    if (configError) throw new Error(`Error seeding config: ${configError.message}`);

    // 4. Fetch roles and sectors for employee seeding
    console.log("Fetching roles and sectors...");
    const { data: roles, error: rolesFetchError } = await supabase.from('roles').select('*');
    const { data: sectors, error: sectorsFetchError } = await supabase.from('sectors').select('*');

    if (rolesFetchError || sectorsFetchError) throw new Error("Failed to fetch roles or sectors from database");
    if (!roles || roles.length === 0 || !sectors || sectors.length === 0) throw new Error("Roles or sectors are empty in database");

    // 5. Seed Employees (Full List)
    console.log("Seeding employees...");
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
      const { error } = await supabase.from('employees').upsert({
        name: initialEmployees[i],
        role_id: roles[i % roles.length].id,
        avatar: `https://picsum.photos/seed/${initialEmployees[i].replace(/\s/g, '')}/100/100`,
        sector_id: sectors[i % sectors.length].id
      }, { onConflict: 'name' });
      if (error) throw new Error(`Error seeding employee ${initialEmployees[i]}: ${error.message}`);
    }

    // 6. Seed Special Schedules
    console.log("Seeding special schedules...");
    const initialSpecials = [
      { name: 'Inventário Geral', date: '2026-03-15', status: 'Confirmado' },
      { name: 'Treinamento CIPA', date: '2026-03-20', status: 'Pendente' },
    ];
    for (const item of initialSpecials) {
      const { error } = await supabase.from('special_schedules').upsert(item, { onConflict: 'name' });
      if (error) throw new Error(`Error seeding special schedule ${item.name}: ${error.message}`);
    }

    return NextResponse.json({ success: true, message: "Supabase seeded successfully" });
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
