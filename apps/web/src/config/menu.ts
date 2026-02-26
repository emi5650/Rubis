import { FiClipboard, FiFileText, FiSearch, FiSettings, FiUsers, FiEdit3, FiShield } from "react-icons/fi";

export type MenuEntry = {
  id: string;
  label: string;
  path: string;
  icon: typeof FiClipboard;
  description: string;
};

export const MENU_ENTRIES: MenuEntry[] = [
  {
    id: "preliminaire",
    label: "Organisation",
    path: "/organisation",
    icon: FiClipboard,
    description: "Convention (optionnelle), note de cadrage et plan d’audit."
  },
  {
    id: "preparation",
    label: "Préparation",
    path: "/preparation",
    icon: FiFileText,
    description: "Planification des étapes et préparation opérationnelle."
  },
  {
    id: "analyse-documentaire",
    label: "Analyse documentaire",
    path: "/analyse-documentaire",
    icon: FiSearch,
    description: "Collecte, revue et qualification des preuves documentaires."
  },
  {
    id: "entretiens",
    label: "Entretiens",
    path: "/entretiens",
    icon: FiUsers,
    description: "Gestion des interviewés, créneaux et notes d’entretien."
  },
  {
    id: "redaction",
    label: "Rédaction",
    path: "/redaction",
    icon: FiEdit3,
    description: "Synthèse, scoring et production des livrables."
  },
  {
    id: "parametrage",
    label: "Paramétrage",
    path: "/parametrage",
    icon: FiSettings,
    description: "Configuration IA, métriques et options globales."
  },
  {
    id: "administration",
    label: "Administration",
    path: "/administration",
    icon: FiShield,
    description: "Gestion des clés API et paramètres avancés."
  }
];
