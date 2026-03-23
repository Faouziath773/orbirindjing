import { supabase } from "../src/lib/supabase.js";

export async function cleanupTestData(prefix = "test_") {
  await supabase.from("candidates").delete().like("transaction_id", `${prefix}%`);
  await supabase
    .from("pending_registrations")
    .delete()
    .like("transaction_id", `${prefix}%`);
}

export function buildTestPayload(overrides = {}) {
  return {
    first_name: "Test",
    last_name: "User",
    phone: `+229${Math.floor(Math.random() * 1e8)
      .toString()
      .padStart(8, "0")}`,
    age: 22,
    city: "Cotonou",
    ...overrides,
  };
}
