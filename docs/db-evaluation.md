# Avaliação de Banco de Dados: Supabase vs Managed Cloud Postgres

## Resumo Executivo

**Recomendação:** Manter Supabase para as fases atuais e próximas do projeto Amazon Arara Azul.

**Justificativa:** Supabase oferece integração completa de Auth, Realtime, Storage e Edge Functions que aceleram o desenvolvimento e reduzem complexidade operacional. A migração para Managed Postgres só deve ser considerada em cenários de escala muito alta ou requisitos de compliance específicos.

---

## 1. Análise Comparativa

### 1.1 Supabase (Lovable Cloud)

#### Prós ✅

**Funcionalidades Integradas:**
- ✅ **Authentication:** Sistema completo de auth.users com JWT, sessions, refresh tokens
- ✅ **Row Level Security (RLS):** Segurança nativa no banco com policies declarativas
- ✅ **Realtime:** PostgreSQL pub/sub integrado via WebSockets
- ✅ **Storage:** Object storage com policies RLS para uploads de arquivos
- ✅ **Edge Functions:** Deno runtime para lógica server-side
- ✅ **Dashboard:** Interface visual para gerenciar tabelas, policies, functions

**Desenvolvimento Rápido:**
- ✅ Zero configuração de infraestrutura
- ✅ Deploy automático de migrations e edge functions
- ✅ Client libraries otimizadas (@supabase/supabase-js)
- ✅ Triggers e functions SQL nativos
- ✅ pg_cron para jobs agendados (FASE 7 audit cleanup)

**Custos (para MVP/Startup):**
- ✅ Free tier generoso: 500 MB database, 1 GB bandwidth, 50K monthly users
- ✅ Pro plan: $25/mês para 8 GB database, 250 GB bandwidth
- ✅ Previsível e escalável por uso

**Segurança:**
- ✅ RLS policies nativas (já implementadas em todas tabelas)
- ✅ Connection pooling automático (PgBouncer)
- ✅ Backups automáticos diários
- ✅ SSL/TLS por padrão

**Casos de Uso Ideais:**
- ✅ MVPs e produtos em crescimento
- ✅ Apps com auth + realtime + storage
- ✅ Equipes pequenas/médias sem DevOps dedicado
- ✅ **Amazon Arara Azul atual:** Sistema de reservas com admin dashboard, realtime updates, audit logging

#### Contras ❌

**Limitações de Controle:**
- ❌ Menor controle sobre configurações PostgreSQL
- ❌ Não pode instalar extensões PostgreSQL arbitrárias (apenas as fornecidas)
- ❌ Vendor lock-in parcial (auth, realtime, storage são Supabase-specific)

**Escala Extrema:**
- ❌ Pode ser mais caro que self-hosted em escala muito alta (>100M requests/mês)
- ❌ Menos flexibilidade para otimizações PostgreSQL específicas

**Compliance:**
- ❌ Dados hospedados em infraestrutura da Supabase (região específica)
- ❌ Pode não atender requisitos de compliance muito específicos (ex: on-premise only)

---

### 1.2 Managed Cloud Postgres (AWS RDS, GCP Cloud SQL, Azure Database)

#### Prós ✅

**Controle Total:**
- ✅ Configuração completa do PostgreSQL (shared_buffers, work_mem, etc.)
- ✅ Qualquer extensão PostgreSQL disponível
- ✅ Tuning fino de performance para casos específicos

**Infraestrutura Madura:**
- ✅ Multi-AZ, réplicas de leitura, failover automático
- ✅ Backup/restore com point-in-time recovery
- ✅ Integração com ferramentas enterprise (monitoring, logging)

**Custo em Escala:**
- ✅ Pode ser mais barato em escala muito alta (>1M usuários)
- ✅ Reserved instances para economia de longo prazo

**Compliance:**
- ✅ Maior controle sobre localização de dados
- ✅ Certificações específicas (PCI-DSS, HIPAA, SOC 2)
- ✅ VPC isolation completa

#### Contras ❌

**Complexidade Operacional:**
- ❌ **Auth separado:** Precisa implementar JWT, refresh tokens, password reset (ex: Auth0, Firebase Auth)
- ❌ **Realtime separado:** Precisa pub/sub service (Redis Pub/Sub, AWS SNS/SQS, pusher.com)
- ❌ **Storage separado:** Precisa S3/GCS/Azure Blob + políticas de acesso
- ❌ **DevOps:** Requer expertise para gerenciar migrations, backups, monitoring

**Tempo de Desenvolvimento:**
- ❌ Meses de setup vs dias com Supabase
- ❌ Manutenção contínua de infraestrutura

**Custos Iniciais:**
- ❌ Mais caro para MVPs/startups:
  - AWS RDS PostgreSQL: ~$50-200/mês (db.t3.small a db.m5.large)
  - Auth service: $0-99/mês (Auth0)
  - Realtime service: $25-100/mês (Pusher, Ably)
  - Storage: $0.023/GB/mês + bandwidth
  - Total: **$75-400/mês** vs **$25/mês** Supabase

---

## 2. Avaliação para Amazon Arara Azul

### 2.1 Contexto Atual

**Sistema implementado:**
- ✅ Auth com roles (super_admin, admin, user)
- ✅ Reservations management com realtime updates
- ✅ Payments tracking com status sync
- ✅ Contact messages com admin dashboard
- ✅ Audit logging com retenção de 15 dias
- ✅ User management via Edge Functions
- ✅ RLS policies em todas tabelas críticas

**Funcionalidades críticas:**
1. **Realtime updates:** Admins veem mudanças instantaneamente (reservas, pagamentos, mensagens, audit log)
2. **Auth + RLS:** Proteção por role (super_admin > admin > user)
3. **Edge Functions:** create-user, delete-user, generate-receipt-pdf, payment-webhook
4. **Audit logging:** pg_cron job diário para cleanup

**Integrações futuras:**
- Banco Caixa payment gateway (via Edge Function webhook - já preparado)
- Email notifications (via Edge Functions)
- Possível integração com CRM externo

### 2.2 Requisitos Técnicos

| Requisito | Importância | Supabase | Managed Postgres |
|-----------|-------------|----------|------------------|
| Auth integrado | Alta | ✅ Nativo | ❌ Separado |
| Realtime updates | Alta | ✅ Nativo | ❌ Separado |
| RLS policies | Alta | ✅ Nativo | ⚠️ Implementável |
| Edge Functions | Média | ✅ Nativo | ❌ Separado (Lambda) |
| Audit logging | Média | ✅ pg_cron | ✅ pg_cron |
| Backups automáticos | Alta | ✅ Incluído | ✅ Incluído |
| Custo MVP | Alta | ✅ $25/mês | ❌ $75-400/mês |
| DevOps complexity | Alta | ✅ Zero | ❌ Alta |

### 2.3 Cenários de Escala

**Atual (MVP/Lançamento):**
- Usuários esperados: <5.000/mês
- Reservas: ~500-1.000/mês
- Storage: <1 GB
- **Veredicto:** Supabase Free/Pro tier é perfeito ✅

**Crescimento Médio (1-2 anos):**
- Usuários: 5.000-50.000/mês
- Reservas: 1.000-10.000/mês
- Storage: 1-10 GB
- **Veredicto:** Supabase Pro/Team tier ($25-299/mês) ainda ideal ✅

**Escala Alta (2-5 anos):**
- Usuários: 50.000-500.000/mês
- Reservas: 10.000-100.000/mês
- Storage: 10-100 GB
- **Veredicto:** Supabase Enterprise ou avaliar migração ⚠️

**Escala Extrema (5+ anos):**
- Usuários: >500.000/mês
- Reservas: >100.000/mês
- Storage: >100 GB
- **Veredicto:** Considerar Managed Postgres + microservices ⚠️

---

## 3. Recomendação: Manter Supabase

### 3.1 Razões Técnicas

1. **Realtime é essencial:** Admin dashboard depende de updates instantâneos para UX fluida
2. **Auth + RLS reduzem 80% do backend:** Não precisar gerenciar JWT, sessions, password reset
3. **Edge Functions simplificam integrações:** Banco Caixa webhook pode ser implementado em minutos
4. **pg_cron já funciona:** Audit cleanup automático sem infraestrutura adicional
5. **Deploy automático:** Lovable integra perfeitamente com Supabase

### 3.2 Razões de Negócio

1. **Time-to-market:** Manter Supabase economiza 2-3 meses de desenvolvimento
2. **Custo inicial:** $25/mês vs $300+ (managed + auth + realtime + storage)
3. **Equipe pequena:** Sem necessidade de DevOps dedicado
4. **Foco no produto:** Tempo investido em features, não em infraestrutura

### 3.3 Quando Reavaliar

**Trigger para reavaliação:**
- [ ] Usuários ativos > 100.000/mês
- [ ] Requisitos de compliance específicos (ex: dados devem estar on-premise)
- [ ] Necessidade de extensões PostgreSQL não disponíveis no Supabase
- [ ] Custo Supabase > $500/mês (comparar com alternativas)
- [ ] Requisitos de performance extrema (queries complexas com >100ms)

**Frequência de revisão:** A cada 6 meses ou quando atingir 50% dos limites do plano atual

---

## 4. Plano de Migração (Futuro, se necessário)

### 4.1 Preparação (2-3 meses antes)

**1. Auditoria de Dependências:**
```typescript
// Identificar todas as features Supabase-specific
const supabaseDependencies = {
  auth: ['supabase.auth.signUp', 'supabase.auth.signIn', 'supabase.auth.onAuthStateChange'],
  realtime: ['supabase.channel().on()'],
  storage: ['supabase.storage.from()'],
  functions: ['supabase.functions.invoke()'],
};
```

**2. Escolher Alternativas:**
- **Auth:** Auth0, Firebase Auth, ou custom JWT com Passport.js
- **Realtime:** Redis Pub/Sub, Socket.io, Pusher, Ably
- **Storage:** AWS S3, GCS, Azure Blob Storage
- **Functions:** AWS Lambda, Google Cloud Functions, Vercel Serverless

**3. Configurar Nova Infraestrutura:**
```bash
# Exemplo: AWS
- RDS PostgreSQL (db.m5.large, Multi-AZ)
- ElastiCache Redis (para realtime pub/sub)
- S3 bucket (para storage)
- Lambda functions (para edge functions)
- API Gateway (para endpoints)
- CloudFront (para CDN)
```

### 4.2 Migração de Dados (1 semana)

**Passo 1: Exportar schema e dados**
```bash
# Export do Supabase
pg_dump -h db.PROJECT_ID.supabase.co \
  -U postgres \
  -d postgres \
  -W \
  --schema=public \
  --no-owner \
  --no-acl \
  -f arara-azul-schema.sql

# Export de dados
pg_dump -h db.PROJECT_ID.supabase.co \
  -U postgres \
  -d postgres \
  -W \
  --schema=public \
  --data-only \
  --no-owner \
  --no-acl \
  -f arara-azul-data.sql
```

**Passo 2: Importar no novo banco**
```bash
# Import schema
psql -h new-rds-instance.region.rds.amazonaws.com \
  -U admin \
  -d arara_azul \
  -f arara-azul-schema.sql

# Import data
psql -h new-rds-instance.region.rds.amazonaws.com \
  -U admin \
  -d arara_azul \
  -f arara-azul-data.sql
```

**Passo 3: Verificar integridade**
```sql
-- Contar registros em cada tabela
SELECT 'profiles' as table_name, COUNT(*) FROM profiles
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'contact_messages', COUNT(*) FROM contact_messages
UNION ALL
SELECT 'activity_log', COUNT(*) FROM activity_log;
```

### 4.3 Migração de Auth (2-3 semanas)

**Opção A: Auth0**
```typescript
// Substituir Supabase Auth
import { Auth0Client } from '@auth0/auth0-spa-js';

const auth0 = new Auth0Client({
  domain: 'arara-azul.auth0.com',
  client_id: 'YOUR_CLIENT_ID',
  redirect_uri: window.location.origin
});

// Login
await auth0.loginWithRedirect();

// Get user
const user = await auth0.getUser();

// Logout
await auth0.logout();
```

**Opção B: Custom JWT**
```typescript
// Backend (Node.js + Express)
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Signup
const hashedPassword = await bcrypt.hash(password, 10);
await db.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hashedPassword]);

// Login
const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
const valid = await bcrypt.compare(password, user.password);
if (valid) {
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  return { token, user };
}

// Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  req.userId = decoded.userId;
  next();
};
```

**Migrar usuários existentes:**
```sql
-- Copiar users da auth.users para nova tabela
INSERT INTO users (id, email, created_at)
SELECT id, email, created_at FROM auth.users;

-- Usuários terão que resetar senha (não é possível exportar hashes)
-- Enviar email: "Sistema migrado, por favor redefina sua senha"
```

### 4.4 Migração de Realtime (1-2 semanas)

**Opção A: Redis Pub/Sub + Socket.io**

**Backend:**
```typescript
import { Server } from 'socket.io';
import Redis from 'ioredis';

const io = new Server(server);
const redis = new Redis();
const subscriber = new Redis();

// Subscribe to PostgreSQL changes via pg_notify
subscriber.subscribe('reservations_channel');
subscriber.subscribe('payments_channel');

subscriber.on('message', (channel, message) => {
  // Broadcast to all connected clients
  io.to(channel).emit('database_change', JSON.parse(message));
});

// Client connects
io.on('connection', (socket) => {
  socket.on('subscribe', (channel) => {
    socket.join(channel);
  });
});
```

**PostgreSQL Trigger:**
```sql
CREATE OR REPLACE FUNCTION notify_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    TG_TABLE_NAME || '_channel',
    json_build_object('operation', TG_OP, 'record', row_to_json(NEW))::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_notify
AFTER INSERT OR UPDATE OR DELETE ON reservations
FOR EACH ROW EXECUTE FUNCTION notify_changes();
```

**Frontend:**
```typescript
import io from 'socket.io-client';

const socket = io('wss://api.arara-azul.com');

socket.emit('subscribe', 'reservations_channel');

socket.on('database_change', (payload) => {
  console.log('Database changed:', payload);
  // Refresh data
  fetchReservations();
});
```

**Opção B: Pusher (Serviço gerenciado)**
```typescript
// Backend
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: 'APP_ID',
  key: 'KEY',
  secret: 'SECRET',
  cluster: 'us2'
});

// Trigger via PostgreSQL notify
pusher.trigger('reservations', 'update', {
  operation: 'UPDATE',
  record: newReservation
});

// Frontend
import Pusher from 'pusher-js';

const pusher = new Pusher('KEY', { cluster: 'us2' });
const channel = pusher.subscribe('reservations');

channel.bind('update', (data) => {
  console.log('Update:', data);
  fetchReservations();
});
```

### 4.5 Migração de Storage (1 semana)

**AWS S3:**
```typescript
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});

// Upload
const params = {
  Bucket: 'arara-azul-storage',
  Key: `receipts/${receiptId}.pdf`,
  Body: pdfBuffer,
  ACL: 'private'
};
await s3.upload(params).promise();

// Generate signed URL (similar to Supabase storage)
const signedUrl = s3.getSignedUrl('getObject', {
  Bucket: 'arara-azul-storage',
  Key: `receipts/${receiptId}.pdf`,
  Expires: 3600 // 1 hour
});
```

### 4.6 Migração de Edge Functions (1-2 semanas)

**AWS Lambda:**
```typescript
// create-user.ts (Lambda function)
import { APIGatewayProxyHandler } from 'aws-lambda';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.RDS_HOST,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  database: 'arara_azul'
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const { email, password, full_name, role } = JSON.parse(event.body);
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Insert user
  const result = await pool.query(
    'INSERT INTO users (email, password, full_name) VALUES ($1, $2, $3) RETURNING id',
    [email, hashedPassword, full_name]
  );
  
  // Insert role
  await pool.query(
    'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
    [result.rows[0].id, role]
  );
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, userId: result.rows[0].id })
  };
};
```

**Deploy via Serverless Framework:**
```yaml
# serverless.yml
service: arara-azul-functions

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    RDS_HOST: ${env:RDS_HOST}
    RDS_USER: ${env:RDS_USER}
    RDS_PASSWORD: ${env:RDS_PASSWORD}

functions:
  createUser:
    handler: functions/create-user.handler
    events:
      - httpApi:
          path: /create-user
          method: post
  
  deleteUser:
    handler: functions/delete-user.handler
    events:
      - httpApi:
          path: /delete-user
          method: post
  
  generateReceipt:
    handler: functions/generate-receipt-pdf.handler
    events:
      - httpApi:
          path: /generate-receipt
          method: post
  
  paymentWebhook:
    handler: functions/payment-webhook.handler
    events:
      - httpApi:
          path: /payment-webhook
          method: post
```

### 4.7 Atualizar Frontend (2-3 semanas)

**Substituir Supabase client:**
```typescript
// Antes (Supabase)
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase
  .from('reservations')
  .select('*')
  .order('created_at', { ascending: false });

// Depois (API REST + Axios)
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.arara-azul.com',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

const { data } = await api.get('/reservations?order=created_at.desc');
```

**Substituir realtime:**
```typescript
// Antes (Supabase)
const channel = supabase
  .channel('reservations-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
    fetchReservations();
  })
  .subscribe();

// Depois (Socket.io)
import io from 'socket.io-client';

const socket = io('wss://api.arara-azul.com');
socket.emit('subscribe', 'reservations');
socket.on('update', () => {
  fetchReservations();
});
```

### 4.8 Testes e Rollout (2-4 semanas)

**1. Testes de integração:**
- [ ] Todos endpoints funcionando
- [ ] Auth flow completo (signup, login, logout, refresh)
- [ ] Realtime updates funcionando
- [ ] Upload/download de arquivos
- [ ] Edge functions respondendo corretamente
- [ ] RLS policies funcionando (testar com diferentes roles)

**2. Testes de carga:**
```bash
# Usar k6 ou Artillery
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 100 }, // Ramp up to 100 users
    { duration: '10m', target: 100 }, // Stay at 100 users
    { duration: '5m', target: 0 }, // Ramp down to 0 users
  ],
};

export default function () {
  let response = http.get('https://api.arara-azul.com/reservations');
  check(response, { 'status was 200': (r) => r.status == 200 });
}
```

**3. Rollout gradual:**
- **Semana 1:** Deploy em staging, testes internos
- **Semana 2:** 10% dos usuários em produção (feature flag)
- **Semana 3:** 50% dos usuários
- **Semana 4:** 100% dos usuários

**4. Monitoramento pós-migração:**
- [ ] Latência de API < 200ms (p95)
- [ ] Taxa de erro < 0.1%
- [ ] Uptime > 99.9%
- [ ] Realtime updates com < 1s de delay
- [ ] Auth funcionando sem problemas

### 4.9 Custos Estimados (Pós-Migração)

**Infraestrutura AWS (exemplo):**
- RDS PostgreSQL (db.m5.large): $150/mês
- ElastiCache Redis (cache.m5.large): $100/mês
- S3 Storage (100 GB): $3/mês
- Lambda invocations (1M/mês): $0.20/mês
- API Gateway: $3.50/mês
- CloudWatch logs: $5/mês
- **Total infraestrutura: ~$260/mês**

**Serviços terceiros:**
- Auth0 (Developer plan): $0-23/mês
- Pusher (Startup plan): $49/mês
- **Total serviços: ~$50-70/mês**

**Total geral: $310-330/mês** vs **$25-299/mês Supabase**

**Break-even:** Apenas em escala muito alta (>100K usuários ativos/mês)

---

## 5. Conclusão e Próximos Passos

### 5.1 Decisão Final

**✅ Manter Supabase** para as fases 1-7 e futuras próximas.

**Razões:**
1. Todas funcionalidades críticas já implementadas (auth, realtime, audit, RLS)
2. Integração com Banco Caixa pode ser feita via Edge Functions
3. Custo 10x menor que alternativas no curto prazo
4. Time-to-market muito mais rápido
5. Sem necessidade de DevOps dedicado

### 5.2 Checklist de Revisão Semestral

**A cada 6 meses, avaliar:**
- [ ] Número de usuários ativos/mês
- [ ] Custo atual do Supabase vs projeção com managed Postgres
- [ ] Performance das queries (latência p95, p99)
- [ ] Requisitos de compliance novos
- [ ] Necessidade de features não suportadas pelo Supabase

### 5.3 Próximas Ações

**Imediato:**
- [x] Documentar decisão em `/docs/db-evaluation.md` ✅
- [ ] Configurar monitoring de custos no Supabase dashboard
- [ ] Configurar alertas de uso (80% do plano atual)

**Próximos 6 meses:**
- [ ] Revisar custos mensalmente
- [ ] Otimizar queries lentas (>500ms)
- [ ] Considerar read replicas se necessário (Supabase Team plan)

**Próximos 12 meses:**
- [ ] Avaliar upgrade para Supabase Team ou Enterprise se crescimento for alto
- [ ] Documentar plano de migração detalhado se decisão for mudar

---

## 6. Referências

**Supabase:**
- [Pricing](https://supabase.com/pricing)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)
- [Edge Functions](https://supabase.com/docs/guides/functions)

**Alternativas:**
- [AWS RDS Pricing](https://aws.amazon.com/rds/postgresql/pricing/)
- [Auth0 Pricing](https://auth0.com/pricing)
- [Pusher Pricing](https://pusher.com/channels/pricing)
- [PostgreSQL Official Docs](https://www.postgresql.org/docs/)

**Migração:**
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

---

**Última atualização:** 2025-11-12  
**Próxima revisão:** 2025-05-12 (6 meses)  
**Responsável:** Equipe de Desenvolvimento Amazon Arara Azul
