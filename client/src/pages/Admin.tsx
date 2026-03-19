import { useEffect, useState } from "react";
import api from "../lib/api";

type Candidate = {
  id: number;
  photo: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  age: number;
  city: string;
  motivation: string | null;
  transaction_id: string;
  created_at: string;
};

type AdminStats = {
  total: number;
  today: number;
  average_age: string;
  top_cities: { city: string; total: number }[];
};

type AdminTab = "candidates" | "stats" | "settings";

export default function Admin() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Chargement...");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [isAllowed, setIsAllowed] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("candidates");
  const [autoRefresh, setAutoRefresh] = useState(() => {
    return localStorage.getItem("admin_auto_refresh") !== "off";
  });
  const [lastSync, setLastSync] = useState<{
    candidates?: string;
    stats?: string;
  }>({});
  const requiredCode = import.meta.env.VITE_ADMIN_CODE as string | undefined;
  const apiBase =
    (api.defaults.baseURL ? String(api.defaults.baseURL) : "").trim() ||
    "http://localhost:4000";

  const loadCandidates = async (query = "") => {
    setStatus("Chargement...");
    try {
      const response = await api.get("/api/admin/candidates", {
        params: query ? { search: query } : undefined,
      });
      setCandidates(response.data?.data || []);
      setStatus("");
      setLastSync((prev) => ({ ...prev, candidates: new Date().toISOString() }));
    } catch (error) {
      setStatus("Impossible de charger les données.");
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get("/api/admin/stats");
      setStats(response.data?.data || null);
      setLastSync((prev) => ({ ...prev, stats: new Date().toISOString() }));
    } catch (error) {
      setStats(null);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("admin_access");
    if (!requiredCode || stored === requiredCode) {
      setIsAllowed(true);
      loadCandidates();
      loadStats();
    }
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearch(value);
    loadCandidates(value);
  };

  const handleAccess = (event: React.FormEvent) => {
    event.preventDefault();
    if (!requiredCode) {
      setIsAllowed(true);
      loadCandidates();
      loadStats();
      return;
    }
    if (accessCode.trim() === requiredCode) {
      localStorage.setItem("admin_access", requiredCode);
      setIsAllowed(true);
      setAccessError("");
      loadCandidates();
      loadStats();
    } else {
      setAccessError("Code incorrect.");
    }
  };

  useEffect(() => {
    if (!isAllowed || !autoRefresh) return;
    const interval = window.setInterval(() => {
      loadStats();
      if (search.trim() === "") {
        loadCandidates();
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [isAllowed, autoRefresh, search]);

  const handleAutoRefresh = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.checked;
    setAutoRefresh(next);
    localStorage.setItem("admin_auto_refresh", next ? "on" : "off");
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_access");
    setIsAllowed(false);
    setAccessCode("");
  };

  if (!isAllowed) {
    return (
      <main className="container">
        <div className="form-card">
          <h1 className="section-title">Accès admin</h1>
          <p className="hero-text">
            Entrez le code d'accès pour consulter les candidatures.
          </p>
          <form onSubmit={handleAccess} className="form-grid">
            <div className="field">
              <label htmlFor="admin-code">Code d'accès</label>
              <input
                id="admin-code"
                type="password"
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value)}
                required
              />
            </div>
            <div className="form-actions">
              <button className="cta" type="submit">
                Accéder
              </button>
              {accessError && <span className="error">{accessError}</span>}
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">Dashboard</div>
        <nav className="admin-nav">
          <button
            type="button"
            className={activeTab === "candidates" ? "active" : ""}
            onClick={() => setActiveTab("candidates")}
          >
            Candidatures
          </button>
          <button
            type="button"
            className={activeTab === "stats" ? "active" : ""}
            onClick={() => setActiveTab("stats")}
          >
            Stats
          </button>
          <button
            type="button"
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            Paramètres
          </button>
        </nav>
        <div className="admin-help">
          <p>Besoin d'aide ?</p>
          <span>contact@xwenusu.org</span>
        </div>
      </aside>

      <section className="admin-content">
        {activeTab === "candidates" && (
          <>
            <div className="admin-header">
              <div>
                <h1>Admin - Candidatures</h1>
                <p>Suivi des inscriptions confirmées.</p>
              </div>
              <a className="cta" href={`${apiBase}/api/admin/candidates.csv`}>
                Export CSV
              </a>
            </div>

            <div className="admin-stats">
              <div className="stat-card">
                <span>Total</span>
                <strong>{stats ? stats.total : "—"}</strong>
              </div>
              <div className="stat-card">
                <span>Aujourd'hui</span>
                <strong>{stats ? stats.today : "—"}</strong>
              </div>
              <div className="stat-card">
                <span>Âge moyen</span>
                <strong>{stats ? stats.average_age : "—"}</strong>
              </div>
              <div className="stat-card">
                <span>Top villes</span>
                <strong>
                  {stats && stats.top_cities.length
                    ? stats.top_cities.map((city) => city.city).join(", ")
                    : "—"}
                </strong>
              </div>
            </div>

            <div className="admin-card">
              <div className="table-controls">
                <input
                  type="search"
                  placeholder="Rechercher par nom, téléphone, ville"
                  value={search}
                  onChange={handleSearch}
                />
                <span className="status">
                  {candidates.length} candidature(s)
                </span>
              </div>
              {status ? (
                <p className="status">{status}</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Nom</th>
                      <th>Téléphone</th>
                      <th>Ville</th>
                      <th>Âge</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((candidate) => (
                      <tr key={candidate.id}>
                        <td>
                          <img src={candidate.photo} alt={candidate.first_name} />
                        </td>
                        <td>
                          {candidate.first_name} {candidate.last_name}
                        </td>
                        <td>{candidate.phone}</td>
                        <td>{candidate.city}</td>
                        <td>{candidate.age}</td>
                        <td>
                          {new Date(candidate.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {activeTab === "stats" && (
          <>
            <div className="admin-header">
              <div>
                <h1>Admin - Statistiques</h1>
                <p>Vue rapide sur les inscriptions confirmées.</p>
              </div>
              <button className="cta" type="button" onClick={loadStats}>
                Rafraîchir
              </button>
            </div>

            <div className="admin-stats">
              <div className="stat-card">
                <span>Total</span>
                <strong>{stats ? stats.total : "—"}</strong>
              </div>
              <div className="stat-card">
                <span>Aujourd'hui</span>
                <strong>{stats ? stats.today : "—"}</strong>
              </div>
              <div className="stat-card">
                <span>Âge moyen</span>
                <strong>{stats ? stats.average_age : "—"}</strong>
              </div>
              <div className="stat-card">
                <span>Top villes</span>
                <strong>
                  {stats && stats.top_cities.length
                    ? stats.top_cities.map((city) => `${city.city} (${city.total})`).join(", ")
                    : "—"}
                </strong>
              </div>
            </div>

            <div className="admin-card">
              <p className="status">
                Dernière mise à jour :{" "}
                {lastSync.stats
                  ? new Date(lastSync.stats).toLocaleString()
                  : "—"}
              </p>
            </div>
          </>
        )}

        {activeTab === "settings" && (
          <>
            <div className="admin-header">
              <div>
                <h1>Admin - Paramètres</h1>
                <p>Actions rapides et préférences du dashboard.</p>
              </div>
            </div>

            <div className="admin-card">
              <div className="form-grid">
                <div className="field inline">
                  <label htmlFor="auto-refresh">Auto-rafraîchissement</label>
                  <input
                    id="auto-refresh"
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={handleAutoRefresh}
                  />
                </div>
                <div className="field">
                  <label>Dernier sync candidatures</label>
                  <input
                    type="text"
                    value={
                      lastSync.candidates
                        ? new Date(lastSync.candidates).toLocaleString()
                        : "—"
                    }
                    readOnly
                  />
                </div>
                <div className="field">
                  <label>Dernier sync stats</label>
                  <input
                    type="text"
                    value={
                      lastSync.stats
                        ? new Date(lastSync.stats).toLocaleString()
                        : "—"
                    }
                    readOnly
                  />
                </div>
              </div>
              <div className="form-actions">
                <button
                  className="cta"
                  type="button"
                  onClick={() => loadCandidates()}
                >
                  Rafraîchir candidatures
                </button>
                <button className="cta" type="button" onClick={loadStats}>
                  Rafraîchir stats
                </button>
                <a className="cta" href={`${apiBase}/api/admin/candidates.csv`}>
                  Export CSV
                </a>
                <button className="cta" type="button" onClick={handleLogout}>
                  Se déconnecter
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
