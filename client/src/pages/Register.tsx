import { useState } from "react";
import api from "../lib/api";

type RegisterForm = {
  photo: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  age: string;
  city: string;
  motivation: string;
};

const initialForm: RegisterForm = {
  photo: "",
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  age: "",
  city: "",
  motivation: "",
};

export default function Register() {
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resizeImage = (file: File, maxSize = 900, quality = 0.75) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const ratio = Math.min(
            1,
            maxSize / img.width,
            maxSize / img.height
          );
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas indisponible"));
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => reject(new Error("Image invalide"));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error("Lecture impossible"));
      reader.readAsDataURL(file);
    });

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      setStatus("Optimisation de la photo...");
      const optimized = await resizeImage(file);
      setForm((prev) => ({ ...prev, photo: optimized }));
      setStatus("");
    } catch (err: unknown) {
      setStatus("");
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de traiter la photo."
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("Création du paiement...");
    setError("");

    try {
      const response = await api.post("/api/register", {
        ...form,
        age: Number(form.age),
      });

      const paymentUrl = response.data?.payment_url;
      const transactionId = response.data?.transaction_id;
      if (!paymentUrl) {
        throw new Error("Paiement indisponible");
      }
      if (transactionId) {
        localStorage.setItem("pending_transaction_id", String(transactionId));
      }
      window.location.href = paymentUrl;
    } catch (err: unknown) {
      setStatus("");
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
        (err instanceof Error ? err.message : "Erreur lors de l'inscription.");
      setError(message);
    }
  };

  const preview = form.photo ? (
    <img src={form.photo} alt="Aperçu" />
  ) : (
    <p>Ajoute une photo pour ton profil DJ.</p>
  );

  return (
    <main className="container">
      <div className="form-card">
        <h1 className="section-title">Inscription au programme DJ</h1>
        <p className="hero-text">
          Les inscriptions sont validées uniquement après paiement de 1000 FCFA.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="photo">Photo *</label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                required
              />
              <div className="info-card">{preview}</div>
            </div>
            <div className="field">
              <label htmlFor="first_name">Prénom *</label>
              <input
                id="first_name"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="last_name">Nom *</label>
              <input
                id="last_name"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Téléphone *</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div className="field">
              <label htmlFor="age">Âge *</label>
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
              <label htmlFor="city">Ville *</label>
              <input
                id="city"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="motivation">Motivation</label>
              <textarea
                id="motivation"
                name="motivation"
                value={form.motivation}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="cta" type="submit">
              Continuer vers le paiement
            </button>
            {status && <span className="status">{status}</span>}
            {error && <span className="error">{error}</span>}
          </div>
        </form>
      </div>
    </main>
  );
}
