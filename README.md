# ProspectAI 🚀🤖

**ProspectAI** is a premium, AI-powered lead discovery and outreach automation platform. It transforms how businesses find and approach customers by combining Google Maps data with GPT-4o intelligence to score leads and write personalized sales pitches.

## ✨ Principais Funcionalidades

- **Onboarding Inteligente:** Extração automática do perfil do negócio a partir de URLs ou documentos (PDF/TXT).
- **Descoberta com IA:** Busca de estabelecimentos via Google Maps com geocodificação e filtragem avançada.
- **Lead Scoring Dinâmico:** Cada lead recebe uma nota (0-100) baseada no **ICP (Ideal Customer Profile)** configurado.
- **Gestão de Campanhas:** Agrupamento de leads por objetivo, canal (WhatsApp/Email) e status.
- **Outreach com IA:** Geração de scripts de vendas personalizados e envio direto via integração WhatsApp.
- **Pipeline Kanban:** Visualização clara do funil de vendas (Abertos, Contatados, Interessados, Fechados).
- **Dashboard Interativo:** Mapa de calor de leads e estatísticas de performance em tempo real.

## 🛠️ Stack Tecnológica

- **Core:** Next.js (App Router, Server Actions, Turbopack)
- **Banco de Dados:** Supabase (Auth, Postgres, RLS)
- **IA:** OpenAI API (GPT-4o-mini)
- **Maps:** Google Maps Places SDK & Geocoding API
- **UI:** Tailwind CSS, shadcn/ui, Lucide Icons

## 🚀 Como Iniciar

1. **Configuração de Env:**
   - Preencha as chaves no `.env.local` (Supabase, OpenAI, Google Maps).
2. **Setup do Banco:**
   - Execute as migrações em `supabase/migrations`.
   - **IMPORTANTE:** Rode o SQL `ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS website TEXT;` no seu painel Supabase.
3. **Instalação:**
   ```bash
   npm install
   npm run dev
   ```

## 📂 Estrutura do Projeto

- `src/app`: Rotas e lógica de páginas (Dashboard, Campanhas, Onboarding).
- `src/components`: UI modular (Mapa, Kanban, Formulários).
- `src/lib/ai`: Lógica de integração com modelos de linguagem.
- `supabase/migrations`: SQL de estrutura do banco.

---
Desenvolvido com ❤️ e IA para ProspectAI.
