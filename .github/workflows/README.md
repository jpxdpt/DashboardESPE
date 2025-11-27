# GitHub Actions Workflows

Este diretório contém os workflows do GitHub Actions para automatizar o processo de desenvolvimento, testes e deploy do Dashboard ESPE.

## Workflows Disponíveis

### 1. CI - Testes e Validação (`ci.yml`)

**Quando executa:**
- Push para `main`, `master` ou `develop`
- Pull Requests para `main`, `master` ou `develop`
- Manualmente via `workflow_dispatch`

**O que faz:**
- ✅ Executa ESLint para verificar qualidade do código
- ✅ Faz type checking do frontend (TypeScript)
- ✅ Faz type checking do backend (TypeScript)
- ✅ Testa se o build do frontend funciona
- ✅ Testa se o build do backend funciona
- ✅ Testa se os Dockerfiles constroem corretamente

**Tempo estimado:** ~3-5 minutos

---

### 2. Build e Push Backend (`build-backend.yml`)

**Quando executa:**
- Push para `main` ou `master` (quando há alterações em `server/`, `prisma/`, etc.)
- Pull Requests (apenas build, sem push)
- Manualmente via `workflow_dispatch`

**O que faz:**
- 🐳 Constrói a imagem Docker do backend
- 📦 Faz push da imagem para GitHub Container Registry (ghcr.io)
- 🏷️ Cria tags automáticas (latest, branch-name, commit-sha)

**Tags criadas:**
- `latest` (apenas na branch principal)
- `main` ou `master` (nome da branch)
- `main-abc123` (branch + commit SHA)

**Tempo estimado:** ~5-8 minutos

---

### 3. Build e Push Frontend (`build-frontend.yml`)

**Quando executa:**
- Push para `main` ou `master` (quando há alterações em `src/`, `public/`, etc.)
- Pull Requests (apenas build, sem push)
- Manualmente via `workflow_dispatch`

**O que faz:**
- 🐳 Constrói a imagem Docker do frontend
- 📦 Faz push da imagem para GitHub Container Registry (ghcr.io)
- 🏷️ Cria tags automáticas (latest, branch-name, commit-sha)

**Tags criadas:**
- `latest` (apenas na branch principal)
- `main` ou `master` (nome da branch)
- `main-abc123` (branch + commit SHA)

**Tempo estimado:** ~5-8 minutos

---

### 4. Prisma Migrations (`prisma-migrate.yml`)

**Quando executa:**
- Manualmente via `workflow_dispatch` (recomendado)
- Automaticamente quando há alterações em `prisma/schema.prisma` ou `prisma/migrations/`

**O que faz:**
- 🔄 Executa migrações da base de dados Prisma
- ⚙️ Gera o Prisma Client após migrações

**Comandos disponíveis:**
- `deploy` - Executa migrações pendentes (produção)
- `dev` - Cria nova migração (desenvolvimento)
- `reset` - ⚠️ Apaga todos os dados e recria a base de dados

**⚠️ Requer:**
- Secret `DATABASE_URL` configurado no GitHub

**Tempo estimado:** ~2-3 minutos

---

## Configuração Necessária

### Secrets do GitHub

Para que os workflows funcionem completamente, configure os seguintes secrets no GitHub:

1. **`DATABASE_URL`** (opcional, apenas para migrações)
   - String de conexão PostgreSQL
   - Formato: `postgresql://user:password@host:port/database?sslmode=require`
   - Configurar em: Settings → Secrets and variables → Actions

### Permissões

Os workflows usam automaticamente o `GITHUB_TOKEN` para:
- ✅ Fazer push de imagens para GitHub Container Registry
- ✅ Aceder ao repositório
- ✅ Criar/atualizar packages

**Nota:** Se o repositório for privado, certifique-se de que as permissões do `GITHUB_TOKEN` estão configuradas corretamente.

---

## Como Usar

### Executar CI Manualmente

1. Vá a **Actions** no GitHub
2. Selecione **CI - Testes e Validação**
3. Clique em **Run workflow**
4. Escolha a branch e clique em **Run workflow**

### Executar Migrações

1. Vá a **Actions** no GitHub
2. Selecione **Prisma Migrations**
3. Clique em **Run workflow**
4. Escolha o comando (`deploy`, `dev`, ou `reset`)
5. Clique em **Run workflow**

### Ver Imagens Docker Publicadas

1. Vá ao seu repositório no GitHub
2. No lado direito, clique em **Packages**
3. Verá as imagens `backend` e `frontend`

### Usar Imagens no Portainer

As imagens estarão disponíveis em:
- `ghcr.io/SEU_USUARIO/SEU_REPO/backend:latest`
- `ghcr.io/SEU_USUARIO/SEU_REPO/frontend:latest`

Substitua `SEU_USUARIO/SEU_REPO` pelo seu utilizador e nome do repositório.

---

## Fluxo Recomendado

1. **Desenvolvimento:**
   - Faça alterações no código
   - Crie um Pull Request
   - O CI executa automaticamente e valida o código
   - Se passar, pode fazer merge

2. **Deploy:**
   - Faça merge para `main` ou `master`
   - Os workflows de build executam automaticamente
   - As imagens Docker são publicadas
   - No Portainer, faça pull das novas imagens e reinicie as stacks

3. **Migrações:**
   - Se alterar o schema Prisma, execute o workflow de migrações
   - Escolha `deploy` para produção ou `dev` para desenvolvimento

---

## Troubleshooting

### Workflow falha no CI

- Verifique os logs do workflow
- Certifique-se de que o código passa no ESLint
- Verifique se há erros de TypeScript

### Imagens não são publicadas

- Verifique se está na branch `main` ou `master`
- Verifique as permissões do `GITHUB_TOKEN`
- Certifique-se de que o repositório tem Packages habilitado

### Migrações falham

- Verifique se o secret `DATABASE_URL` está configurado
- Certifique-se de que a base de dados está acessível
- Verifique os logs do workflow para erros específicos

---

## Melhorias Futuras

- [ ] Adicionar testes unitários
- [ ] Adicionar testes de integração
- [ ] Adicionar notificações (Slack, Discord, etc.)
- [ ] Adicionar deploy automático após build
- [ ] Adicionar análise de segurança (Snyk, Dependabot)

