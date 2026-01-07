# Deploy BeaconOps no Portainer

Guia completo para deploy do BeaconOps usando Portainer com Traefik.

## Pre-requisitos

- Servidor com Docker instalado
- Portainer rodando
- Traefik configurado como reverse proxy
- Rede Docker `traefik` criada
- Subdominio configurado (ex: beaconops.seudominio.com.br)

## 1. Preparar Imagens Docker

### Opcao A: GitHub Container Registry (Recomendado)

1. Crie um Personal Access Token no GitHub:
   - Acesse: Settings > Developer settings > Personal access tokens > Tokens (classic)
   - Crie um token com permissao `write:packages`

2. Faca login no GHCR:
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u SEU_USUARIO --password-stdin
```

3. Build e push das imagens:
```bash
# Na raiz do projeto
GITHUB_USER=seu-usuario ./scripts/push-images.sh
```

### Opcao B: Build direto no Portainer

Se preferir, o Portainer pode buildar diretamente do repositorio Git.
Neste caso, configure o repositorio no momento do deploy.

## 2. Configurar DNS

Aponte seu subdominio para o IP do servidor:

```
beaconops.seudominio.com.br -> IP_DO_SERVIDOR
```

Aguarde a propagacao do DNS (pode levar alguns minutos).

## 3. Deploy no Portainer

### Passo 1: Acessar Stacks

1. Acesse o Portainer
2. Selecione o environment (Local ou seu servidor)
3. Va em **Stacks** > **Add stack**

### Passo 2: Configurar Stack

1. **Name**: `beaconops`

2. **Build method**: Escolha uma opcao:
   - **Web editor**: Cole o conteudo do arquivo `docker-compose.portainer.yml`
   - **Repository**: Configure seu repositorio Git

3. **Environment variables** (OBRIGATORIO):

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| `DOMAIN` | Seu subdominio | `beaconops.seudominio.com.br` |
| `POSTGRES_PASSWORD` | Senha do banco | `SenhaForte123!@#` |
| `JWT_SECRET` | Chave secreta JWT | (gere com comando abaixo) |
| `GITHUB_USER` | Usuario do GitHub | `seu-usuario` |

Para gerar o JWT_SECRET:
```bash
openssl rand -hex 32
```

### Passo 3: Deploy

1. Clique em **Deploy the stack**
2. Aguarde todos os containers iniciarem
3. Verifique se nao ha erros nos logs

## 4. Verificar Deploy

### Checar containers:

No Portainer, verifique se todos os containers estao "running":
- `beaconops-postgres`
- `beaconops-redis`
- `beaconops-api`
- `beaconops-worker`
- `beaconops-web`

### Checar logs:

Clique em cada container e va em "Logs" para verificar se iniciou corretamente.

### Testar aplicacao:

1. Acesse `https://beaconops.seudominio.com.br`
2. Faca o registro de um novo usuario
3. Crie um monitor de teste

## 5. Troubleshooting

### Erro de conexao com banco:

```bash
# Dentro do container da API, verificar conexao:
docker exec beaconops-api wget -qO- http://localhost:3333/health
```

### Certificado SSL nao funciona:

1. Verifique se o Traefik esta configurado corretamente
2. Confirme que a rede `traefik` existe e o Traefik esta conectado
3. Verifique os logs do Traefik para erros de ACME/Let's Encrypt

### API retorna 502 Bad Gateway:

1. Verifique se a API esta rodando: `docker logs beaconops-api`
2. Confirme que a porta 3333 esta configurada corretamente
3. Verifique se a API consegue conectar no PostgreSQL e Redis

### Migracoes do banco:

As migracoes rodam automaticamente ao iniciar a API.
Se precisar rodar manualmente:

```bash
docker exec beaconops-api npx prisma migrate deploy
```

## 6. Backup

### Backup do banco de dados:

```bash
docker exec beaconops-postgres pg_dump -U beaconops beaconops > backup.sql
```

### Restore:

```bash
cat backup.sql | docker exec -i beaconops-postgres psql -U beaconops beaconops
```

## 7. Atualizacao

Para atualizar para uma nova versao:

1. Build e push das novas imagens (ou atualize a tag)
2. No Portainer, va em Stacks > beaconops
3. Clique em **Pull and redeploy**

---

## Variaveis de Ambiente Completas

| Variavel | Obrigatoria | Descricao |
|----------|-------------|-----------|
| `DOMAIN` | Sim | Subdominio da aplicacao |
| `POSTGRES_PASSWORD` | Sim | Senha do PostgreSQL |
| `JWT_SECRET` | Sim | Chave secreta para tokens JWT |
| `GITHUB_USER` | Sim* | Usuario GitHub (para imagens do GHCR) |

*Nao necessario se buildar localmente
