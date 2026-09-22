"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function inviteTeamMemberAction(input: {
  email: string;
  fullName: string;
  role: string;
}) {
  const supabase = await createClient();
  const { data: token, error } = await supabase.rpc("fn_team_invite", {
    p_email: input.email,
    p_full_name: input.fullName,
    p_role: input.role,
  });
  if (error) return { error: error.message };

  revalidatePath("/settings/users");
  return { ok: true, token: token as string };
}

export async function setTeamRoleAction(userId: string, role: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_team_set_role", { p_user_id: userId, p_role: role });
  if (error) return { error: error.message };

  revalidatePath("/settings/users");
  return { ok: true };
}

export async function removeTeamMemberAction(userId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_team_remove", { p_user_id: userId });
  if (error) return { error: error.message };

  revalidatePath("/settings/users");
  return { ok: true };
}

export async function cancelInviteAction(inviteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_team_cancel_invite", { p_invite_id: inviteId });
  if (error) return { error: error.message };

  revalidatePath("/settings/users");
  return { ok: true };
}
