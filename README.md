# Escala do Talho

Escala do Talho e uma aplicacao web para gestao de escalas de colaboradores, turnos, ausencias e eventos especiais. O projeto foi desenvolvido com Next.js, TypeScript e SQLite.

## Funcionalidades

- Dashboard: visao geral de alertas, metricas e status da equipe.
- Planejador: interface interativa para gerenciar turnos diarios.
- Colaboradores: cadastro e gestao completa de funcionarios.
- Escalas especiais: planejamento de escalas para eventos especificos com equipes designadas.
- Relatorios: geracao de relatorios em PDF para colaboradores, escalas mensais e eventos.
- Gestao de acesso: sistema de login com niveis de permissao (Admin/Master).
- Notificacoes: alertas automaticos de ausencias e solicitacoes de horas extras.

## Tecnologias Utilizadas

- Frontend: Next.js 15, React 19, Tailwind CSS, Framer Motion.
- Backend: Next.js API Routes.
- Banco de dados: SQLite com Drizzle ORM.
- Relatorios: jsPDF e jsPDF-AutoTable.
- Icones: Lucide React.

## Como Executar

1. Instale as dependencias:
   ```bash
   npm install
   ```

2. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Acesse a aplicacao em `http://localhost:3000`.

## Credenciais Padrao

- Usuario: `sistemas@talhodelicatessen.com.br`
- Senha: definida no Firebase Authentication

## Estrutura do Projeto

- `/app`: rotas e componentes da aplicacao Next.js.
- `/components`: componentes React reutilizaveis.
- `/lib`: utilitarios, configuracoes de banco de dados e schema.
- `/public`: ativos estaticos.

## Firebase em Producao

Este projeto ja esta preparado para usar Firebase em producao.

1. Preencha as variaveis do Firebase em `.env.local` usando `.env.example` como base.
2. O `projectId` padrao deste repositorio e `controle-escala-talho`.
3. Configure o mesmo conjunto de variaveis no Firebase App Hosting a partir de `apphosting.yaml`.
4. Garanta que o projeto Firebase escolhido tenha Authentication e Firestore ativados.
5. Publique as regras do Firestore com `firebase deploy --only firestore`.

As credenciais do cliente Firebase sao carregadas por `firebase.ts` via variaveis de ambiente. Se alguma variavel obrigatoria faltar, a aplicacao vai falhar cedo com uma mensagem clara.

## E-mail Semanal de RH

Os alertas de faltas, dobras e horas extras sao consolidados e enviados automaticamente toda
segunda-feira com base na semana anterior.

Variaveis adicionais necessarias:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` quando voce usar um remetente de dominio proprio
- `CRON_SECRET` para proteger o endpoint agendado do Vercel
- `FIREBASE_SERVICE_ACCOUNT_JSON` ou `FIREBASE_ADMIN_PROJECT_ID` + `FIREBASE_ADMIN_CLIENT_EMAIL` +
  `FIREBASE_ADMIN_PRIVATE_KEY`

O cron esta configurado em `vercel.json` para acionar `/api/cron/weekly-rh-report`.

---
Desenvolvido para Talho Delicatessen.
