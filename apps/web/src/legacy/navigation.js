export const LEGACY_NAV_GROUPS = [
    {
        id: "campagne",
        label: "Campagne",
        icon: "C",
        items: [
            { id: "creation", label: "Creation", sectionIds: ["campaign-tabs", "create-campaign"] },
            { id: "parametres", label: "Parametres", sectionIds: ["convention", "scoping", "audit-plan"] }
        ]
    },
    {
        id: "preparation",
        label: "Preparation",
        icon: "P",
        items: [
            { id: "criteres", label: "Criteres", sectionIds: ["criteria"] },
            { id: "questions", label: "Questions", sectionIds: ["questions", "ai-referential"] },
            { id: "creneaux", label: "Creneaux", sectionIds: ["calendar", "slots", "suggestions"] },
            { id: "documents", label: "Documents", sectionIds: ["documents", "document-review"] }
        ]
    },
    {
        id: "conduite",
        label: "Conduite",
        icon: "D",
        items: [
            {
                id: "entretiens",
                label: "Entretiens",
                sectionIds: ["interviewees", "interview-note", "attendance", "document-refs"]
            },
            { id: "restitution-chaud", label: "Restitution a chaud", sectionIds: ["pending-docs", "scoring"] }
        ]
    },
    {
        id: "restitution",
        label: "Restitution",
        icon: "R",
        items: [
            { id: "rapport", label: "Rapport", sectionIds: ["report"] },
            { id: "journal", label: "Journal", sectionIds: ["audit-log"] }
        ]
    },
    {
        id: "parametrage",
        label: "Parametrage",
        icon: "S",
        items: [{ id: "parametrage", label: "Parametrage", sectionIds: ["ai-config", "metrics"] }]
    }
];
