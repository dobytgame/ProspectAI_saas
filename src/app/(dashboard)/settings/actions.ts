"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { removeKnowledgeStoragePaths } from "@/lib/knowledge/storage-upload";
import { revalidatePath } from "next/cache";
import { prospectingVoiceFromFormData } from "@/lib/voice/prospecting-voice";

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

  const prospecting_voice = prospectingVoiceFromFormData(formData);

  const updatedMetadata = {
    ...metadata,
    prospecting_voice,
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  try {
    const { data: row, error: fetchErr } = await supabase
      .from("knowledge_bases")
      .select("metadata")
      .eq("id", id)
      .eq("business_id", businessId)
      .single();

    if (fetchErr || !row) return false;

    const meta = row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : {};
    const bucket = typeof meta.storage_bucket === "string" ? meta.storage_bucket : "knowledge_base";
    const path = typeof meta.storage_path === "string" ? meta.storage_path : null;

    if (path) {
      try {
        const admin = createServiceRoleClient();
        await admin.storage.from(bucket).remove([path]);
      } catch (e) {
        console.error("removeKnowledgeBaseItem storage:", e);
      }
    }

    const { error } = await supabase.from("knowledge_bases").delete().eq("id", id).eq("business_id", businessId);

    if (error) throw error;

    return true;
  } catch (err) {
    console.error("Delete KB error:", err);
    return false;
  }
}

export async function deleteKnowledgeProfileAction(profileId: string, businessId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, message: "Não autorizado." };

  const { data: biz } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .eq("id", businessId)
    .single();

  if (!biz) return { ok: false as const, message: "Negócio não encontrado." };

  const { data: row, error: fetchErr } = await supabase
    .from("knowledge_profiles")
    .select("metadata")
    .eq("id", profileId)
    .eq("business_id", businessId)
    .single();

  if (fetchErr || !row) return { ok: false as const, message: "Perfil não encontrado." };

  const meta =
    row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {};
  const uploads = Array.isArray(meta.uploads) ? meta.uploads : [];
  const paths: string[] = [];
  for (const u of uploads) {
    if (u && typeof u === "object" && typeof (u as { storage_path?: string }).storage_path === "string") {
      paths.push((u as { storage_path: string }).storage_path);
    }
  }

  await removeKnowledgeStoragePaths(paths);

  const { error: delErr } = await supabase
    .from("knowledge_profiles")
    .delete()
    .eq("id", profileId)
    .eq("business_id", businessId);

  if (delErr) {
    console.error("deleteKnowledgeProfileAction:", delErr);
    return { ok: false as const, message: delErr.message || "Não foi possível excluir." };
  }

  revalidatePath("/settings");
  revalidatePath("/campanhas");
  return { ok: true as const };
}
