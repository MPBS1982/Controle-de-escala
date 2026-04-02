# ShiftMaster - Sistema de Gestão de Escalas

ShiftMaster é uma aplicação web robusta para gestão de escalas de colaboradores, turnos, ausências e eventos especiais. Desenvolvido com Next.js, TypeScript e SQLite.

## Funcionalidades

- **Dashboard**: Visão geral de alertas, métricas e status da equipe.
- **Planejador**: Interface interativa para gerenciar turnos diários.
- **Colaboradores**: Cadastro e gestão completa de funcionários.
- **Escalas Especiais**: Planejamento de escalas para eventos específicos com equipes designadas.
- **Relatórios**: Geração de relatórios em PDF para colaboradores, escalas mensais e eventos.
- **Gestão de Acesso**: Sistema de login com níveis de permissão (Admin/Master).
- **Notificações**: Alertas automáticos de ausências e solicitações de horas extras.

## Tecnologias Utilizadas

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Framer Motion.
- **Backend**: Next.js API Routes.
- **Banco de Dados**: SQLite com Drizzle ORM.
- **Relatórios**: jsPDF, jsPDF-AutoTable.
- **Ícones**: Lucide React.

## Como Executar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Acesse a aplicação em `http://localhost:3000`.

## Credenciais Padrão

- **Usuário**: admin@shiftmaster.com
- **Senha**: admin

## Estrutura do Projeto

- `/app`: Rotas e componentes da aplicação Next.js.
- `/components`: Componentes React reutilizáveis.
- `/lib`: Utilitários, configurações de banco de dados e schema.
- `/public`: Ativos estáticos.

## Firebase em Produção

Este projeto já está preparado para usar Firebase no ambiente de produção.

1. Preencha as variáveis do Firebase em `.env.local` usando `.env.example` como base.
2. O `projectId` padrão deste repositório é `controle-escala-talho`.
3. Configure o mesmo conjunto de variáveis no Firebase App Hosting a partir de `apphosting.yaml`.
4. Garanta que o projeto Firebase escolhido tenha Authentication e Firestore ativados.
5. Publique as regras do Firestore com `firebase deploy --only firestore`.

As credenciais do cliente Firebase são carregadas por `firebase.ts` via variáveis de ambiente. Se alguma variável obrigatória faltar, a aplicação vai falhar cedo com uma mensagem clara.

---
Desenvolvido para Talho Delicatessen.
