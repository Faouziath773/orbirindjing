import { supabase } from "../lib/supabase.js";

function normalizeCurrency(transaction) {
  if (!transaction) return null;
  if (typeof transaction.currency === "string") {
    return transaction.currency;
  }
  if (transaction.currency && typeof transaction.currency.iso === "string") {
    return transaction.currency.iso;
  }
  if (transaction.currency_id === 1) {
    return "XOF";
  }
  return null;
}

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

export async function findCandidateByPhone(phone) {
  const { data, error } = await supabase
    .from("candidates")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    throw buildDatabaseError("Erreur de lecture des candidats.", error);
  }

  return data;
}

export async function findPendingByPhone(phone) {
  const { data, error } = await supabase
    .from("pending_registrations")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    throw buildDatabaseError("Erreur de lecture des pré-inscriptions.", error);
  }

  return data;
}

export async function createPendingRegistration(payload) {
  const { error } = await supabase
    .from("pending_registrations")
    .insert(payload);

  if (error) {
    throw buildDatabaseError("Impossible de créer la pré-inscription.", error);
  }
}

export async function getPendingByTransactionId(transactionId) {
  const { data, error } = await supabase
    .from("pending_registrations")
    .select("*")
    .eq("transaction_id", transactionId)
    .maybeSingle();

  if (error) {
    throw buildDatabaseError("Erreur de lecture de la transaction.", error);
  }

  return data;
}

export async function candidateExistsForTransaction({ phone, transactionId }) {
  const { data: byPhone, error: phoneError } = await supabase
    .from("candidates")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (phoneError) {
    throw buildDatabaseError("Erreur de vérification des doublons.", phoneError);
  }

  if (byPhone) {
    return true;
  }

  const { data: byTransaction, error: transactionError } = await supabase
    .from("candidates")
    .select("id")
    .eq("transaction_id", transactionId)
    .maybeSingle();

  if (transactionError) {
    throw buildDatabaseError(
      "Erreur de vérification des doublons.",
      transactionError
    );
  }

  return Boolean(byTransaction);
}

export async function createCandidateFromPending(pending, transactionId) {
  const { error } = await supabase.from("candidates").insert({
    photo: pending.photo,
    first_name: pending.first_name,
    last_name: pending.last_name,
    phone: pending.phone,
    email: pending.email,
    age: pending.age,
    city: pending.city,
    motivation: pending.motivation,
    transaction_id: transactionId,
  });

  if (error) {
    throw buildDatabaseError("Impossible de créer le candidat.", error);
  }
}

export async function deletePendingByTransactionId(transactionId) {
  const { error } = await supabase
    .from("pending_registrations")
    .delete()
    .eq("transaction_id", transactionId);

  if (error) {
    throw buildDatabaseError("Erreur de suppression de la pré-inscription.", error);
  }
}

export async function validatePendingRegistration(transactionId) {
  if (!transactionId) {
    return { status: "missing_transaction" };
  }

  const pending = await getPendingByTransactionId(transactionId);
  if (!pending) {
    return { status: "not_found" };
  }

  const exists = await candidateExistsForTransaction({
    phone: pending.phone,
    transactionId,
  });

  if (exists) {
    return { status: "duplicate" };
  }

  await createCandidateFromPending(pending, transactionId);
  await deletePendingByTransactionId(transactionId);

  return { status: "validated" };
}

export async function finalizeRegistration(transaction) {
  const transactionId = transaction?.id;
  if (!transactionId) {
    return { status: "missing_transaction" };
  }

  const verifiedStatus = transaction.status;
  const verifiedAmount = Number(transaction.amount);
  const verifiedCurrency = normalizeCurrency(transaction);

  if (
    verifiedStatus !== "approved" ||
    verifiedAmount !== 1000 ||
    verifiedCurrency !== "XOF"
  ) {
    return {
      status: "ignored",
      details: {
        status: verifiedStatus,
        amount: verifiedAmount,
        currency: verifiedCurrency,
      },
    };
  }

  const pending = await getPendingByTransactionId(transactionId);

  if (!pending) {
    return { status: "no_pending" };
  }

  const exists = await candidateExistsForTransaction({
    phone: pending.phone,
    transactionId,
  });

  if (!exists) {
    await createCandidateFromPending(pending, transactionId);
  }

  await deletePendingByTransactionId(transactionId);

  return { status: "moved" };
}
