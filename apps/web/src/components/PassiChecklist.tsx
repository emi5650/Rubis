import { Badge, Box, Checkbox, Divider, Heading, Progress, Stack, Text, VStack } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";

type PassiChecklistProps = {
  campaignId: string;
  onProgressChange?: (progress: number) => void;
};

type ChecklistSection = {
  title: string;
  items: string[];
};

const PASSI_CHECKLIST: ChecklistSection[] = [
  {
    title: "Avant l’audit - Initialisation de l’audit",
    items: [
      "Nommer un responsable d’audit PASSI et constituer l’équipe d’audit.",
      "Collecter la documentation existante de la cible auditée (PSSI, analyses de risques, procédures de sécurité, exploitation).",
      "Vérifier la faisabilité de l’audit (habilitations nécessaires, traitement des données classifiées, réalisation dans les locaux adaptés).",
      "Renseigner la convention d’audit (document principal) et ses annexes.",
      "Vérifier que la convention détaille le périmètre, les critères d’audit et les destinataires des recommandations.",
      "Vérifier que l’autorisation d’audit détaille le périmètre et les cibles auditées (IP, domaines, etc.).",
      "Marquer la convention et le plan d’audit “Diffusion restreinte”.",
      "Signer la convention et ses annexes par le Responsable d’Audit PASSI.",
      "Envoyer la convention au client pour signature dans un container ZED.",
      "Préparer les annexes tierces/interne selon le contexte (A.2.4 Consentement Tiers ou A.2.2 Autorisation d’audit).",
      "S’assurer que les auditeurs ont lu la charte éthique (A.1.2) et signé l’ordre de mission.",
      "Échanger les clés de chiffrement avec commanditaire et audité avant les échanges sensibles."
    ]
  },
  {
    title: "Avant l’audit - Préparation de l’audit",
    items: [
      "Préparer la réunion d’ouverture.",
      "Préparer le plan d’audit.",
      "Imprimer la fiche de présence.",
      "Préparer/imprimer les annexes nécessaires en 2 exemplaires selon le contexte (tiers/interne)."
    ]
  },
  {
    title: "Pendant l’audit - Réunion d’ouverture",
    items: [
      "Faire signer la fiche de présence.",
      "Présenter le support d’ouverture et le plan d’audit.",
      "Valider la langue des échanges et livrables (français a minima).",
      "Confirmer les règles de stockage et d’échange chiffré des informations sensibles.",
      "Rappeler le processus d’escalade en cas de vulnérabilité critique.",
      "Rappeler les engagements de confidentialité et les valeurs éthiques.",
      "Faire signer les annexes de consentement/autorisations requises (A.2.4 ou A.2.2)."
    ]
  },
  {
    title: "Pendant l’audit - Exécution de l’audit",
    items: [
      "Réaliser les actions d’audit prévues.",
      "Faire des débriefings réguliers pour remonter les écarts.",
      "Tenir une réunion de fermeture des activités d’audit (obligatoire).",
      "Rappeler en réunion que l’audit est “non exhaustif” et basé sur échantillonnage.",
      "Communiquer le point de contact pour réclamations/plaintes (passi@soprasteria.com).",
      "Indiquer au client comment rejouer les tests techniques après correction.",
      "Proposer un audit de revalidation après correction.",
      "Faire signer la feuille d’émargement.",
      "Faire signer le consentement avant toute communication publique."
    ]
  },
  {
    title: "Pendant ou après l’audit - Rédaction du rapport",
    items: [
      "Rédiger le rapport en français (a minima).",
      "Envoyer le rapport au client avant la réunion de clôture."
    ]
  },
  {
    title: "Pendant ou après l’audit - Préparation réunion de clôture",
    items: [
      "Préparer la réunion de clôture (facultative / potentiellement informelle).",
      "Imprimer la fiche de présence.",
      "Renseigner et imprimer l’annexe A.2.3 Consentement (2 exemplaires).",
      "Renseigner et imprimer l’Attestation de Responsabilité (2 exemplaires).",
      "Renseigner et imprimer le PV de livraison (2 exemplaires).",
      "Préparer le PV de destruction/restitution selon convention et notifications client."
    ]
  },
  {
    title: "Pendant ou après l’audit - Réunion de clôture",
    items: [
      "Faire signer la fiche de présence.",
      "Présenter la réunion de clôture et rappeler les points clés (non-exhaustif, contact, rejouabilité, re-audit).",
      "Faire signer les 2 exemplaires de l’annexe A.2.3 Consentement.",
      "Faire signer les 2 exemplaires de l’Attestation de Responsabilité.",
      "Faire signer les 2 exemplaires du PV de livraison.",
      "Faire signer le PV de destruction/restitution selon le cas prévu par la convention.",
      "Envoyer convention + annexes (hors plan d’audit) en container ZED au Responsable des prestations PASSI.",
      "Détruire le rapport, le plan d’audit et les autres documents/preuves conformément aux exigences."
    ]
  }
];

export function passiChecklistStorageKey(campaignId: string) {
  return `rubis.passiChecklist.${campaignId || "none"}`;
}

export const PASSI_CHECKLIST_TOTAL_ITEMS = PASSI_CHECKLIST.reduce((sum, section) => sum + section.items.length, 0);

export function PassiChecklist({ campaignId, onProgressChange }: PassiChecklistProps) {
  const allItems = useMemo(
    () => PASSI_CHECKLIST.flatMap((section) => section.items.map((item) => `${section.title}::${item}`)),
    []
  );

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!campaignId) {
      setChecked({});
      return;
    }

    try {
      const raw = localStorage.getItem(passiChecklistStorageKey(campaignId));
      setChecked(raw ? (JSON.parse(raw) as Record<string, boolean>) : {});
    } catch {
      setChecked({});
    }
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId) {
      return;
    }

    localStorage.setItem(passiChecklistStorageKey(campaignId), JSON.stringify(checked));
  }, [campaignId, checked]);

  const checkedCount = allItems.filter((item) => checked[item]).length;
  const totalCount = allItems.length;
  const progressValue = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  useEffect(() => {
    onProgressChange?.(progressValue);
  }, [progressValue, onProgressChange]);

  function toggle(itemKey: string) {
    setChecked((previous) => ({
      ...previous,
      [itemKey]: !previous[itemKey]
    }));
  }

  return (
    <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
      <Heading size="sm" mb={2}>Checklist PASSI</Heading>
      <Text fontSize="sm" color="gray.600" mb={4}>Suivi opérationnel des étapes d’un audit PASSI.</Text>

      <Stack direction={{ base: "column", md: "row" }} align={{ base: "flex-start", md: "center" }} justify="space-between" mb={3}>
        <Badge bg="#F07D00" color="white" px={2} py={1} rounded="md">
          {checkedCount}/{totalCount} tâches validées
        </Badge>
        <Text fontSize="sm" color="gray.600">Progression: {progressValue}%</Text>
      </Stack>

      <Progress value={progressValue} size="sm" colorScheme="orange" rounded="md" mb={5} />

      <VStack align="stretch" spacing={4}>
        {PASSI_CHECKLIST.map((section, index) => (
          <Box key={section.title}>
            <Heading size="xs" mb={2}>{section.title}</Heading>
            <VStack align="stretch" spacing={2}>
              {section.items.map((item) => {
                const itemKey = `${section.title}::${item}`;
                return (
                  <Checkbox
                    key={itemKey}
                    isChecked={Boolean(checked[itemKey])}
                    onChange={() => toggle(itemKey)}
                    colorScheme="orange"
                    alignItems="flex-start"
                  >
                    <Text fontSize="sm">{item}</Text>
                  </Checkbox>
                );
              })}
            </VStack>
            {index < PASSI_CHECKLIST.length - 1 ? <Divider mt={4} /> : null}
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
