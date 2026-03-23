import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useI18n } from "../lib/i18n";

export default function Success() {
  const { t } = useI18n();
  const [status, setStatus] = useState<
    "loading" | "confirmed" | "pending" | "missing" | "error"
  >("loading");

  useEffect(() => {
    const transactionId = localStorage.getItem("pending_transaction_id");
    if (!transactionId) {
      setStatus("missing");
      return;
    }

    const confirm = async () => {
      try {
        const response = await api.get("/api/confirm", {
          params: { transaction_id: transactionId },
        });
        const resultStatus = response.data?.data?.status;
        if (resultStatus === "moved") {
          localStorage.removeItem("pending_transaction_id");
          setStatus("confirmed");
          return;
        }
        if (resultStatus === "ignored") {
          setStatus("pending");
          return;
        }
        setStatus("error");
      } catch (err) {
        setStatus("error");
      }
    };

    confirm();
  }, []);

  return (
    <main className="container">
      <div className="success-card">
        <h1 className="section-title">
          {status === "confirmed"
            ? t("success.titleConfirmed")
            : t("success.titleDefault")}
        </h1>
        <p className="hero-text">
          {status === "loading" && t("success.text.loading")}
          {status === "confirmed" && t("success.text.confirmed")}
          {status === "pending" && t("success.text.pending")}
          {status === "missing" && t("success.text.missing")}
          {status === "error" && t("success.text.error")}
        </p>
        <Link className="cta" to="/">
          {t("success.backHome")}
        </Link>
      </div>
    </main>
  );
}
