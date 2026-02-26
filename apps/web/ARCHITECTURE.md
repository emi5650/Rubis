# Architecture Frontend Rubis — Post-migration formalisme

## Vue d'ensemble

L'application web Rubis a été restructurée selon un formalisme inspiré de l'architecture "Facturation Pro" avec:
- Layout sidebar fixe + drawer mobile
- 6 entrées de menu fonctionnelles (Préliminaire → Paramétrage)
- Stack technique moderne (Chakra UI + React Query + HashRouter)
- Workspace legacy préservé pendant la transition

---

## Structure des dossiers

```
apps/web/src/
├── api/
│   ├── client.ts          # Client Axios + gestion token JWT
│   └── rubis.ts           # Couche API métier (campaigns, criteria, documents, etc.)
├── assets/                # Logos et ressources statiques
├── components/
│   └── CampaignSelector.tsx  # Sélecteur de campagne partagé
├── config/
│   └── menu.ts            # Configuration des 6 entrées de menu principales
├── layout/
│   └── AppLayout.tsx      # Layout sidebar + main content + drawer mobile
├── legacy/                # Modules issus de l'ancien monolithe App.tsx
│   ├── navigation.ts      # Groupes de navigation legacy
│   ├── routing.ts         # Parsing/génération hash URL legacy
│   └── types.ts           # Types historiques (NavGroup, RouteState, etc.)
├── pages/
│   ├── AnalyseDocumentairePage.tsx
│   ├── EntretiensPage.tsx
│   ├── LegacyWorkspacePage.tsx    # Point d'entrée vers ancien workspace
│   ├── ParametragePage.tsx
│   ├── PreliminairePage.tsx
│   ├── PreparationPage.tsx
│   ├── RedactionPage.tsx
│   └── SectionPage.tsx            # Template générique page (non utilisé en prod)
├── App.tsx                # Ancien monolithe, toujours utilisé via LegacyWorkspacePage
├── GanttCalendar.tsx      # Composant calendrier Gantt (legacy)
├── RoadmapViewer.tsx      # Visualisation roadmap produit (legacy)
├── RootApp.tsx            # Point d'entrée principal (nouveau formalisme)
├── main.tsx               # Bootstrap React + providers
├── theme.ts               # Thème Chakra UI
└── styles.css             # Styles globaux
```

---

## Stack technique

### Runtime
| Bibliothèque | Version | Rôle |
|---|---|---|
| `react` + `react-dom` | 19.x | Base |
| `@chakra-ui/react` | 2.8+ | Système UI principal |
| `@emotion/react` + `@emotion/styled` | 11.14+ | Requis par Chakra |
| `framer-motion` | 12+ | Animations (compatible React 19) |
| `react-router-dom` | 6.30+ | Routing (`HashRouter`) |
| `@tanstack/react-query` | 5.66+ | Cache requêtes API |
| `axios` | 1.7+ | Client HTTP |
| `react-icons` | 5.4+ | Icônes Feather Icons (Fi) |

### Dev
| Bibliothèque | Version | Rôle |
|---|---|---|
| `vite` | 6.1+ | Bundler |
| `@vitejs/plugin-react` | 4.3+ | Support JSX/TSX |
| `typescript` | 5.7+ | Typage statique |

---

## Point d'entrée (`main.tsx`)

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RootApp } from "./RootApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>
);
```

---

## Application principale (`RootApp.tsx`)

### Providers
- `QueryClientProvider` (React Query)
- `ChakraProvider` (thème + composants)
- `HashRouter` (routing sans config serveur)

### État global
- `campaignId` (campagne active, persistée dans `localStorage`)
- Partagé entre toutes les pages

### Routes
| Path | Composant | Description |
|---|---|---|
| `/` | Navigate → `/preliminaire` | Redirection par défaut |
| `/preliminaire` | `PreliminairePage` | Création campagne + convention |
| `/preparation` | `PreparationPage` | Critères + plan audit |
| `/analyse-documentaire` | `AnalyseDocumentairePage` | Documents + revue documentaire |
| `/entretiens` | `EntretiensPage` | Interviewés + créneaux |
| `/redaction` | `RedactionPage` | Génération rapports + journal |
| `/parametrage` | `ParametragePage` | Config Ollama + options globales |
| `/legacy-workspace` | `LegacyWorkspacePage` | Ancien workspace Rubis |
| `*` | Navigate → `/preliminaire` | Fallback 404 |

---

## Layout (`AppLayout.tsx`)

### Desktop
- Sidebar fixe gauche **260px**, `position: fixed`, fond `brand.900` (`#000020`)
- Main `flex: 1`, padding `8`, scroll indépendant
- Liens actifs: `bg=white`, `color=blue.600`, `fontWeight=semibold`

### Mobile
- Hamburger `<IconButton>` fixe top-left
- Sidebar devenu `<Drawer placement="left" size="xs">`
- Backdrop flou `blur(4px)`

---

## Thème Chakra (`theme.ts`)

```typescript
colors: {
  brand: {
    50:  '#e3f2ff',
    500: '#045ce6',  // Primaire
    900: '#000020',  // Fond sidebar
  }
}
```

Mode forcé: `initialColorMode: "light"`

---

## Configuration menu (`config/menu.ts`)

```typescript
export const MENU_ENTRIES: MenuEntry[] = [
  { id: "preliminaire", label: "Préliminaire", path: "/preliminaire", icon: FiClipboard },
  { id: "preparation", label: "Préparation", path: "/preparation", icon: FiFileText },
  { id: "analyse-documentaire", ... },
  { id: "entretiens", ... },
  { id: "redaction", ... },
  { id: "parametrage", ... }
];
```

---

## Couche API (`api/rubis.ts`)

Fonctions principales:
- `getCampaigns()`, `createCampaign()`
- `getCriteria(campaignId)`, `createCriterion()`
- `saveConvention()`, `saveAuditPlan()`
- `getDocuments()`, `createDocument()`, `saveDocumentReview()`
- `getInterviewees()`, `createInterviewee()`
- `getInterviewSlots()`, `createInterviewSlot()`
- `generateReport()`, `getReports()`, `getAuditLog()`
- `getConfig()`, `setConfig(ollamaModel)`

**Base URL**: `import.meta.env.VITE_API_URL ?? "http://localhost:4000"`

---

## Pages fonctionnelles

### `PreliminairePage`
- Sélecteur de campagne (via `<CampaignSelector>`)
- Formulaire création campagne (nom, framework, langue)
- Formulaire convention d'audit (organisation, type, mode, périmètre)

### `PreparationPage`
- Ajout critères (code, titre, thème)
- Plan d'audit (objectifs, scope, méthodes, logistique)

### `AnalyseDocumentairePage`
- Ajout documents (nom, thème, version, sensibilité)
- Revue documentaire (maturité, conformité, points à investiguer)

### `EntretiensPage`
- Ajout interviewés (nom, rôle, email, entité)
- Ajout créneaux (titre, dates ISO, mode, thème)

### `RedactionPage`
- Génération rapport d'audit (bouton unique)
- Consultation journal récent (20 derniers événements)

### `ParametragePage`
- Configuration modèle Ollama actif
- Affichage campagne active

---

## Modules legacy (`legacy/`)

### `types.ts`
Types historiques extraits de `App.tsx`:
- `Language`, `InterviewSlot`, `CampaignSummary`, `CampaignTab`
- `NavItem`, `NavGroup`, `RouteState`

### `navigation.ts`
```typescript
export const LEGACY_NAV_GROUPS: NavGroup[] = [
  { id: "campagne", label: "Campagne", icon: "C", items: [...] },
  { id: "preparation", ... },
  { id: "conduite", ... },
  { id: "restitution", ... },
  { id: "parametrage", ... }
];
```

### `routing.ts`
```typescript
parseLegacyRouteFromHash(hash, navGroups): RouteState
buildLegacyHash(view, navGroups, groupId?, itemId?): string
```

---

## Patterns de code

### Gestion d'erreur API
```tsx
try {
  const data = await apiFunction();
  toast({ status: "success", title: "Action réussie" });
} catch (error) {
  toast({ status: "error", title: "Titre erreur", description: String(error) });
}
```

### Chargement données au mount
```tsx
useEffect(() => {
  refreshData().catch((error) => {
    toast({ status: "error", title: "Chargement", description: String(error) });
  });
}, [campaignId]);
```

### Layout formulaire
```tsx
<Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={3}>
  <Input placeholder="..." value={value} onChange={(e) => setValue(e.target.value)} />
  <Button onClick={handleSubmit}>Enregistrer</Button>
</Grid>
```

---

## Migration en cours

### État actuel
- ✅ Architecture frontend modernisée (Chakra + Query + HashRouter)
- ✅ 6 pages fonctionnelles câblées API
- ✅ Layout sidebar responsive
- ✅ Ancien workspace préservé (`/legacy-workspace`)
- ✅ Types/navigation/routing legacy modularisés

### Prochaines étapes suggérées
1. Découper `App.tsx` en sous-composants réutilisables (formulaires, listes, modales)
2. Créer hooks custom pour logique métier répétée (ex: `useCampaignData`)
3. Ajouter tests unitaires (Vitest) sur composants critiques
4. Migrer progressivement features legacy vers pages modernes
5. Optimiser bundle (code-splitting, lazy loading)
6. Ajouter auth JWT si nécessaire (pattern déjà présent dans `api/client.ts`)

---

## Scripts disponibles

```bash
npm run dev         # Démarre dev server (Vite, port 5173)
npm run build       # Build production (dist/)
npm run preview     # Preview build local
npm run typecheck   # Validation TypeScript
```

---

## Configuration Vite (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  resolve: { extensions: [".tsx", ".ts", ".jsx", ".js", ".json"] }
});
```

> **Note**: Pas de proxy Vite configuré actuellement — les appels API se font en direct sur `localhost:4000`.

---

## Déploiement production

### Build
```bash
cd apps/web
npm run build
```

Sortie: `apps/web/dist/`

### Exemple Nginx
```nginx
server {
    listen 80;
    server_name rubis;

    root /var/www/rubis;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;  # SPA fallback
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Points d'attention

| Point | Détail |
|---|---|
| **HashRouter** | URLs en `/#/ma-page` — pas de config serveur nécessaire |
| **Token localStorage** | Prêt dans `api/client.ts` mais pas encore utilisé côté auth |
| **Campagne partagée** | État `campaignId` partagé entre pages via props drilling (optimisable avec Context) |
| **Bundle size** | ~665 KB (warning Vite) — à optimiser avec code-splitting |
| **Legacy workspace** | `App.tsx` toujours intégral (2233 lignes) — à découper progressivement |
| **Pas de mobile UX teste** | Layout responsive codé mais non testé sur mobile réel |

---

## Références

- Chakra UI: https://chakra-ui.com/
- React Query: https://tanstack.com/query/latest
- React Router: https://reactrouter.com/
- Vite: https://vite.dev/
