import { createServiceRoleClient } from "@/utils/supabase/service-role";

export const KNOWLEDGE_BUCKET = "knowledge_base";

export async function uploadKnowledgeAsset(args: {
  storagePrefix: string;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}): Promise<Record<string, unknown>> {
  const { storagePrefix, buffer, originalName, mimeType } = args;
  const safeName =
    originalName.replace(/[^\w.\-]+/g, "_").replace(/^\.+/, "").slice(0, 160) || "file";
  const storagePath = `${storagePrefix.replace(/\/+$/, "")}/${Date.now()}-${safeName}`;
  try {
    const admin = createServiceRoleClient();
    const { error } = await admin.storage.from(KNOWLEDGE_BUCKET).upload(storagePath, buffer, {
      contentType: mimeType || "application/octet-stream",
      upsert: false,
    });
    if (error) {
      console.error("knowledge storage upload:", error.message);
      return { storage_upload_error: error.message };
    }
    return {
      storage_path: storagePath,
      storage_bucket: KNOWLEDGE_BUCKET,
      original_filename: originalName,
      mime_type: mimeType,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("knowledge storage:", e);
    return { storage_upload_error: msg };
  }
}

export async function removeKnowledgeStoragePaths(paths: string[]): Promise<void> {
  if (!paths.length) return;
  try {
    const admin = createServiceRoleClient();
    await admin.storage.from(KNOWLEDGE_BUCKET).remove(paths);
  } catch (e) {
    console.error("removeKnowledgeStoragePaths:", e);
  }
}
