import OpenAI from "openai";

/**
 * Cliente único OpenAI para o Capturo.
 * Requer OPENAI_API_KEY no ambiente.
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** Tarefas de maior qualidade: agente, scoring, chat assistente, ICP dinâmico, visão (PDF), mensagens pagas. */
export const OPENAI_MODEL_FLAGSHIP = "gpt-4o";

/** Respostas curtas e alto volume: plano free (saudações simples). */
export const OPENAI_MODEL_FAST = "gpt-4o-mini";
