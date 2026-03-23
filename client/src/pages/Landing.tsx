import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import feelTheBeatImg from "../assets/feel-the-beat.png";
import glowMixImg from "../assets/glow-mix.png";

export default function Landing() {
  const { t } = useI18n();
  return (
    <main>
      <section className="hero container">
        <div>
          <p className="eyebrow">{t("landing.eyebrow")}</p>
          <h1 className="hero-title">{t("landing.title")}</h1>
          <p className="hero-text">{t("landing.text")}</p>
          <div className="hero-badges">
            <span>{t("landing.badges.live")}</span>
            <span>{t("landing.badges.coaching")}</span>
            <span>{t("landing.badges.showcase")}</span>
          </div>
        </div>
        <div className="hero-media">
          <div className="media-card">
            <img
              src={feelTheBeatImg}
              alt={t("landing.media.altOne")}
            />
            <span>{t("landing.media.feel")}</span>
          </div>
          <div className="media-card highlight">
            <img
              src={glowMixImg}
              alt={t("landing.media.altTwo")}
            />
            <span>{t("landing.media.glow")}</span>
          </div>
        </div>
      </section>

      <section className="container festival">
        <div className="festival-header">
          <h2 className="section-title">{t("landing.festival.title")}</h2>
          <p className="hero-text">{t("landing.festival.text")}</p>
        </div>
        <div className="info-grid">
          <div className="info-card" id="learn">
            <h3>{t("landing.info.whyTitle")}</h3>
            <p>{t("landing.info.whyText")}</p>
          </div>
          <div className="info-card">
            <h3>{t("landing.info.learnTitle")}</h3>
            <p>{t("landing.info.learnText")}</p>
          </div>
          <div className="info-card" id="places">
            <h3>{t("landing.info.placesTitle")}</h3>
            <p>{t("landing.info.placesText")}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
