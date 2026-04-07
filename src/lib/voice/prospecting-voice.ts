/**
 * Preferências de tom de voz para mensagens de prospeção (conta / negócio).
 * Persistidas em `businesses.metadata.prospecting_voice`.
 */

export type ProspectingVoiceStyle = "friendly" | "professional" | "direct" | "consultive";

/** Como o remetente se posiciona na mensagem (pessoa e número em português). */
export type ProspectingVoiceAddressing =
  | "we"
  | "i"
  | "company_third"
  | "team_third";

export type ProspectingVoiceSettings = {
  style: ProspectingVoiceStyle;
  addressing: ProspectingVoiceAddressing;
  /** Instruções livres curtas (ex.: evitar gírias, mencionar certificação). */
  extra: string;
};

export const DEFAULT_PROSPECTING_VOICE: ProspectingVoiceSettings = {
  style: "professional",
  addressing: "we",
  extra: "",
};

/** Rótulos para selects em Configurações (PT-BR). */
export const PV_STYLE_OPTIONS: { value: ProspectingVoiceStyle; label: string }[] = [
  { value: "friendly", label: "Amigável — cordial e humano" },
  { value: "professional", label: "Profissional — claro e confiável (padrão B2B)" },
  { value: "direct", label: "Direto — objetivo, pouca enrolação" },
  { value: "consultive", label: "Consultivo — curioso, estilo especialista" },
];

export const PV_ADDRESSING_OPTIONS: { value: ProspectingVoiceAddressing; label: string }[] = [
  { value: "we", label: "Nós (1ª pessoa do plural) — ex.: “Nós ajudamos…”" },
  { value: "i", label: "Eu (1ª pessoa do singular) — ex.: “Eu trabalho com…”" },
  {
    value: "company_third",
    label: "A empresa (3ª pessoa) — ex.: “A [nome] oferece…”",
  },
  {
    value: "team_third",
    label: "A equipe (3ª pessoa) — ex.: “O time atende…”",
  },
];

const STYLES: ProspectingVoiceStyle[] = ["friendly", "professional", "direct", "consultive"];
const ADDRESSING: ProspectingVoiceAddressing[] = ["we", "i", "company_third", "team_third"];

function isStyle(x: string): x is ProspectingVoiceStyle {
  return STYLES.includes(x as ProspectingVoiceStyle);
}

function isAddressing(x: string): x is ProspectingVoiceAddressing {
  return ADDRESSING.includes(x as ProspectingVoiceAddressing);
}

export function parseProspectingVoice(raw: unknown): ProspectingVoiceSettings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_PROSPECTING_VOICE };
  }
  const o = raw as Record<string, unknown>;
  const style = typeof o.style === "string" && isStyle(o.style) ? o.style : DEFAULT_PROSPECTING_VOICE.style;
  const addressing =
    typeof o.addressing === "string" && isAddressing(o.addressing)
      ? o.addressing
      : DEFAULT_PROSPECTING_VOICE.addressing;
  const extra =
    typeof o.extra === "string" ? o.extra.trim().slice(0, 500) : DEFAULT_PROSPECTING_VOICE.extra;
  return { style, addressing, extra };
}

/** Lê de `business.metadata` ou objeto genérico. */
export function prospectingVoiceFromBusinessMetadata(metadata: unknown): ProspectingVoiceSettings {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return { ...DEFAULT_PROSPECTING_VOICE };
  }
  return parseProspectingVoice((metadata as Record<string, unknown>).prospecting_voice);
}

const STYLE_LABELS: Record<ProspectingVoiceStyle, string> = {
  friendly: "Amigável e próximo — cordial, humano, sem ser informal demais",
  professional: "Profissional e confiável — claro, respeitoso, B2B sólido",
  direct: "Direto e objetivo — vai ao ponto, pouca enrolação",
  consultive: "Consultivo — curioso, pergunta, posiciona como especialista",
};

const ADDRESSING_INSTRUCTIONS = (
  businessName: string
): Record<ProspectingVoiceAddressing, string> => ({
  we: "Use primeira pessoa do plural (nós, nosso, nos) como representante do time ou da empresa.",
  i: "Use primeira pessoa do singular (eu, meu, me) — um único contato humano.",
  company_third: `Fale da empresa em terceira pessoa (ex.: "A ${businessName} atua em...", "A empresa oferece..."). Não use "nós" como sujeito principal.`,
  team_third:
    "Use terceira pessoa focada no time ou na equipe (ex.: \"A equipe\", \"Os especialistas da empresa\"), evitando só \"eu\" ou só \"nós\".",
});

/**
 * Bloco em português para injetar em system/user prompts de prospeção.
 */
export function formatProspectingVoiceForPrompt(
  settings: ProspectingVoiceSettings,
  businessName: string
): string {
  const s = parseProspectingVoice(settings);
  const styleLine = STYLE_LABELS[s.style] ?? STYLE_LABELS.professional;
  const addrLine =
    ADDRESSING_INSTRUCTIONS(businessName)[s.addressing] ??
    ADDRESSING_INSTRUCTIONS(businessName).we;

  const parts = [
    "TOM DE VOZ DA CONTA (obrigatório seguir ao redigir mensagens de prospeção):",
    `- Estilo: ${styleLine}.`,
    `- Pessoa / foco: ${addrLine}`,
  ];
  if (s.extra) {
    parts.push(`- Observações adicionais do usuário: ${s.extra}`);
  }
  return parts.join("\n");
}

export function prospectingVoiceFromFormData(formData: FormData): ProspectingVoiceSettings {
  const styleRaw = (formData.get("pv_style") as string) || DEFAULT_PROSPECTING_VOICE.style;
  const addressingRaw =
    (formData.get("pv_addressing") as string) || DEFAULT_PROSPECTING_VOICE.addressing;
  const extraRaw = (formData.get("pv_extra") as string) || "";

  return {
    style: isStyle(styleRaw) ? styleRaw : DEFAULT_PROSPECTING_VOICE.style,
    addressing: isAddressing(addressingRaw) ? addressingRaw : DEFAULT_PROSPECTING_VOICE.addressing,
    extra: extraRaw.trim().slice(0, 500),
  };
}
