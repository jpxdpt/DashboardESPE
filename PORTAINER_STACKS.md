# Guia de Configuração das Stacks no Portainer

Este guia explica como configurar as stacks do Dashboard ESPE no Portainer usando as imagens Docker geradas pelos GitHub Actions.

## Pré-requisitos

1. **Imagens Docker publicadas**: As imagens devem estar disponíveis no GitHub Container Registry (ghcr.io) ou Docker Hub
2. **Rede Docker**: Criar uma rede chamada `dashboard-network` (ou usar a rede padrão)
3. **Variáveis de ambiente**: Ter as seguintes variáveis configuradas:
   - `DATABASE_URL`: String de conexão PostgreSQL
   - `JWT_SECRET`: Chave secreta para JWT
   - `VITE_API_URL`: URL da API (opcional, padrão: http://localhost:3001)
   - `CORS_ORIGIN`: Origem permitida para CORS (opcional, padrão: http://localhost)

## Opção 1: Criar Stacks Separadas (Recomendado)

### Stack 1: Backend

1. No Portainer, vá a **Stacks** → **Add stack**
2. Nome: `dashboard-backend`
3. Cole o seguinte conteúdo no editor web:

```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/SEU_USUARIO/SEU_REPO/backend:latest
    container_name: dashboard-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - VITE_API_URL=${VITE_API_URL:-http://localhost:3001}
      - CORS_ORIGIN=${CORS_ORIGIN:-http://localhost}
    networks:
      - dashboard-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/api/alerts', (r) => {process.exit(r.statusCode === 401 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  dashboard-network:
    external: true
```

4. **IMPORTANTE**: Substitua `SEU_USUARIO/SEU_REPO` pelo seu nome de utilizador e repositório do GitHub
5. Configure as variáveis de ambiente na secção **Environment variables** do Portainer
6. Clique em **Deploy the stack**

### Stack 2: Frontend

1. No Portainer, vá a **Stacks** → **Add stack**
2. Nome: `dashboard-frontend`
3. Cole o seguinte conteúdo no editor web:

```yaml
version: '3.8'

services:
  frontend:
    image: ghcr.io/SEU_USUARIO/SEU_REPO/frontend:latest
    container_name: dashboard-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    environment:
      - NGINX_HOST=_
      - NGINX_PORT=80
    depends_on:
      - backend
    networks:
      - dashboard-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80 || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  dashboard-network:
    external: true
```

4. **IMPORTANTE**: Substitua `SEU_USUARIO/SEU_REPO` pelo seu nome de utilizador e repositório do GitHub
5. Clique em **Deploy the stack**

## Opção 2: Stack Única (Backend + Frontend)

Se preferir ter tudo numa única stack:

1. No Portainer, vá a **Stacks** → **Add stack**
2. Nome: `dashboard-full`
3. Cole o conteúdo do ficheiro `docker-compose.full.yml` (substituindo `SEU_USUARIO/SEU_REPO`)
4. Configure as variáveis de ambiente
5. Clique em **Deploy the stack**

## Criar a Rede Docker

Antes de criar as stacks, crie a rede `dashboard-network`:

1. No Portainer, vá a **Networks** → **Add network**
2. Nome: `dashboard-network`
3. Driver: `bridge`
4. Clique em **Create the network**

Ou via linha de comandos no servidor:

```bash
docker network create dashboard-network
```

## Configurar Variáveis de Ambiente no Portainer

### Para a Stack do Backend:

1. Na página da stack, clique em **Editor**
2. Adicione as seguintes variáveis na secção **Environment variables**:

```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
JWT_SECRET=sua-chave-secreta-aqui
VITE_API_URL=http://seu-servidor:3001
CORS_ORIGIN=http://seu-servidor
```

**Nota sobre CORS_ORIGIN**: 
- Se o frontend estiver no mesmo domínio, use apenas o domínio (ex: `http://seu-servidor`)
- Se o frontend estiver num subdomínio diferente, pode especificar múltiplas origens separadas por vírgula (ex: `http://dashboard.exemplo.com,http://app.exemplo.com`)
- **Importante**: O frontend usa nginx como proxy reverso. As chamadas `/api` e `/socket.io` são automaticamente redirecionadas para o backend através da rede Docker. Por isso, o `CORS_ORIGIN` deve ser o domínio onde o frontend está acessível (ex: `http://seu-servidor` ou `https://dashboard.exemplo.com`)

## Autenticação no GitHub Container Registry

Se as imagens estiverem no GitHub Container Registry (ghcr.io), pode ser necessário autenticar:

1. No Portainer, vá a **Registries** → **Add registry**
2. Tipo: **Custom**
3. Nome: `ghcr.io`
4. URL: `https://ghcr.io`
5. Username: Seu nome de utilizador do GitHub
6. Password: Personal Access Token do GitHub (com permissão `read:packages`)

## Verificar se as Stacks Estão a Funcionar

1. **Backend**: Aceda a `http://seu-servidor:3001/api/health` (se tiver endpoint de health)
2. **Frontend**: Aceda a `http://seu-servidor:80`

## Atualizar as Imagens

Quando fizer push para o repositório, os GitHub Actions vão construir novas imagens automaticamente. Para atualizar:

1. No Portainer, vá à stack
2. Clique em **Editor**
3. Altere a tag da imagem (ex: de `latest` para `main-abc123` ou force pull)
4. Clique em **Update the stack**

Ou pode usar o comando:

```bash
docker pull ghcr.io/SEU_USUARIO/SEU_REPO/backend:latest
docker pull ghcr.io/SEU_USUARIO/SEU_REPO/frontend:latest
```

Depois reinicie as stacks no Portainer.

## Troubleshooting

### Erro: "network dashboard-network not found"
- Crie a rede primeiro (ver secção "Criar a Rede Docker")

### Erro: "unauthorized: authentication required"
- Configure a autenticação no GitHub Container Registry (ver secção "Autenticação")

### Backend não consegue conectar à base de dados
- Verifique se a `DATABASE_URL` está correta
- Verifique se a base de dados está acessível do servidor

### Frontend não consegue conectar ao backend
- Verifique se ambos os containers estão na mesma rede
- Verifique se o backend está a correr na porta 3001
- Verifique as configurações de CORS no backend

