'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type SettingsSaveState =
  | null
  | { ok: true }
  | { ok: false; message: string };

/** Campo icp é jsonb: aceita JSON ou texto livre do textarea. */
function parseIcpField(raw: string): Record<string, unknown> {
  const t = raw?.trim() ?? "";
  if (!t) return {};
  try {
    const parsed = JSON.parse(t) as unknown;
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : { outline: t };
  } catch {
    return { outline: t };
  }
}

export async function saveBusinessSettings(
  _prev: SettingsSaveState,
  formData: FormData
): Promise<SettingsSaveState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "Não autorizado." };

  const name = (formData.get("name") as string)?.trim();
  const segment = (formData.get("segment") as string)?.trim();
  const website = (formData.get("website") as string)?.trim() || null;
  const icpRaw = formData.get("icp") as string;

  if (!name || !segment) {
    return { ok: false, message: "Nome e segmento são obrigatórios." };
  }

  const evolution_url = (formData.get("evolution_url") as string) || "";
  const evolution_key = (formData.get("evolution_key") as string) || "";
  const evolution_instance = (formData.get("evolution_instance") as string) || "";
  const resend_key = (formData.get("resend_key") as string) || "";

  const { data: currentBusiness, error: fetchErr } = await supabase
    .from("businesses")
    .select("metadata")
    .eq("user_id", user.id)
    .single();

  if (fetchErr) {
    console.error("saveBusinessSettings fetch:", fetchErr);
    return {
      ok: false,
      message:
        fetchErr.message ||
        "Não foi possível carregar os dados do negócio. Confirme se a coluna metadata existe (migração 20260330100000).",
    };
  }

  const metadata = (currentBusiness?.metadata && typeof currentBusiness.metadata === "object"
    ? currentBusiness.metadata
    : {}) as Record<string, unknown>;

  const updatedMetadata = {
    ...metadata,
    integrations: {
      evolution: {
        url: evolution_url,
        key: evolution_key,
        instance: evolution_instance,
      },
      resend: {
        key: resend_key,
      },
    },
  };

  const icpJson = parseIcpField(icpRaw);

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      segment,
      website,
      icp: icpJson,
      metadata: updatedMetadata,
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("saveBusinessSettings update:", error);
    return { ok: false, message: error.message || "Não foi possível salvar as alterações." };
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function saveProfileSettings(
  _prev: SettingsSaveState,
  formData: FormData
): Promise<SettingsSaveState> {
  const supabase = await createClient();

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;

  const { error } = await supabase.auth.updateUser({
    data: { full_name: `${firstName} ${lastName}` },
  });

  if (error) {
    console.error("saveProfileSettings:", error);
    return { ok: false, message: error.message || "Não foi possível atualizar o perfil." };
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function removeKnowledgeBaseItem(id: string, businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  try {
    const { error } = await supabase
      .from("knowledge_bases")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) throw error;
    
    return true;
  } catch (err) {
    console.error("Delete KB error:", err);
    return false;
  }
}
