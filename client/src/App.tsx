import { Link, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Success from "./pages/Success";
import Admin from "./pages/Admin";
import { I18nProvider, useI18n } from "./lib/i18n";
import obirinLogo from "./assets/obirin-logo.svg";

function AppContent() {
  const { lang, setLang, t } = useI18n();
  const location = useLocation();
  const nextLang = lang === "fr" ? "en" : "fr";
  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <img className="brand-logo" src={obirinLogo} alt="Battle Obirin" />
          </Link>
          <div className="nav-group">
            <nav className="nav">
              <Link to="/">{t("nav.home")}</Link>
              <Link to="/register">{t("nav.register")}</Link>
            </nav>
            <button
              type="button"
              className="lang-toggle"
              onClick={() => setLang(nextLang)}
              aria-label={t("language.toggle")}
              title={t("language.toggle")}
            >
              {t("language.label")}
            </button>
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/success" element={<Success />} />
        <Route path="/dashboard" element={<Admin />} />
      </Routes>

      {!location.pathname.startsWith("/dashboard") &&
        !location.pathname.startsWith("/register") && (
        <Link
          to="/register"
          className="floating-cta"
          aria-label={t("floatingCtaAria")}
        >
          {t("floatingCta")}
        </Link>
      )}

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <h3 className="footer-brand">{t("footer.brand")}</h3>
            <p>{t("footer.about")}</p>
          </div>
          <div>
            <h4>{t("footer.navigation")}</h4>
            <a href="#">{t("footer.links.about")}</a>
            <a href="#">{t("footer.links.projects")}</a>
            <a href="#">{t("footer.links.gallery")}</a>
            <a href="#">{t("footer.links.partners")}</a>
            <a href="#">{t("footer.links.contact")}</a>
          </div>
          <div>
            <h4>{t("footer.socials")}</h4>
            <div className="socials">
              <a
                href="https://www.facebook.com/xwenusufondamentart/?locale=fr_FR"
                aria-label="Facebook"
                target="_blank"
                rel="noreferrer"
              >
                f
              </a>
              <a
                href="https://www.instagram.com/xwenusu_fondament_art/"
                aria-label="Instagram"
                target="_blank"
                rel="noreferrer"
              >
                ⬤
              </a>
              <a
                href="https://www.youtube.com/@xwenusufondamentart229/featured"
                aria-label="YouTube"
                target="_blank"
                rel="noreferrer"
              >
                ▶
              </a>
              <a href="#" aria-label="TikTok">
                ♫
              </a>
            </div>
          </div>
          <div>
            <h4>{t("footer.legal")}</h4>
            <a href="#">{t("footer.legalLinks.legal")}</a>
            <a href="#">{t("footer.legalLinks.rules")}</a>
            <a href="#">{t("footer.legalLinks.privacy")}</a>
            <a href="#">{t("footer.legalLinks.terms")}</a>
            <a href="#">{t("footer.legalLinks.mentions")}</a>
          </div>
          <div>
            <h4>{t("footer.contact")}</h4>
            <p>{t("footer.city")}</p>
            <p>xwenusufondamentart@gmail.com</p>
            <p>+229 96 95 71 69</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

export default App;
