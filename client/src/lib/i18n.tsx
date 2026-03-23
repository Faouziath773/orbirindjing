import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Lang = "fr" | "en";

type TranslationValue =
  | string
  | ((params?: Record<string, unknown>) => string)
  | Record<string, TranslationValue>;

type Translations = Record<Lang, TranslationValue>;

const translations: Translations = {
  fr: {
    language: {
      toggle: "Basculer la langue",
      label: "FR",
    },
    nav: {
      home: "Accueil",
      register: "Inscription",
    },
    floatingCta: "S'inscrire",
    floatingCtaAria: "S'inscrire",
    footer: {
      brand: "Xwénusu Fondament'Art",
      about:
        "Association artistique et sportive dédiée à l'art urbain, la jeunesse et l'impact social.",
      navigation: "Navigation",
      links: {
        about: "À propos",
        projects: "Projets",
        gallery: "Galerie",
        partners: "Partenaires",
        contact: "Contact",
      },
      socials: "Réseaux sociaux",
      legal: "Légal",
      legalLinks: {
        legal: "Légal",
        rules: "Règlement du vote",
        privacy: "Politique de confidentialité",
        terms: "Conditions d'utilisation",
        mentions: "Mentions légales",
      },
      contact: "Contact",
      city: "Cotonou, Bénin",
    },
    landing: {
      eyebrow: "Programme DJ 100% femmes",
      title: "Découvre le DJing et exprime ta créativité",
      text:
        "OBIRIN est un programme de formation certifiant aux arts urbains, incluant le DJing, animé par des professionnels reconnus aux niveaux national et international et permettant aux jeunes femmes de développer leurs compétences, d’affirmer leur leadership et d’accéder à de nouvelles opportunités professionnelles.",
      cta: "S'inscrire",
      badges: {
        live: "Ateliers live",
        coaching: "Coaching scénique",
        showcase: "Showcase final",
      },
      media: {
        feel: "Ressens le beat",
        glow: "Glow & Mix",
        altOne: "Jeune DJ en performance",
        altTwo: "DJ et platines",
      },
      festival: {
        title: "Un tremplin créatif et immersif",
        text:
          "Plonge dans une expérience unique mélant pratique, création et scène, pour révéler ton talent et affirmer ton identité artistique. Bénéficie d’un encadrement par des experts du DJing et valide ta formation avec un certificat reconnu, valorisable dans ton parcours artistique.",
      },
      info: {
        whyTitle: "Pourquoi participer",
        whyText:
          "Développe ta confiance,affirme ton style et connecte toi à un réseau de femmes talentueuses. Prends ta place dans l'univers du Djing et ouvre-toi à de nouvelles opportunités.",
        learnTitle: "Ce que tu vas apprendre",
        learnText:
          " Les bases du Djing, la sélection musicale, les techniques de transitions, la gestion du rythme et présence derrière les platines.",
        placesTitle: "Places limitées",
        placesText:
          "Un cadre privilégié favorisant l'apprentissage, la pratique et la montée en compétence.",
      },
    },
    register: {
      title: "Inscription au programme DJ",
      subtitle:
        "Les inscriptions sont validées uniquement après paiement de 1000 FCFA.",
      fields: {
        firstName: "Prénom *",
        lastName: "Nom *",
        phone: "Téléphone *",
        age: "Âge *",
        city: "Ville *",
      },
      submit: "Continuer vers le paiement",
      status: {
        payment: "Création du paiement...",
      },
      errors: {
        paymentUnavailable: "Paiement indisponible",
        default: "Erreur lors de l'inscription.",
      },
    },
    success: {
      titleConfirmed: "Inscription confirmée.",
      titleDefault: "Confirmation du paiement.",
      text: {
        loading: "Nous finalisons la validation de ton paiement...",
        confirmed:
          "Merci pour ta confiance ! Nous te contactons très vite pour la suite du programme.",
        pending:
          "Le paiement est enregistré, la confirmation peut prendre quelques minutes. Tu peux rafraîchir cette page.",
        missing:
          "Impossible de retrouver la transaction. Contacte l'équipe si tu as déjà payé.",
        error:
          "Une erreur est survenue lors de la confirmation. Réessaie dans quelques instants.",
      },
      backHome: "Retour à l'accueil",
    },
    admin: {
      access: {
        title: "Accès admin",
        text: "Entrez le code d'accès pour consulter les candidatures.",
        label: "Code d'accès",
        button: "Accéder",
        error: "Code incorrect.",
      },
      sidebar: {
        brand: "Tableau de bord",
        help: "Besoin d'aide ?",
      },
      tabs: {
        candidates: "Candidatures",
        settings: "Paramètres",
        admins: "Gestion admins",
      },
      candidates: {
        title: "Admin - Candidatures",
        subtitle: "Suivi des inscriptions confirmées.",
        export: "Export CSV",
        search: "Rechercher par nom, téléphone, ville",
        count: ({ count }) => `${count} candidature(s)`,
        table: {
          name: "Nom",
          phone: "Téléphone",
          city: "Ville",
          age: "Âge",
          date: "Date",
        },
        status: {
          loading: "Chargement...",
          error: "Impossible de charger les données.",
        },
      },
      stats: {
        total: "Total",
        today: "Aujourd'hui",
        averageAge: "Âge moyen",
        topCities: "Top villes",
      },
      settings: {
        title: "Admin - Paramètres",
        subtitle: "Actions rapides et préférences du dashboard.",
        autoRefresh: "Auto-rafraîchissement",
        lastSyncCandidates: "Dernier sync candidatures",
        lastSyncStats: "Dernier sync stats",
        refreshCandidates: "Rafraîchir candidatures",
        refreshStats: "Rafraîchir stats",
        export: "Export CSV",
        logout: "Se déconnecter",
      },
      admins: {
        title: "Admin - Gestion des administrateurs",
        subtitle: "Ajouter des accès pour consulter le dashboard.",
        load: "Charger",
        form: {
          name: "Nom",
          namePlaceholder: "Nom de l'admin",
          code: "Code d'accès *",
          codePlaceholder: "Code confidentiel",
          add: "Ajouter",
        },
        table: {
          name: "Nom",
          createdAt: "Créé le",
          action: "Action",
          delete: "Supprimer",
        },
        status: {
          loading: "Chargement des admins...",
          forbidden: "Accès réservé à l'admin principal.",
          error: "Impossible de charger les admins.",
          codeRequired: "Le code est obligatoire.",
          creating: "Création en cours...",
          added: "Admin ajouté.",
          createError: "Impossible d'ajouter l'admin.",
          deleting: "Suppression en cours...",
          deleted: "Admin supprimé.",
          deleteError: "Impossible de supprimer l'admin.",
          empty: "Aucun admin enregistré.",
        },
      },
    },
  },
  en: {
    language: {
      toggle: "Switch language",
      label: "EN",
    },
    nav: {
      home: "Home",
      register: "Register",
    },
    floatingCta: "Register",
    floatingCtaAria: "Register",
    footer: {
      brand: "Xwénusu Fondament'Art",
      about:
        "Cultural association based in Cotonou, dedicated to urban art, youth, and social impact.",
      navigation: "Navigation",
      links: {
        about: "About",
        projects: "Projects",
        gallery: "Gallery",
        partners: "Partners",
        contact: "Contact",
      },
      socials: "Socials",
      legal: "Legal",
      legalLinks: {
        legal: "Legal",
        rules: "Voting rules",
        privacy: "Privacy policy",
        terms: "Terms of use",
        mentions: "Legal notice",
      },
      contact: "Contact",
      city: "Cotonou, Benin",
    },
    landing: {
      eyebrow: "DJ program 100% women",
      title: "Discover DJing and express your creativity",
      text:
        "A caring space to learn the basics of mixing, build confidence, and express your musical style with passionate coaches.",
      cta: "Register now",
      badges: {
        live: "Live workshops",
        coaching: "Stage coaching",
        showcase: "Final showcase",
      },
      media: {
        feel: "Feel the beat",
        glow: "Glow & Mix",
        altOne: "Young DJ performing",
        altTwo: "DJ and decks",
      },
      festival: {
        title: "A creative and festive springboard",
        text:
          "Only 12 spots to experience an immersive program: hands-on workshops, studio sessions, and a final showcase.",
      },
      info: {
        whyTitle: "Why participate",
        whyText:
          "Build a network, gain confidence, and explore stage careers.",
        learnTitle: "What you will learn",
        learnText:
          "Beatmatching, transitions, music programming, and stage presence.",
        placesTitle: "Limited places",
        placesText:
          "Small groups for personalized support. Reserve your spot now.",
      },
    },
    register: {
      title: "DJ program registration",
      subtitle:
        "Registrations are confirmed only after a 1000 FCFA payment.",
      fields: {
        firstName: "First name *",
        lastName: "Last name *",
        phone: "Phone *",
        age: "Age *",
        city: "City *",
      },
      submit: "Continue to payment",
      status: {
        payment: "Creating payment...",
      },
      errors: {
        paymentUnavailable: "Payment unavailable",
        default: "Registration error.",
      },
    },
    success: {
      titleConfirmed: "Registration confirmed.",
      titleDefault: "Payment confirmation.",
      text: {
        loading: "We are finalizing your payment validation...",
        confirmed:
          "Thank you for your trust! We'll contact you soon with next steps.",
        pending:
          "Payment recorded, confirmation may take a few minutes. You can refresh this page.",
        missing:
          "We couldn't find the transaction. Contact the team if you've already paid.",
        error:
          "An error occurred during confirmation. Please try again shortly.",
      },
      backHome: "Back to home",
    },
    admin: {
      access: {
        title: "Admin access",
        text: "Enter the access code to view applications.",
        label: "Access code",
        button: "Access",
        error: "Incorrect code.",
      },
      sidebar: {
        brand: "Dashboard",
        help: "Need help?",
      },
      tabs: {
        candidates: "Applications",
        settings: "Settings",
        admins: "Admin management",
      },
      candidates: {
        title: "Admin - Applications",
        subtitle: "Track confirmed registrations.",
        export: "Export CSV",
        search: "Search by name, phone, city",
        count: ({ count }) => `${count} application(s)`,
        table: {
          name: "Name",
          phone: "Phone",
          city: "City",
          age: "Age",
          date: "Date",
        },
        status: {
          loading: "Loading...",
          error: "Unable to load data.",
        },
      },
      stats: {
        total: "Total",
        today: "Today",
        averageAge: "Average age",
        topCities: "Top cities",
      },
      settings: {
        title: "Admin - Settings",
        subtitle: "Quick actions and dashboard preferences.",
        autoRefresh: "Auto-refresh",
        lastSyncCandidates: "Last applications sync",
        lastSyncStats: "Last stats sync",
        refreshCandidates: "Refresh applications",
        refreshStats: "Refresh stats",
        export: "Export CSV",
        logout: "Log out",
      },
      admins: {
        title: "Admin - Administrator management",
        subtitle: "Add access for others to view the dashboard.",
        load: "Load",
        form: {
          name: "Name",
          namePlaceholder: "Admin name",
          code: "Access code *",
          codePlaceholder: "Confidential code",
          add: "Add",
        },
        table: {
          name: "Name",
          createdAt: "Created",
          action: "Action",
          delete: "Delete",
        },
        status: {
          loading: "Loading admins...",
          forbidden: "Access reserved for the primary admin.",
          error: "Unable to load admins.",
          codeRequired: "Code is required.",
          creating: "Creating...",
          added: "Admin added.",
          createError: "Unable to add admin.",
          deleting: "Deleting...",
          deleted: "Admin deleted.",
          deleteError: "Unable to delete admin.",
          empty: "No admins registered.",
        },
      },
    },
  },
};

function getNestedValue(
  dictionary: TranslationValue,
  key: string
): TranslationValue | undefined {
  return key.split(".").reduce<TranslationValue | undefined>((acc, part) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, TranslationValue>)[part];
  }, dictionary);
}

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, params?: Record<string, unknown>) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function detectInitialLang(): Lang {
  if (typeof window === "undefined") {
    return "fr";
  }
  const stored = window.localStorage.getItem("lang");
  if (stored === "fr" || stored === "en") {
    return stored;
  }
  const preferred = window.navigator.language.toLowerCase();
  return preferred.startsWith("en") ? "en" : "fr";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(detectInitialLang);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lang", lang);
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: string, params?: Record<string, unknown>) => {
      const value = getNestedValue(translations[lang], key);
      if (typeof value === "function") {
        return value(params);
      }
      if (typeof value === "string") {
        return value;
      }
      return key;
    };
    return { lang, setLang, t };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}
