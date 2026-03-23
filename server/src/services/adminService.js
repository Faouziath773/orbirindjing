import { supabase } from "../lib/supabase.js";

function buildDatabaseError(message, error) {
  const err = new Error(message);
  if (error?.code) {
    err.code = error.code;
  }
  if (error?.message) {
    err.details = error.message;
  }
  return err;
}

export async function listAdminAccess() {
  const { data, error } = await supabase
    .from("admin_access")
    .select("id,name,code,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw buildDatabaseError("Erreur de lecture des admins.", error);
  }

  return data || [];
}

export async function createAdminAccess({ name, code }) {
  const { error } = await supabase.from("admin_access").insert({
    name: name || null,
    code,
  });

  if (error) {
    throw buildDatabaseError("Impossible de créer l'accès admin.", error);
  }
}

export async function deleteAdminAccess(id) {
  const { error } = await supabase.from("admin_access").delete().eq("id", id);

  if (error) {
    throw buildDatabaseError("Impossible de supprimer l'admin.", error);
  }
}

export async function hasAdminCode(code) {
  const { data, error } = await supabase
    .from("admin_access")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw buildDatabaseError("Erreur de vérification des admins.", error);
  }

  return Boolean(data);
}
