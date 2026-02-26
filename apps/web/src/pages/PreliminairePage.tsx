import {
  Badge,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Progress,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
  VStack
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { AuditDirectoryMember, getAuditDirectory, getAuditTeam, saveAuditPlan, saveAuditTeam, saveConvention, saveScopingNote } from "../api/rubis";
import { PASSI_CHECKLIST_TOTAL_ITEMS, PassiChecklist, passiChecklistStorageKey } from "../components/PassiChecklist";

type PreliminairePageProps = {
  campaignId: string;
  onCampaignChange: (campaignId: string) => void;
};

export function PreliminairePage({ campaignId }: PreliminairePageProps) {
  const toast = useToast();
  const [auditDirectory, setAuditDirectory] = useState<AuditDirectoryMember[]>([]);
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<string[]>([]);
  const [isLoadingTeamData, setIsLoadingTeamData] = useState(false);
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [checklistProgress, setChecklistProgress] = useState(0);

  const [auditedOrganization, setAuditedOrganization] = useState("");
  const [sponsorOrganization, setSponsorOrganization] = useState("");
  const [auditType, setAuditType] = useState<"interne" | "externe" | "mixte">("interne");
  const [perimeter, setPerimeter] = useState("");
  const [constraints, setConstraints] = useState("");
  const [mode, setMode] = useState<"sur-site" | "distance" | "hybride">("hybride");

  const [objectives, setObjectives] = useState("");
  const [assumptions, setAssumptions] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [stakeholders, setStakeholders] = useState("");
  const [planningConstraints, setPlanningConstraints] = useState("");

  const [planObjectives, setPlanObjectives] = useState("");
  const [scope, setScope] = useState("");
  const [methods, setMethods] = useState("");
  const [samplingStrategy, setSamplingStrategy] = useState("");
  const [logistics, setLogistics] = useState("");
  const [communicationRules, setCommunicationRules] = useState("");

  useEffect(() => {
    if (!campaignId) {
      setChecklistProgress(0);
      return;
    }

    try {
      const raw = localStorage.getItem(passiChecklistStorageKey(campaignId));
      const checked = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      const checkedCount = Object.values(checked).filter(Boolean).length;
      const progress = PASSI_CHECKLIST_TOTAL_ITEMS > 0 ? Math.round((checkedCount / PASSI_CHECKLIST_TOTAL_ITEMS) * 100) : 0;
      setChecklistProgress(progress);
    } catch {
      setChecklistProgress(0);
    }
  }, [campaignId]);

  useEffect(() => {
    let cancelled = false;

    async function loadTeamData() {
      if (!campaignId) {
        setAuditDirectory([]);
        setSelectedTeamMemberIds([]);
        return;
      }

      setIsLoadingTeamData(true);
      try {
        const [directory, team] = await Promise.all([getAuditDirectory(), getAuditTeam(campaignId)]);
        if (cancelled) return;

        const availableIds = new Set(directory.map((member) => member.id));
        setAuditDirectory(directory);
        setSelectedTeamMemberIds(team.memberIds.filter((id) => availableIds.has(id)));
      } catch (error) {
        if (!cancelled) {
          toast({ status: "error", title: "Equipe", description: String(error) });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTeamData(false);
        }
      }
    }

    loadTeamData();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  async function handleSaveConvention() {
    if (!campaignId) {
      toast({ status: "warning", title: "Aucune campagne sélectionnée", description: "Retournez à l'accueil pour choisir une campagne" });
      return;
    }

    try {
      await saveConvention({
        campaignId,
        auditedOrganization,
        sponsorOrganization,
        auditType,
        perimeter,
        constraints,
        mode
      });
      toast({ status: "success", title: "Convention enregistrée" });
    } catch (error) {
      toast({ status: "error", title: "Convention", description: String(error) });
    }
  }

  async function handleSaveScopingNote() {
    if (!campaignId) {
      toast({ status: "warning", title: "Aucune campagne sélectionnée", description: "Retournez à l'accueil pour choisir une campagne" });
      return;
    }

    try {
      await saveScopingNote({
        campaignId,
        objectives,
        assumptions,
        exclusions,
        stakeholders,
        planningConstraints
      });
      toast({ status: "success", title: "Note de cadrage enregistrée" });
    } catch (error) {
      toast({ status: "error", title: "Note de cadrage", description: String(error) });
    }
  }

  async function handleSaveAuditPlan() {
    if (!campaignId) {
      toast({ status: "warning", title: "Aucune campagne sélectionnée", description: "Retournez à l'accueil pour choisir une campagne" });
      return;
    }

    try {
      await saveAuditPlan({
        campaignId,
        objectives: planObjectives,
        scope,
        methods,
        samplingStrategy,
        logistics,
        communicationRules
      });
      toast({ status: "success", title: "Plan d’audit enregistré" });
    } catch (error) {
      toast({ status: "error", title: "Plan d’audit", description: String(error) });
    }
  }

  async function handleSaveTeam() {
    if (!campaignId) {
      toast({ status: "warning", title: "Aucune campagne sélectionnée", description: "Retournez à l'accueil pour choisir une campagne" });
      return;
    }

    try {
      setIsSavingTeam(true);
      await saveAuditTeam({ campaignId, memberIds: selectedTeamMemberIds });
      toast({ status: "success", title: "Equipe enregistrée" });
    } catch (error) {
      toast({ status: "error", title: "Equipe", description: String(error) });
    } finally {
      setIsSavingTeam(false);
    }
  }

  const documentsCompletion = useMemo(() => {
    const isFilled = (value: string) => value.trim().length > 0;

    const conventionComplete =
      isFilled(auditedOrganization) &&
      isFilled(sponsorOrganization) &&
      isFilled(perimeter);

    const scopingComplete =
      isFilled(objectives) &&
      isFilled(stakeholders) &&
      isFilled(planningConstraints);

    const planComplete =
      isFilled(planObjectives) &&
      isFilled(scope) &&
      isFilled(methods);

    const completedSections = [conventionComplete, scopingComplete, planComplete].filter(Boolean).length;
    const progress = Math.round((completedSections / 3) * 100);

    return {
      completedSections,
      progress,
      complete: completedSections === 3
    };
  }, [
    auditedOrganization,
    sponsorOrganization,
    perimeter,
    objectives,
    stakeholders,
    planningConstraints,
    planObjectives,
    scope,
    methods
  ]);

  const checklistComplete = checklistProgress === 100;
  const teamComplete = selectedTeamMemberIds.length > 0;
  const directoryComplete = auditDirectory.length > 0;
  const documentsComplete = documentsCompletion.complete;
  const completedTabs = [checklistComplete, teamComplete, directoryComplete, documentsComplete].filter(Boolean).length;
  const globalProgress = Math.round((completedTabs / 4) * 100);

  function statusBadge(complete: boolean, inProgress: boolean) {
    if (complete) {
      return <Badge colorScheme="green">Complet</Badge>;
    }
    if (inProgress) {
      return <Badge colorScheme="orange">En cours</Badge>;
    }
    return <Badge colorScheme="gray">À faire</Badge>;
  }

  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="md">Organisation</Heading>
        <Text color="gray.600" mt={1}>Gestion structurée par onglets: checklist, équipe, annuaire et documents.</Text>
      </Box>

      <Box bg="white" p={4} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <Stack direction={{ base: "column", md: "row" }} align={{ base: "flex-start", md: "center" }} justify="space-between" mb={2}>
          <Text fontSize="sm" color="gray.700" fontWeight="semibold">Progression Organisation</Text>
          <Badge colorScheme={globalProgress === 100 ? "green" : "orange"}>{completedTabs}/4 onglets complets</Badge>
        </Stack>
        <Progress value={globalProgress} size="sm" colorScheme="orange" rounded="md" />
      </Box>

      <Tabs variant="enclosed" colorScheme="orange" bg="white" borderWidth="1px" borderColor="gray.200" rounded="lg" p={4}>
        <TabList>
          <Tab>
            <HStack spacing={2}>
              <Text>Checklist</Text>
              {statusBadge(checklistComplete, checklistProgress > 0)}
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <Text>Equipe</Text>
              {statusBadge(teamComplete, selectedTeamMemberIds.length > 0)}
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <Text>Annuaire</Text>
              {statusBadge(directoryComplete, directoryComplete)}
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <Text>Documents</Text>
              {statusBadge(documentsComplete, documentsCompletion.progress > 0)}
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <PassiChecklist campaignId={campaignId} onProgressChange={setChecklistProgress} />
          </TabPanel>

          <TabPanel px={0}>
            <Box bg="white" p={2}>
              <Heading size="sm" mb={1}>Equipe</Heading>
              <Text fontSize="sm" color="gray.500" mb={4}>Sélection des auditeurs/experts pour la campagne en cours.</Text>

              {isLoadingTeamData ? (
                <HStack>
                  <Spinner size="sm" />
                  <Text fontSize="sm" color="gray.600">Chargement de l'annuaire...</Text>
                </HStack>
              ) : auditDirectory.length === 0 ? (
                <Text fontSize="sm" color="gray.500">Aucun membre dans l'annuaire. Ajoutez-les depuis Paramétrage.</Text>
              ) : (
                <VStack align="stretch" spacing={4}>
                  <CheckboxGroup value={selectedTeamMemberIds} onChange={(values) => setSelectedTeamMemberIds(values as string[])}>
                    <VStack align="stretch" spacing={2}>
                      {auditDirectory.map((member) => (
                        <Checkbox key={member.id} value={member.id}>
                          <HStack spacing={2}>
                            <Text>{member.fullName}</Text>
                            <Badge colorScheme={member.profile === "expert" ? "purple" : "orange"}>{member.profile}</Badge>
                            {member.email && <Text fontSize="xs" color="gray.500">({member.email})</Text>}
                          </HStack>
                        </Checkbox>
                      ))}
                    </VStack>
                  </CheckboxGroup>
                  <Box>
                    <Button colorScheme="blue" onClick={handleSaveTeam} isLoading={isSavingTeam}>Enregistrer l'équipe</Button>
                  </Box>
                </VStack>
              )}
            </Box>
          </TabPanel>

          <TabPanel px={0}>
            <Box bg="white" p={2}>
              <Heading size="sm" mb={1}>Annuaire</Heading>
              <Text fontSize="sm" color="gray.500" mb={4}>Référence en lecture seule de l'annuaire administré dans Paramétrage.</Text>

              {isLoadingTeamData ? (
                <HStack>
                  <Spinner size="sm" />
                  <Text fontSize="sm" color="gray.600">Chargement...</Text>
                </HStack>
              ) : auditDirectory.length === 0 ? (
                <Text fontSize="sm" color="gray.500">Aucun membre disponible.</Text>
              ) : (
                <VStack align="stretch" spacing={2}>
                  {auditDirectory.map((member) => (
                    <HStack key={member.id} justify="space-between" borderWidth="1px" borderColor="gray.200" rounded="md" px={3} py={2}>
                      <Text>{member.fullName}</Text>
                      <HStack spacing={2}>
                        <Badge colorScheme={member.profile === "expert" ? "purple" : "orange"}>{member.profile}</Badge>
                        <Text fontSize="xs" color="gray.500">{member.email || "-"}</Text>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              )}
            </Box>
          </TabPanel>

          <TabPanel px={0}>
            <Stack spacing={6}>
              <Box bg="white" p={2}>
                <Heading size="sm" mb={1}>Convention d'audit</Heading>
                <Text fontSize="sm" color="gray.500" mb={4}>Optionnelle selon le type d'audit (ex: audit de maturité).</Text>
                <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Organisation auditée</FormLabel>
                      <Input value={auditedOrganization} onChange={(event) => setAuditedOrganization(event.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Organisation sponsor</FormLabel>
                      <Input value={sponsorOrganization} onChange={(event) => setSponsorOrganization(event.target.value)} />
                    </FormControl>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Type d'audit</FormLabel>
                      <Select value={auditType} onChange={(event) => setAuditType(event.target.value as "interne" | "externe" | "mixte")}> 
                        <option value="interne">Interne</option>
                        <option value="externe">Externe</option>
                        <option value="mixte">Mixte</option>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Mode</FormLabel>
                      <Select value={mode} onChange={(event) => setMode(event.target.value as "sur-site" | "distance" | "hybride")}> 
                        <option value="sur-site">Sur site</option>
                        <option value="distance">Distance</option>
                        <option value="hybride">Hybride</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel fontSize="sm">Périmètre</FormLabel>
                    <Input value={perimeter} onChange={(event) => setPerimeter(event.target.value)} />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Contraintes</FormLabel>
                    <Input value={constraints} onChange={(event) => setConstraints(event.target.value)} />
                  </FormControl>

                  <Box>
                    <Button colorScheme="blue" onClick={handleSaveConvention}>Enregistrer la convention (optionnel)</Button>
                  </Box>
                </VStack>
              </Box>

              <Box bg="white" p={2}>
                <Heading size="sm" mb={4}>Note de cadrage</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel fontSize="sm">Objectifs</FormLabel>
                    <Input value={objectives} onChange={(event) => setObjectives(event.target.value)} />
                  </FormControl>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Hypothèses</FormLabel>
                      <Input value={assumptions} onChange={(event) => setAssumptions(event.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Exclusions</FormLabel>
                      <Input value={exclusions} onChange={(event) => setExclusions(event.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Parties prenantes</FormLabel>
                      <Input value={stakeholders} onChange={(event) => setStakeholders(event.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Contraintes de planning</FormLabel>
                      <Input value={planningConstraints} onChange={(event) => setPlanningConstraints(event.target.value)} />
                    </FormControl>
                  </SimpleGrid>
                  <Box>
                    <Button colorScheme="blue" onClick={handleSaveScopingNote}>Enregistrer la note de cadrage</Button>
                  </Box>
                </VStack>
              </Box>

              <Box bg="white" p={2}>
                <Heading size="sm" mb={4}>Plan d’audit</Heading>
                <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Objectifs</FormLabel>
                      <Input value={planObjectives} onChange={(event) => setPlanObjectives(event.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Périmètre</FormLabel>
                      <Input value={scope} onChange={(event) => setScope(event.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Méthodes</FormLabel>
                      <Input value={methods} onChange={(event) => setMethods(event.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Stratégie d'échantillonnage</FormLabel>
                      <Input value={samplingStrategy} onChange={(event) => setSamplingStrategy(event.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Logistique</FormLabel>
                      <Input value={logistics} onChange={(event) => setLogistics(event.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Règles de communication</FormLabel>
                      <Input value={communicationRules} onChange={(event) => setCommunicationRules(event.target.value)} />
                    </FormControl>
                  </SimpleGrid>
                  <Box>
                    <Button colorScheme="blue" onClick={handleSaveAuditPlan}>Enregistrer le plan d’audit</Button>
                  </Box>
                </VStack>
              </Box>
            </Stack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Stack>
  );
}
