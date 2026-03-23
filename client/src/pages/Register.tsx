import { useState } from "react";
import api from "../lib/api";
import { useI18n } from "../lib/i18n";

type RegisterForm = {
  first_name: string;
  last_name: string;
  phone: string;
  age: string;
  city: string;
};

const initialForm: RegisterForm = {
  first_name: "",
  last_name: "",
  phone: "",
  age: "",
  city: "",
};

export default function Register() {
  const { t } = useI18n();
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [statusKey, setStatusKey] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusKey("register.status.payment");
    setError("");

    try {
      const response = await api.post("/api/register", {
        ...form,
        age: Number(form.age),
      });

      const paymentUrl = response.data?.payment_url;
      const transactionId = response.data?.transaction_id;
      if (!paymentUrl) {
        throw new Error(t("register.errors.paymentUnavailable"));
      }
      if (transactionId) {
        localStorage.setItem("pending_transaction_id", String(transactionId));
      }
      window.location.href = paymentUrl;
    } catch (err: unknown) {
      setStatusKey("");
      const responseError =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response
          ?.data?.error === "string"
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : null;
      const message =
        responseError ||
        (err instanceof Error ? err.message : t("register.errors.default"));
      setError(message);
    }
  };

  return (
    <main className="container">
      <div className="form-card">
        <h1 className="section-title">{t("register.title")}</h1>
        <p className="hero-text">{t("register.subtitle")}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="first_name">{t("register.fields.firstName")}</label>
              <input
                id="first_name"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="last_name">{t("register.fields.lastName")}</label>
              <input
                id="last_name"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="phone">{t("register.fields.phone")}</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="age">{t("register.fields.age")}</label>
              <input
                id="age"
                name="age"
                type="number"
                min="10"
                max="30"
                value={form.age}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="city">{t("register.fields.city")}</label>
              <input
                id="city"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="cta" type="submit">
              {t("register.submit")}
            </button>
            {statusKey && <span className="status">{t(statusKey)}</span>}
            {error && <span className="error">{error}</span>}
          </div>
        </form>
      </div>
    </main>
  );
}
