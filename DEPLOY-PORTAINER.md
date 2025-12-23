# Deploy via Portainer

## Pré-requisitos

- VPS com Docker instalado
- Portainer instalado e rodando

## Passo 1: Instalar Portainer (se ainda não tiver)

```bash
docker volume create portainer_data

docker run -d \
  -p 9000:9000 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Acesse: `http://seu-ip:9000`

## Passo 2: Subir os arquivos para a VPS

Faça upload destes arquivos para sua VPS (via SCP, SFTP ou Git):

```
/opt/observabilidade/
├── apps/
│   ├── api/
│   │   └── Dockerfile
│   └── web/
│       └── Dockerfile
├── nginx.conf
└── portainer-stack.yml
```

Ou clone diretamente na VPS:
```bash
cd /opt
git clone <seu-repo> observabilidade
```

## Passo 3: Criar a Stack no Portainer

1. Acesse o Portainer: `http://seu-ip:9000`
2. Vá em **Stacks** no menu lateral
3. Clique em **+ Add stack**
4. Dê um nome: `observabilidade`
5. Em **Build method**, escolha:
   - **Upload**: faça upload do arquivo `portainer-stack.yml`
   - **Repository**: cole a URL do seu repo Git
   - **Web editor**: cole o conteúdo do arquivo

## Passo 4: Configurar Variáveis de Ambiente

No Portainer, na seção **Environment variables**, adicione:

| Variável | Valor | Obrigatório |
|----------|-------|-------------|
| `POSTGRES_PASSWORD` | senha_segura_123 | ✅ Sim |
| `JWT_SECRET` | sua_chave_jwt_secreta | ✅ Sim |
| `RESEND_API_KEY` | re_xxxxxxxxxxxx | ❌ Opcional |
| `EMAIL_FROM` | noreply@seudominio.com | ❌ Opcional |
| `NEXT_PUBLIC_API_URL` | http://seu-ip/api | ❌ Opcional |
| `HTTP_PORT` | 80 | ❌ Default: 80 |

### Gerar JWT_SECRET seguro:
```bash
openssl rand -base64 32
```

## Passo 5: Deploy

1. Clique em **Deploy the stack**
2. Aguarde os containers subirem
3. Acompanhe os logs em **Containers**

## Passo 6: Rodar Migrations

Após o primeiro deploy, execute as migrations:

1. No Portainer, vá em **Containers**
2. Encontre o container `observabilidade_api_1`
3. Clique em **Console** > **Connect**
4. Execute:
```bash
npx prisma migrate deploy
```

Ou via linha de comando na VPS:
```bash
docker exec -it observabilidade_api_1 npx prisma migrate deploy
```

## Verificar se está funcionando

- **Frontend**: http://seu-ip
- **API Health**: http://seu-ip/health
- **Portainer Logs**: Containers > api > Logs

## Comandos úteis

```bash
# Ver logs de um serviço
docker logs -f observabilidade_api_1

# Reiniciar um serviço
docker restart observabilidade_api_1

# Ver status de todos os containers
docker ps

# Entrar no container da API
docker exec -it observabilidade_api_1 sh
```

## Atualizando a aplicação

1. No Portainer, vá em **Stacks** > **observabilidade**
2. Clique em **Editor**
3. Clique em **Update the stack**
4. Marque **Re-pull image and redeploy**
5. Clique em **Update**

## Troubleshooting

### Erro de conexão com banco
- Verifique se o PostgreSQL subiu: Containers > postgres
- Confira a variável `POSTGRES_PASSWORD`

### API não inicia
- Verifique os logs: Containers > api > Logs
- Confira se as migrations rodaram

### Frontend não carrega
- Verifique se a API está rodando
- Confira `NEXT_PUBLIC_API_URL`
