import type { Metadata } from "next";
import { LandingPageClient } from "@/components/landing/LandingPageClient";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://capturo.com.br";

const title = "Prospecção IA, Google Maps e WhatsApp";
const titleSocial =
  "Capturo — Prospecção com IA, Google Maps e WhatsApp";
const description =
  "Encontre estabelecimentos no Google Maps, qualifique leads com IA (GPT-4o), gere mensagens personalizadas e acompanhe tudo no pipeline. Comece grátis com 100 leads/mês.";

const faqForJsonLd = [
  {
    q: "Como a IA aprende sobre o meu negócio?",
    a: "No onboarding você descreve seus serviços, público-alvo e diferenciais. Pode também colar a URL do seu site ou fazer upload de um PDF. A IA (OpenAI GPT-4o) processa tudo e cria um perfil de ICP estruturado que guia toda a prospecção.",
  },
  {
    q: "O WhatsApp não vai ser bloqueado?",
    a: "O Capturo integra com Evolution API usando envio humanizado — delays variáveis entre mensagens e simulação de digitação. Cada mensagem é única e personalizada, o que reduz o risco de banimento. Recomendamos usar um número dedicado à prospecção.",
  },
  {
    q: "Os dados do Google Maps são confiáveis?",
    a: "Usamos a Google Places API (a mesma base do Google Maps), atualizada em tempo real. Cada lead pode incluir nome, endereço, telefone, avaliação, reviews e website quando disponível.",
  },
  {
    q: "Posso usar para qualquer nicho?",
    a: "Sim, para segmentos com estabelecimentos no Google Maps — restaurantes, clínicas, academias, escritórios, lojas, hotéis e outros. O ICP é customizável para o seu negócio.",
  },
  {
    q: "Preciso saber programar para usar?",
    a: "Não. A configuração é feita por interface. O setup das chaves de API (Google Maps e WhatsApp) leva cerca de 15 minutos com guia em português.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Capturo",
      description,
      inLanguage: "pt-BR",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Capturo",
      url: siteUrl,
      description:
        "Plataforma brasileira de prospecção B2B com IA, Google Maps e WhatsApp.",
    },
    {
      "@type": "SoftwareApplication",
      name: "Capturo",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "BRL",
        description: "Plano Free com 100 leads/mês",
      },
      description,
    },
    {
      "@type": "FAQPage",
      mainEntity: faqForJsonLd.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords: [
    "prospecção B2B",
    "Google Maps leads",
    "WhatsApp vendas",
    "IA vendas",
    "Capturo",
    "prospecção automática",
    "CRM leads",
  ],
  authors: [{ name: "Capturo" }],
  creator: "Capturo",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Capturo",
    title: titleSocial,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: titleSocial,
    description,
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageClient />
    </>
  );
}
