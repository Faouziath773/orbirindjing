import { useEffect, useState } from "react";
import api from "../lib/api";
import { useI18n } from "../lib/i18n";

type Candidate = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  age: number;
  city: string;
  transaction_id: string;
  created_at: string;
};

type AdminStats = {
  total: number;
  today: number;
  average_age: string;
  top_cities: { city: string; total: number }[];
};

type AdminTab = "candidates" | "settings" | "admins";

type AdminAccess = {
  id: number;
  name: string | null;
  code: string;
  created_at: string;
};

export default function Admin() {
  const { t } = useI18n();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState("");
  const [statusKey, setStatusKey] = useState<"loading" | "error" | "">(
    "loading"
  );
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [isAllowed, setIsAllowed] = useState(false);
  const [accessErrorKey, setAccessErrorKey] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("candidates");
  const [admins, setAdmins] = useState<AdminAccess[]>([]);
  const [adminName, setAdminName] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [adminStatusKey, setAdminStatusKey] = useState("");
  const [adminStatusOverride, setAdminStatusOverride] = useState("");
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

  const buildAdminHeaders = (code: string) =>
    code ? { "x-admin-code": code } : undefined;

  const loadCandidates = async (query = "") => {
    setStatusKey("loading");
    try {
      const response = await api.get("/api/admin/candidates", {
        params: query ? { search: query } : undefined,
        headers: buildAdminHeaders(accessCode),
      });
      setCandidates(response.data?.data || []);
      setStatusKey("");
      setLastSync((prev) => ({ ...prev, candidates: new Date().toISOString() }));
    } catch (error) {
      setStatusKey("error");
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get("/api/admin/stats", {
        headers: buildAdminHeaders(accessCode),
      });
      setStats(response.data?.data || null);
      setLastSync((prev) => ({ ...prev, stats: new Date().toISOString() }));
    } catch (error) {
      setStats(null);
    }
  };

  const verifyAccess = async (code: string) => {
    const response = await api.post(
      "/api/admin/verify",
      { code },
      { headers: buildAdminHeaders(code) }
    );
    return Boolean(response.data?.success);
  };

  const loadAdmins = async () => {
    setAdminStatusKey("admin.admins.status.loading");
    setAdminStatusOverride("");
    try {
      const response = await api.get("/api/admin/access", {
        headers: buildAdminHeaders(accessCode),
      });
      setAdmins(response.data?.data || []);
      setAdminStatusKey("");
    } catch (error: unknown) {
      setAdmins([]);
      const isForbidden =
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { status?: number } }).response?.status === 403;
      setAdminStatusKey(
        isForbidden
          ? "admin.admins.status.forbidden"
          : "admin.admins.status.error"
      );
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("admin_access");
    if (!stored && !requiredCode) {
      setIsAllowed(true);
      loadCandidates();
      loadStats();
      return;
    }
    if (stored) {
      setAccessCode(stored);
      verifyAccess(stored)
        .then((ok) => {
          if (ok) {
            setIsAllowed(true);
            loadCandidates();
            loadStats();
          }
        })
        .catch(() => {
          setIsAllowed(false);
        });
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
    const code = accessCode.trim();
    if (!code) {
      setAccessErrorKey("admin.access.error");
      return;
    }
    verifyAccess(code)
      .then((ok) => {
        if (ok) {
          localStorage.setItem("admin_access", code);
          setIsAllowed(true);
          setAccessErrorKey("");
          loadCandidates();
          loadStats();
        } else {
          setAccessErrorKey("admin.access.error");
        }
      })
      .catch(() => {
        setAccessErrorKey("admin.access.error");
      });
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
    setAdmins([]);
    setAdminStatusKey("");
    setAdminStatusOverride("");
  };

  const handleCreateAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = adminCode.trim();
    if (!code) {
      setAdminStatusKey("admin.admins.status.codeRequired");
      setAdminStatusOverride("");
      return;
    }
    setAdminStatusKey("admin.admins.status.creating");
    setAdminStatusOverride("");
    try {
      await api.post(
        "/api/admin/access",
        { name: adminName.trim(), code },
        { headers: buildAdminHeaders(accessCode) }
      );
      setAdminName("");
      setAdminCode("");
      setAdminStatusKey("admin.admins.status.added");
      await loadAdmins();
    } catch (error: unknown) {
      const responseError =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response
          ?.data?.error === "string"
          ? (error as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : null;
      if (responseError) {
        setAdminStatusOverride(responseError);
        setAdminStatusKey("");
      } else {
        setAdminStatusOverride("");
        setAdminStatusKey("admin.admins.status.createError");
      }
    }
  };

  const handleDeleteAdmin = async (id: number) => {
    setAdminStatusKey("admin.admins.status.deleting");
    setAdminStatusOverride("");
    try {
      await api.delete(`/api/admin/access/${id}`, {
        headers: buildAdminHeaders(accessCode),
      });
      setAdminStatusKey("admin.admins.status.deleted");
      await loadAdmins();
    } catch (error) {
      setAdminStatusKey("admin.admins.status.deleteError");
    }
  };

  if (!isAllowed) {
    return (
      <main className="container">
        <div className="form-card">
          <h1 className="section-title">{t("admin.access.title")}</h1>
          <p className="hero-text">{t("admin.access.text")}</p>
          <form onSubmit={handleAccess} className="form-grid">
            <div className="field">
              <label htmlFor="admin-code">{t("admin.access.label")}</label>
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
                {t("admin.access.button")}
              </button>
              {accessErrorKey && (
                <span className="error">{t(accessErrorKey)}</span>
              )}
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">{t("admin.sidebar.brand")}</div>
        <nav className="admin-nav">
          <button
            type="button"
            className={activeTab === "candidates" ? "active" : ""}
            onClick={() => setActiveTab("candidates")}
          >
            {t("admin.tabs.candidates")}
          </button>
          <button
            type="button"
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            {t("admin.tabs.settings")}
          </button>
          <button
            type="button"
            className={activeTab === "admins" ? "active" : ""}
            onClick={() => setActiveTab("admins")}
          >
            {t("admin.tabs.admins")}
          </button>
        </nav>
        <div className="admin-help">
          <p>{t("admin.sidebar.help")}</p>
          <span>contact@xwenusu.org</span>
        </div>
      </aside>

      <section className="admin-content">
        {activeTab === "candidates" && (
          <>
            <div className="admin-header">
              <div>
                <h1>{t("admin.candidates.title")}</h1>
                <p>{t("admin.candidates.subtitle")}</p>
              </div>
              <a className="cta" href={`${apiBase}/api/admin/candidates.csv`}>
                {t("admin.candidates.export")}
              </a>
            </div>

            <div className="admin-stats">
              <div className="stat-card">
                <span>{t("admin.stats.total")}</span>
                <strong>{stats ? stats.total : "—"}</strong>
              </div>
              <div className="stat-card">
                <span>{t("admin.stats.today")}</span>
                <strong>{stats ? stats.today : "—"}</strong>
              </div>
              <div className="stat-card">
                <span>{t("admin.stats.averageAge")}</span>
                <strong>{stats ? stats.average_age : "—"}</strong>
              </div>
              <div className="stat-card">
                <span>{t("admin.stats.topCities")}</span>
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
                  placeholder={t("admin.candidates.search")}
                  value={search}
                  onChange={handleSearch}
                />
                <span className="status">
                  {t("admin.candidates.count", { count: candidates.length })}
                </span>
              </div>
              {statusKey ? (
                <p className="status">
                  {t(`admin.candidates.status.${statusKey}`)}
                </p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("admin.candidates.table.name")}</th>
                      <th>{t("admin.candidates.table.phone")}</th>
                      <th>{t("admin.candidates.table.city")}</th>
                      <th>{t("admin.candidates.table.age")}</th>
                      <th>{t("admin.candidates.table.date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((candidate) => (
                      <tr key={candidate.id}>
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

        {activeTab === "settings" && (
          <>
            <div className="admin-header">
              <div>
                <h1>{t("admin.settings.title")}</h1>
                <p>{t("admin.settings.subtitle")}</p>
              </div>
            </div>

            <div className="admin-card">
              <div className="form-grid">
                <div className="field inline">
                  <label htmlFor="auto-refresh">
                    {t("admin.settings.autoRefresh")}
                  </label>
                  <input
                    id="auto-refresh"
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={handleAutoRefresh}
                  />
                </div>
                <div className="field">
                  <label>{t("admin.settings.lastSyncCandidates")}</label>
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
                  <label>{t("admin.settings.lastSyncStats")}</label>
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
                  {t("admin.settings.refreshCandidates")}
                </button>
                <button className="cta" type="button" onClick={loadStats}>
                  {t("admin.settings.refreshStats")}
                </button>
                <a className="cta" href={`${apiBase}/api/admin/candidates.csv`}>
                  {t("admin.settings.export")}
                </a>
                <button className="cta" type="button" onClick={handleLogout}>
                  {t("admin.settings.logout")}
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === "admins" && (
          <>
            <div className="admin-header">
              <div>
                <h1>{t("admin.admins.title")}</h1>
                <p>{t("admin.admins.subtitle")}</p>
              </div>
              <button className="cta" type="button" onClick={loadAdmins}>
                {t("admin.admins.load")}
              </button>
            </div>

            <div className="admin-card">
              <form onSubmit={handleCreateAdmin} className="form-grid">
                <div className="field">
                  <label htmlFor="admin-name">{t("admin.admins.form.name")}</label>
                  <input
                    id="admin-name"
                    value={adminName}
                    onChange={(event) => setAdminName(event.target.value)}
                    placeholder={t("admin.admins.form.namePlaceholder")}
                  />
                </div>
                <div className="field">
                  <label htmlFor="admin-code">{t("admin.admins.form.code")}</label>
                  <input
                    id="admin-code"
                    value={adminCode}
                    onChange={(event) => setAdminCode(event.target.value)}
                    placeholder={t("admin.admins.form.codePlaceholder")}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button className="cta" type="submit">
                    {t("admin.admins.form.add")}
                  </button>
                  {(adminStatusOverride || adminStatusKey) && (
                    <span className="status">
                      {adminStatusOverride || t(adminStatusKey)}
                    </span>
                  )}
                </div>
              </form>

              {admins.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("admin.admins.table.name")}</th>
                      <th>{t("admin.admins.table.createdAt")}</th>
                      <th>{t("admin.admins.table.action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin.id}>
                        <td>{admin.name || "—"}</td>
                        <td>
                          {new Date(admin.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="cta"
                            onClick={() => handleDeleteAdmin(admin.id)}
                          >
                            {t("admin.admins.table.delete")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="status">
                  {adminStatusOverride ||
                    (adminStatusKey
                      ? t(adminStatusKey)
                      : t("admin.admins.status.empty"))}
                </p>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
