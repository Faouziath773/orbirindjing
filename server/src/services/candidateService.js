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

function startOfDayIso() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export async function healthCheck() {
  const { error } = await supabase
    .from("candidates")
    .select("id")
    .limit(1);

  if (error) {
    throw buildDatabaseError("Connexion base de données indisponible.", error);
  }
}

export async function testDatabaseConnection() {
  const { data, error } = await supabase.from("candidates").select("*");

  if (error) {
    throw buildDatabaseError("Erreur de connexion Supabase.", error);
  }

  return data || [];
}

export async function listCandidates({ search } = {}) {
  let query = supabase.from("candidates").select("*").order("created_at", {
    ascending: false,
  });

  if (search) {
    const sanitized = search.replace(/[%_]/g, "\\$&").replace(/,/g, "\\,");
    query = query.or(
      `first_name.ilike.%${sanitized}%,last_name.ilike.%${sanitized}%,phone.ilike.%${sanitized}%,city.ilike.%${sanitized}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw buildDatabaseError("Erreur de lecture des candidats.", error);
  }

  return data || [];
}

export async function getCandidateStats() {
  const { count: totalCount, error: totalError } = await supabase
    .from("candidates")
    .select("*", { count: "exact", head: true });

  if (totalError) {
    throw buildDatabaseError("Erreur de calcul des statistiques.", totalError);
  }

  const { count: todayCount, error: todayError } = await supabase
    .from("candidates")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfDayIso());

  if (todayError) {
    throw buildDatabaseError("Erreur de calcul des statistiques.", todayError);
  }

  const { data: ages, error: ageError } = await supabase
    .from("candidates")
    .select("age");

  if (ageError) {
    throw buildDatabaseError("Erreur de calcul des statistiques.", ageError);
  }

  const ageValues = (ages || [])
    .map((row) => Number(row.age))
    .filter((value) => Number.isFinite(value));
  const averageAge =
    ageValues.length > 0
      ? (ageValues.reduce((sum, value) => sum + value, 0) / ageValues.length)
          .toFixed(1)
      : "0";

  const { data: cities, error: cityError } = await supabase
    .from("candidates")
    .select("city");

  if (cityError) {
    throw buildDatabaseError("Erreur de calcul des statistiques.", cityError);
  }

  const counts = new Map();
  for (const row of cities || []) {
    const city = String(row.city || "").trim();
    if (!city) continue;
    counts.set(city, (counts.get(city) || 0) + 1);
  }

  const topCities = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([city, total]) => ({ city, total }));

  return {
    total: totalCount || 0,
    today: todayCount || 0,
    average_age: averageAge,
    top_cities: topCities,
  };
}
