# Escala do Talho

Escala do Talho e uma aplicacao web para gestao de escalas de colaboradores, turnos, ausencias, ferias, horas extras e eventos especiais.

## Stack

- Frontend: Next.js 16, React 19, TypeScript e Tailwind CSS
- Banco de dados: Firebase Firestore
- Autenticacao: Firebase Authentication
- Admin server-side: Firebase Admin SDK
- E-mail: Resend
- Relatorios: jsPDF, AutoTable e XLSX

## Funcionalidades

- Dashboard com visao geral de alertas e indicadores
- Planejador mensal de escala por colaborador
- Cadastro e gestao de colaboradores, setores, cargos e acessos
- Controle de ferias por setor
- Registro de faltas, dobras, folgas trabalhadas e horas extras
- Relatorios em PDF e XLSX
- Envio semanal de resumo para o RH

## Como executar

1. Instale as dependencias:

```bash
npm install
```

2. Rode o ambiente de desenvolvimento:

```bash
npm run dev
```

3. Abra `http://localhost:3000`

## Variaveis de ambiente

Use `.env.example` como base e configure:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` opcional
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
  - ou:
  - `FIREBASE_ADMIN_PROJECT_ID`
  - `FIREBASE_ADMIN_CLIENT_EMAIL`
  - `FIREBASE_ADMIN_PRIVATE_KEY`

## Firebase em producao

1. Configure as variaveis de ambiente no Vercel.
2. Publique as regras do Firestore com `firebase deploy --only firestore`.
3. Garanta que Authentication e Firestore estejam habilitados no projeto Firebase.
4. Mantenha o `projectId` `controle-escala-talho`.

## Deploy atual

Este repositório está preparado para rodar na Vercel. O arquivo `apphosting.yaml` foi mantido apenas como referência, caso você decida migrar para Firebase App Hosting no futuro.

As credenciais do Firebase Admin, `RESEND_API_KEY` e `CRON_SECRET` devem continuar fora do frontend e fora do `apphosting.yaml`.

## RH semanal

O resumo semanal e enviado toda segunda-feira com os alertas da semana anterior.

## Credencial master

- E-mail: `sistemas@talhodelicatessen.com.br`
- Senha: definida no Firebase Authentication

---

Desenvolvido para Talho Delicatessen.
