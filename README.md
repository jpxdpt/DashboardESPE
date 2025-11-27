# Dashboard Escola - Sistema de Alertas

Sistema de dashboard para gestão de alertas de ordem de saída entre professores e secretaria.

## Funcionalidades

- **Autenticação separada**: Login para professores e secretaria
- **Sistema de alertas em tempo real**: Professores enviam alertas que aparecem instantaneamente na dashboard da secretaria via WebSockets
- **Gestão de salas**: Interface para adicionar, editar e eliminar salas
- **Gestão de utilizadores**: Interface para criar contas de professores e secretaria
- **Histórico permanente**: Todos os alertas são armazenados e podem ser consultados

## Tecnologias

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + Socket.io
- **Base de Dados**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Autenticação**: JWT
- **Styling**: Tailwind CSS

## Pré-requisitos

- Node.js 18+ instalado
- Conta Neon (PostgreSQL) ou outra base de dados PostgreSQL

## Instalação

1. Clone o repositório ou navegue até à pasta do projeto

2. Instale as dependências:
```bash
npm install
```

3. Configure a base de dados:
   - Crie uma conta na [Neon](https://neon.tech) ou use outra base de dados PostgreSQL
   - Obtenha a connection string da sua base de dados
   - Crie um ficheiro `.env` na raiz do projeto
   - Adicione a seguinte configuração:
```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
JWT_SECRET="seu-secret-key-aqui-mude-em-producao"
PORT=3001
VITE_API_URL=http://localhost:3001
```

4. Configure o Prisma:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. (Opcional) Popule a base de dados com dados de exemplo:
```bash
npm run prisma:seed
```

Isto criará:
- Utilizador secretaria: `secretaria@escola.pt` / `admin123`
- Utilizador professor: `professor@escola.pt` / `admin123`
- 2 salas de exemplo

6. Inicie o servidor de desenvolvimento:
```bash
npm run dev:all
```

Isto irá iniciar:
- Frontend em `http://localhost:5173`
- Backend em `http://localhost:3001`

## Scripts Disponíveis

- `npm run dev` - Inicia apenas o frontend
- `npm run dev:server` - Inicia apenas o backend
- `npm run dev:all` - Inicia frontend e backend simultaneamente
- `npm run build` - Compila o frontend para produção
- `npm run prisma:generate` - Gera o cliente Prisma
- `npm run prisma:migrate` - Executa migrações da base de dados
- `npm run prisma:studio` - Abre o Prisma Studio para visualizar dados

## Estrutura do Projeto

```
├── server/           # Backend Express + Socket.io
│   └── index.ts      # Servidor principal
├── src/              # Frontend React
│   ├── components/   # Componentes React
│   ├── contexts/     # Contextos (Auth, Socket)
│   ├── lib/          # Utilitários e API client
│   ├── pages/        # Páginas da aplicação
│   └── types/        # Tipos TypeScript
├── prisma/           # Schema e migrações Prisma
└── public/           # Ficheiros estáticos
```

## Primeiros Passos

1. Após iniciar o servidor, aceda a `http://localhost:5173`
2. Para criar o primeiro utilizador, pode usar o Prisma Studio:
   ```bash
   npm run prisma:studio
   ```
   Ou criar via interface após fazer login como secretaria

3. **Importante**: As passwords são hasheadas com bcrypt. Para criar um utilizador manualmente na base de dados, precisa de hash a password primeiro.

## Uso

### Para Professores:
1. Faça login com as suas credenciais
2. Clique em "Enviar Alerta" quando precisar de autorizar a saída de um aluno
3. Selecione a sala onde se encontra
4. O alerta será enviado automaticamente para a secretaria

### Para Secretaria:
1. Faça login com as suas credenciais
2. Veja os alertas pendentes em tempo real
3. Marque os alertas como resolvidos quando alguém for à sala
4. Consulte o histórico de todos os alertas
5. Aceda a "Gestão de Salas" para adicionar/editar salas
6. Aceda a "Gestão de Utilizadores" para criar novos utilizadores

## Notas de Segurança

- **IMPORTANTE**: Mude o `JWT_SECRET` no ficheiro `.env` para um valor seguro em produção
- As passwords são hasheadas com bcrypt antes de serem guardadas
- Todas as rotas da API (exceto login) requerem autenticação JWT
- O ficheiro `.env` não deve ser commitado no Git

## Suporte

Para questões ou problemas, verifique os logs do servidor no terminal.
