# ProspectAI — Plano de Ação de Melhorias

> **Versão:** 1.0 | **Data:** Março 2026 | **Base:** Diagnóstico completo do codebase `src/`

---

## Visão Geral

O ProspectAI está com uma base técnica sólida — autenticação SSR, schema com RLS, Google Maps integrado, Kanban funcional e design system implementado. Este plano organiza as melhorias em 5 sprints progressivos, do mais urgente ao estratégico.

| Sprint | Foco | Prazo estimado | Status |
|--------|------|---------------|--------|
| 🔴 Sprint 1 | Bugs críticos & schema | 1–2 dias | **Urgente** |
| 🟠 Sprint 2 | Migração IA para Claude | 3–5 dias | Alta prioridade |
| 🟡 Sprint 3 | Prompts avançados & qualidade | 1 semana | Alta prioridade |
| 🟢 Sprint 4 | Canais de envio reais | 2 semanas | Média prioridade |
| 🔵 Sprint 5 | Monetização & crescimento | 3–4 semanas | Planejamento |

---

## Sprint 1 — Correções Críticas (1–2 dias)

> Sem esse sprint, metade do app quebra em produção.

### 1.1 Migration SQL — Tabela `campaigns` ausente

**Problema:** O código faz queries em `supabase.from("campaigns")` em 3 arquivos, mas a tabela não existe na migration.

**Arquivos afetados:**
- `src/app/(dashboard)/campanhas/actions.ts`
- `src/app/(dashboard)/campanhas/page.tsx`
- `src/app/(dashboard)/campanhas/[id]/actions.ts`

**Fix — adicionar ao Supabase SQL Editor:**

```sql
-- Tabela: campaigns
create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses on delete cascade not null,
  name text not null,
  description text,
  channel text not null default 'whatsapp', -- whatsapp, email
  status text default 'active', -- active, draft, paused
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.campaigns enable row level security;
create policy "Users can only access their own campaigns" on public.campaigns
  for all using (
    exists (
      select 1 from public.businesses
      where businesses.id = campaigns.business_id
      and businesses.user_id = auth.uid()
    )
  );

-- Campo campaign_id em leads (ausente no schema atual)
alter table public.leads
  add column if not exists campaign_id uuid references public.campaigns on delete set null;

-- Índice para performance
create index if not exists leads_campaign_id_idx on public.leads(campaign_id);
create index if not exists leads_business_id_idx on public.leads(business_id);
create index if not exists leads_score_idx on public.leads(score desc);

-- Campo website em businesses (mencionado no README como necessário)
alter table public.businesses
  add column if not exists website text;

-- Constraint UNIQUE em user_id para o upsert do onboarding funcionar
alter table public.businesses
  add constraint if not exists businesses_user_id_unique unique (user_id);
```

---

### 1.2 Bug — Scoring atualiza leads pelo nome (não pelo ID)

**Arquivo:** `src/app/(dashboard)/lead-actions.ts`

**Problema:**
```typescript
// ❌ ERRADO — pode atualizar múltiplos leads com mesmo nome
await supabase
  .from("leads")
  .update({ score: analysis.score, metadata: { ... } })
  .eq("name", lead.name)
  .eq("job_id", job.id);
```

**Fix:**
```typescript
// ✅ CORRETO — usa o ID único do lead
// Primeiro inserir e recuperar o ID:
const { data: insertedLead } = await supabase
  .from("leads")
  .insert(leadData)
  .select("id")
  .single();

// Depois atualizar pelo ID:
await supabase
  .from("leads")
  .update({
    score: analysis.score,
    metadata: { ...leadData.metadata, reasoning: analysis.reasoning }
  })
  .eq("id", insertedLead.id);
```

---

### 1.3 Bug — Import incorreto do `pdf-parse`

**Arquivo:** `src/app/(dashboard)/onboarding/actions.ts`

**Problema:**
```typescript
// ❌ ERRADO — módulo usa default export
import { PDFParse } from "pdf-parse";
```

**Fix:**
```typescript
// ✅ CORRETO
import pdfParse from "pdf-parse";

// Uso:
const result = await pdfParse(buffer);
const text = result.text;
```

---

### 1.4 Enriquecimento incompleto de leads

**Arquivo:** `src/app/(dashboard)/lead-actions.ts`

**Problema:** Apenas os 15 primeiros leads são enriquecidos com phone/website, mas todos são inseridos no banco.

**Fix:**
```typescript
// Enriquecer todos (com rate limiting para não exceder cota da API)
const enrichedPlaces = await Promise.all(
  places.map(async (place: any, index: number) => {
    // Delay progressivo para respeitar rate limits da Places API
    await new Promise(resolve => setTimeout(resolve, index * 100));
    try {
      const details = await getPlaceDetails(place.place_id);
      return {
        ...place,
        phone: details?.formatted_phone_number || null,
        website: details?.website || null,
      };
    } catch {
      return { ...place, phone: null, website: null };
    }
  })
);
```

---

## Sprint 2 — Migração Total para Claude (3–5 dias)

> O SDK da Anthropic já está instalado e a `CLAUDE_API_KEY` configurada. Consolidar em 1 SDK.

### 2.1 Atualizar modelo em `claude.ts`

```typescript
// ❌ Modelo desatualizado
model: "claude-3-5-sonnet-20240620"

// ✅ Modelo atual
model: "claude-sonnet-4-5"
```

### 2.2 Adicionar `generateOutreachMessage()` em `claude.ts`

```typescript
export async function generateOutreachMessage(
  lead: any,
  business: any,
  campaign: any
) {
  const isWhatsApp = campaign.channel === 'whatsapp';

  const prompt = `Você é ${business.name}, uma empresa de ${business.segment}.
Tom de voz: ${business.tone}
ICP: ${JSON.stringify(business.icp)}

Escreva uma mensagem de PRIMEIRO contato para o lead abaixo.
Canal: ${campaign.channel.toUpperCase()}
Campanha: ${campaign.name} — ${campaign.description}

LEAD:
- Nome: ${lead.name}
- Endereço: ${lead.address}
- Avaliação Google: ${lead.metadata?.rating || 'N/A'} estrelas
- Score de qualificação: ${lead.score}/100
- Por que é um bom lead: ${lead.metadata?.reasoning || ''}
${lead.phone ? `- Telefone: ${lead.phone}` : ''}
${lead.website ? `- Website: ${lead.website}` : ''}

REGRAS ABSOLUTAS:
- ${isWhatsApp ? 'Máximo 3 parágrafos curtos, tom amigável, sem markdown' : 'Inclua ASSUNTO: na primeira linha, máximo 4 parágrafos'}
- Primeira frase deve mencionar algo específico sobre o negócio ou localização
- Nunca use: "espero que esteja bem", "venho por meio desta"
- Nunca mencione automação ou IA
- Termine com: ${business.name}

Escreva APENAS a mensagem final, sem comentários.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type === "text") return content.text;
  throw new Error("Falha ao gerar mensagem de abordagem.");
}
```

### 2.3 Migrar `/api/chat/route.ts` para Anthropic SDK

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

export async function POST(req: Request) {
  // ... buscar lead e business igual ao atual ...

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1000,
    system: systemPrompt, // mesmo system prompt atual
    messages: [{ role: "user", content: message }],
  });

  const reply = response.content[0].type === "text"
    ? response.content[0].text
    : "Não consegui gerar uma resposta.";

  return NextResponse.json({ reply });
}
```

### 2.4 Remover dependências desnecessárias

```bash
# Remover Gemini (não usado em nenhuma rota)
npm uninstall @google/generative-ai

# Remover OpenAI (após migração completa)
npm uninstall openai

# Limpar src/lib/ai/gemini.ts
rm src/lib/ai/gemini.ts
```

**Atualizar todos os imports de `openai` para `claude`:**

| Arquivo | Import atual | Import novo |
|---------|-------------|-------------|
| `onboarding/actions.ts` | `from "@/lib/ai/openai"` | `from "@/lib/ai/claude"` |
| `lead-actions.ts` | `from "@/lib/ai/openai"` | `from "@/lib/ai/claude"` |
| `campanhas/[id]/actions.ts` | `from "@/lib/ai/openai"` | `from "@/lib/ai/claude"` |
| `api/chat/route.ts` | `import OpenAI from "openai"` | `import Anthropic from "@anthropic-ai/sdk"` |

---

## Sprint 3 — Prompts Avançados & Qualidade (1 semana)

### 3.1 Prompt de Treinamento do Agente (Agent Training)

Substituir o prompt simples do onboarding por uma versão estruturada que retorna JSON rico:

```typescript
// src/lib/ai/claude.ts — nova função
export async function trainAgent(businessData: {
  name: string;
  description: string;
  services: string;
  targetAudience: string;
  differentials: string;
  tone: string;
  extraContext?: string;
}) {
  const prompt = `Você é um especialista em estratégia de vendas B2B.
Analise o perfil do negócio abaixo e configure um agente de prospecção de alta performance.

PERFIL:
Nome: ${businessData.name}
Descrição: ${businessData.description}
Serviços: ${businessData.services}
Público-alvo: ${businessData.targetAudience}
Diferenciais: ${businessData.differentials}
Tom: ${businessData.tone}
${businessData.extraContext ? `Contexto adicional:\n${businessData.extraContext}` : ''}

Retorne EXCLUSIVAMENTE JSON válido:
{
  "icp": {
    "target_audience": "string",
    "pain_points": ["string"],
    "solution_value": "string",
    "ideal_segments": ["string"],
    "disqualifiers": ["string"]
  },
  "suggested_tone": "string",
  "niche": "string",
  "approach_angles": ["string"],
  "scoring_criteria": {
    "must_have": ["string"],
    "nice_to_have": ["string"],
    "red_flags": ["string"]
  }
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type === "text") {
    const clean = content.text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  }
  throw new Error("Falha ao treinar agente.");
}
```

### 3.2 Prompt de Scoring Detalhado

```typescript
export async function scoreLead(leadData: any, businessICP: any) {
  const prompt = `Avalie o fit deste lead com o ICP do negócio. Score de 0-100.

ICP: ${JSON.stringify(businessICP)}

LEAD:
- Nome: ${leadData.name}
- Categorias: ${JSON.stringify(leadData.metadata?.types || [])}
- Avaliação: ${leadData.metadata?.rating || 'N/A'}/5
- Endereço: ${leadData.address}
- Tem website: ${leadData.website ? 'Sim' : 'Não'}
- Tem telefone: ${leadData.phone ? 'Sim' : 'Não'}

Critérios:
- 0-30: Desalinhado (nicho errado ou disqualifier presente)
- 31-60: Parcial (nicho correto mas fatores negativos)
- 61-85: Bom fit (nicho e perfil batem com ICP)
- 86-100: Lead perfeito (todos os must_have presentes)

Retorne APENAS JSON:
{
  "score": number,
  "tier": "A|B|C|D",
  "reasoning": "string curto em português",
  "fit_reasons": ["até 3 pontos positivos"],
  "concerns": ["até 2 pontos de atenção"],
  "priority": "high|medium|low"
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type === "text") {
    const clean = content.text.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(clean);
    } catch {
      return { score: 50, tier: "C", reasoning: "Falha na análise automática.", fit_reasons: [], concerns: [], priority: "medium" };
    }
  }
  return { score: 0, tier: "D", reasoning: "Erro na comunicação com IA.", fit_reasons: [], concerns: [], priority: "low" };
}
```

### 3.3 Análise de Resposta do Lead

```typescript
// Nova função — executada quando o lead responde
export async function analyzeLeadResponse(
  sentMessage: string,
  leadResponse: string,
  leadData: any,
  currentStage: string
) {
  const prompt = `Um lead respondeu à nossa mensagem de prospecção. Analise e defina o próximo passo.

MENSAGEM ENVIADA:
${sentMessage}

RESPOSTA DO LEAD:
${leadResponse}

CONTEXTO:
- Lead: ${leadData.name}
- Estágio atual: ${currentStage}
- Score: ${leadData.score}/100

Retorne APENAS JSON:
{
  "sentiment": "positive|neutral|negative|objection|interested|not_now",
  "intent": "resumo em uma linha do que o lead quer",
  "recommended_action": "schedule_call|send_info|follow_up|close|disqualify",
  "next_message": "sugestão de resposta para enviar",
  "move_to_stage": "contacted|interested|negotiating|closed|null",
  "urgency": "high|medium|low",
  "notes": "observações para o vendedor"
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type === "text") {
    const clean = content.text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  }
  throw new Error("Falha ao analisar resposta.");
}
```

### 3.4 Melhorar onboarding — campos adicionais

Adicionar ao formulário de onboarding (`src/app/(dashboard)/onboarding/page.tsx`):

- Campo **Serviços/Produtos** (textarea separado da descrição)
- Campo **Diferenciais** (o que te torna único)
- Campo **Ticket médio** (ajuda a calibrar ICP)
- Seletor de **Tom de Comunicação** (Profissional / Amigável / Consultivo / Direto)

---

## Sprint 4 — Canais de Envio Reais (2 semanas)

### 4.1 WhatsApp via Evolution API

**Setup inicial:**

```bash
# Instalar dependências
npm install axios

# Variáveis de ambiente necessárias (.env.local)
EVOLUTION_API_URL=https://sua-instancia.evolution-api.com
EVOLUTION_API_KEY=sua_chave_aqui
EVOLUTION_INSTANCE_NAME=prospectai
```

**Criar `src/lib/channels/whatsapp.ts`:**

```typescript
import axios from "axios";

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME;

export async function sendWhatsAppMessage(phone: string, message: string) {
  // Limpar número — só dígitos
  const cleanPhone = phone.replace(/\D/g, "");
  // Garantir DDI Brasil se não tiver
  const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

  const response = await axios.post(
    `${EVOLUTION_URL}/message/sendText/${INSTANCE}`,
    {
      number: fullPhone,
      textMessage: { text: message },
      options: { delay: 1200, presence: "composing" },
    },
    {
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_KEY,
      },
    }
  );

  return response.data;
}

export async function getWhatsAppStatus(instanceName: string) {
  const response = await axios.get(
    `${EVOLUTION_URL}/instance/connectionState/${instanceName}`,
    { headers: { apikey: EVOLUTION_KEY } }
  );
  return response.data;
}
```

**Criar API route `src/app/api/send-whatsapp/route.ts`:**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sendWhatsAppMessage } from "@/lib/channels/whatsapp";

export async function POST(req: Request) {
  try {
    const { leadId, message } = await req.json();
    const supabase = await createClient();

    const { data: lead } = await supabase
      .from("leads")
      .select("*, businesses(*)")
      .eq("id", leadId)
      .single();

    if (!lead?.phone) {
      return NextResponse.json({ error: "Lead sem telefone" }, { status: 400 });
    }

    await sendWhatsAppMessage(lead.phone, message);

    // Registrar envio
    await supabase.from("lead_messages").insert({
      lead_id: leadId,
      channel: "whatsapp",
      content: message,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    await supabase.from("leads").update({ status: "contacted" }).eq("id", leadId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return NextResponse.json({ error: "Falha no envio" }, { status: 500 });
  }
}
```

### 4.2 E-mail via Resend

```bash
npm install resend @react-email/components
```

**Criar `src/lib/channels/email.ts`:**

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendProspectEmail(
  to: string,
  subject: string,
  body: string,
  fromName: string,
  fromEmail: string
) {
  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${body.split("\n").map(p => `<p style="margin: 0 0 16px; line-height: 1.6;">${p}</p>`).join("")}
      </div>
    `,
    text: body,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}
```

**Variáveis necessárias:**

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=prospectai@seudominio.com
```

### 4.3 Atualizar `CampaignLeadsList.tsx` — envio real

Substituir o link `wa.me` por chamada à API route:

```typescript
const handleSendWhatsApp = async (lead: any, message: string) => {
  setIsSending(lead.id);
  try {
    const res = await fetch("/api/send-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id, message }),
    });
    if (res.ok) {
      await handleMarkContacted(lead.id);
      // toast de sucesso
    }
  } catch (err) {
    console.error("Envio falhou:", err);
  } finally {
    setIsSending(null);
  }
};
```

---

## Sprint 5 — Monetização & Crescimento (3–4 semanas)

### 5.1 Landing Page Premium

**Seções a adicionar em `src/app/page.tsx`:**

- **Hero:** headline impactante + vídeo/GIF do produto em ação
- **Social Proof:** "X leads gerados", logos de clientes (mockup)
- **Como funciona:** 3 passos animados (Cadastre → Prospecte → Feche)
- **Features:** cards detalhados de cada funcionalidade
- **Preços:** 3 planos com comparativo
- **FAQ:** perguntas frequentes
- **CTA final:** urgência + garantia

**Estrutura de preços sugerida:**

| Plano | Preço | Leads/mês | Mensagens | IA |
|-------|-------|-----------|-----------|-----|
| Starter | R$ 97/mês | 100 | WhatsApp manual | Scoring básico |
| Pro | R$ 197/mês | 500 | WhatsApp + Email | Scoring + Mensagens IA |
| Business | R$ 397/mês | Ilimitado | Tudo | Todos os agentes |

### 5.2 Integração Stripe

```bash
npm install stripe @stripe/stripe-js
```

**Variáveis:**

```env
STRIPE_SECRET_KEY=sk_live_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxx
STRIPE_PRO_PRICE_ID=price_xxxx
STRIPE_BUSINESS_PRICE_ID=price_xxxx
```

**Migration adicional:**

```sql
alter table public.businesses
  add column if not exists stripe_customer_id text,
  add column if not exists plan text default 'free', -- free, starter, pro, business
  add column if not exists plan_expires_at timestamp with time zone,
  add column if not exists leads_used_this_month integer default 0;
```

### 5.3 Dashboard Analytics Completo

**Métricas a implementar:**

```typescript
// src/app/(dashboard)/dashboard/page.tsx — adicionar queries
const { data: stats } = await supabase
  .rpc("get_dashboard_stats", { p_business_id: business.id });
```

**Função SQL:**

```sql
create or replace function get_dashboard_stats(p_business_id uuid)
returns json as $$
  select json_build_object(
    'total_leads', count(*),
    'qualified_leads', count(*) filter (where score >= 70),
    'contacted_leads', count(*) filter (where status = 'contacted'),
    'interested_leads', count(*) filter (where status = 'interested'),
    'closed_leads', count(*) filter (where status = 'closed'),
    'avg_score', round(avg(score)::numeric, 1),
    'conversion_rate', round(
      (count(*) filter (where status in ('interested','closed'))::decimal /
       nullif(count(*) filter (where status = 'contacted'), 0) * 100)::numeric, 1
    )
  )
  from public.leads
  where business_id = p_business_id
$$ language sql security definer;
```

---

## Variáveis de Ambiente — Checklist Completo

Criar/atualizar `.env.local` com:

```env
# Supabase (já configurado)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic — SDK já instalado, usar esta chave
CLAUDE_API_KEY=sk-ant-xxxx

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_API_KEY=

# WhatsApp (Evolution API)
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE_NAME=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Stripe (Sprint 5)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_BUSINESS_PRICE_ID=

# Remover após migração completa:
# OPENAI_API_KEY= (não mais necessário)
# GEMINI_API_KEY= (não mais necessário)
```

---

## Resumo de Arquivos a Criar/Modificar

### Novos arquivos
- `src/lib/channels/whatsapp.ts` — integração Evolution API
- `src/lib/channels/email.ts` — integração Resend
- `src/app/api/send-whatsapp/route.ts` — API route de envio
- `src/app/api/send-email/route.ts` — API route de e-mail
- `supabase/migrations/20260324000000_add_campaigns.sql` — fix crítico

### Arquivos a modificar
- `src/lib/ai/claude.ts` — modelo atualizado + novas funções
- `src/app/(dashboard)/onboarding/actions.ts` — fix pdf-parse + novos campos
- `src/app/(dashboard)/lead-actions.ts` — fix scoring por ID + enriquecimento completo
- `src/app/api/chat/route.ts` — migrar de OpenAI para Anthropic SDK
- `src/app/(dashboard)/campanhas/[id]/actions.ts` — usar claude.ts
- `src/components/CampaignLeadsList.tsx` — envio real via API route

### Arquivos a deletar
- `src/lib/ai/gemini.ts` — não usado
- `src/lib/ai/openai.ts` — após migração completa

---

## Critérios de Conclusão por Sprint

### Sprint 1 ✅
- [ ] Migration executada no Supabase sem erros
- [ ] Página de campanhas carrega sem erro 42P01
- [ ] Onboarding com PDF funciona
- [ ] Leads atualizados por ID (verificar no banco)

### Sprint 2 ✅
- [ ] Nenhum import de `openai` no codebase
- [ ] `@google/generative-ai` removido do `package.json`
- [ ] Chat usa Anthropic SDK com sucesso
- [ ] Scoring e geração de mensagens funcionando com Claude

### Sprint 3 ✅
- [ ] Prompt de treinamento retorna JSON rico com scoring_criteria
- [ ] Score inclui tier (A/B/C/D) e reasoning detalhado
- [ ] Função de análise de resposta implementada
- [ ] Onboarding com campos adicionais funcionando

### Sprint 4 ✅
- [ ] WhatsApp envia mensagem real (testar com número próprio)
- [ ] Mensagem registrada em `lead_messages`
- [ ] Status do lead atualiza para `contacted` após envio
- [ ] E-mail chega na caixa de entrada (verificar spam score)

### Sprint 5 ✅
- [ ] Landing page com seção de preços publicada
- [ ] Stripe checkout funcionando em modo teste
- [ ] Dashboard mostra métricas de funil
- [ ] Conversion rate calculado corretamente

---

*Documento gerado em Março 2026 — ProspectAI v0.1 → v1.0*
