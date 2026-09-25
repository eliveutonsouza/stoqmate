"use server";

import { revalidatePath } from "next/cache";
import { checkImage, uploadPath } from "@/lib/image-upload";
import { createClient, getTenantId } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/mock";

function friendlyError(message: string) {
  if (message.includes("not authorized")) return "Seu perfil não tem permissão para concluir a configuração.";
  if (message.includes("nome da loja muito curto")) return "O nome da loja precisa ter pelo menos 2 caracteres.";
  if (message.includes("modo fiscal inválido")) return "Escolha uma opção de emissão fiscal válida.";
  return message;
}

export async function uploadStoreLogoAction(formData: FormData) {
  const file = formData.get("file");
  const checked = checkImage(file, 2);
  if ("error" in checked) return checked;

  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);
  const path = uploadPath(tenantId, checked.ext);

  const { error } = await supabase.storage.from("store-branding").upload(path, file as File);
  if (error) return { error: error.message };

  const { data } = supabase.storage.from("store-branding").getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function completeOnboardingAction(input: {
  storeName: string;
  logoUrl: string | null;
  brandColor: string;
  categoryIds: string[];
  fiscalMode: string;
}) {
  const supabase = await createClient();
  const templates = CATEGORIES.filter((c) => input.categoryIds.includes(c.id)).map((c) => ({
    name: c.name, code: c.code, icon: c.icon, color: c.color, unit: c.unit, unit_plural: c.unitPlural,
    attributes: c.attributes.map((a) => ({ key: a.key, label: a.label, type: a.type, values: a.values })),
  }));

  const { error } = await supabase.rpc("fn_complete_onboarding", {
    p_store_name: input.storeName,
    p_logo_url: input.logoUrl,
    p_brand_color: input.brandColor,
    p_fiscal_mode: input.fiscalMode,
    p_categories: templates,
  });
  if (error) return { error: friendlyError(error.message) };

  revalidatePath("/dashboard");
  revalidatePath("/categories");
  revalidatePath("/settings/branding");
  revalidatePath("/settings/store-data");
  return { ok: true };
}
