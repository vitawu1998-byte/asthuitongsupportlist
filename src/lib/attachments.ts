import { supabase } from "@/integrations/supabase/client";
import { uid, type Attachment } from "./mtss-data";

const BUCKET = "mtss-files";

export async function uploadAttachment(file: File, prefix: string): Promise<Attachment | null> {
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${prefix}/${Date.now()}-${uid()}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) {
    console.error("Upload failed:", error);
    return null;
  }
  return { id: uid(), name: file.name, path };
}

export async function openAttachment(a: Attachment) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(a.path, 60 * 60);
  if (error || !data) {
    console.error("Open attachment failed:", error);
    return;
  }
  window.open(data.signedUrl, "_blank", "noopener");
}

export async function removeAttachment(a: Attachment) {
  await supabase.storage.from(BUCKET).remove([a.path]);
}
