import { Box, Button, FormControl, FormLabel, Heading, HStack, Input, Select, SimpleGrid, Stack, Text, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { createInterviewee, createInterviewSlot, getInterviewees, getInterviewSlots } from "../api/rubis";

type EntretiensPageProps = {
  campaignId: string;
};

export function EntretiensPage({ campaignId }: EntretiensPageProps) {
  const toast = useToast();
  const [interviewees, setInterviewees] = useState<Array<{ id: string; fullName: string; role: string; email: string }>>([]);
  const [slots, setSlots] = useState<Array<{ id: string; title: string; startAt: string; endAt: string; mode: string; theme: string }>>([]);

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [entity, setEntity] = useState("");

  const [slotTitle, setSlotTitle] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [mode, setMode] = useState<"sur-site" | "distance" | "hybride">("hybride");
  const [room, setRoom] = useState("");
  const [teamsLink, setTeamsLink] = useState("");
  const [theme, setTheme] = useState("");
  const [criterionCode, setCriterionCode] = useState("");

  async function refreshData() {
    if (!campaignId) {
      setInterviewees([]);
      setSlots([]);
      return;
    }

    const [intervieweesData, slotsData] = await Promise.all([
      getInterviewees(campaignId),
      getInterviewSlots(campaignId)
    ]);

    setInterviewees(intervieweesData);
    setSlots(slotsData);
  }

  useEffect(() => {
    refreshData().catch((error) => {
      toast({ status: "error", title: "Chargement entretiens", description: String(error) });
    });
  }, [campaignId]);

  async function handleCreateInterviewee() {
    if (!campaignId) {
      toast({ status: "warning", title: "Sélectionne une campagne" });
      return;
    }

    try {
      await createInterviewee({ campaignId, fullName, role, email, entity });
      setFullName("");
      setRole("");
      setEmail("");
      setEntity("");
      await refreshData();
      toast({ status: "success", title: "Interviewé ajouté" });
    } catch (error) {
      toast({ status: "error", title: "Interviewé", description: String(error) });
    }
  }

  async function handleCreateSlot() {
    if (!campaignId) {
      toast({ status: "warning", title: "Sélectionne une campagne" });
      return;
    }

    try {
      await createInterviewSlot({ campaignId, title: slotTitle, startAt, endAt, mode, room, teamsLink, theme, criterionCode });
      setSlotTitle("");
      setStartAt("");
      setEndAt("");
      setTheme("");
      setCriterionCode("");
      await refreshData();
      toast({ status: "success", title: "Créneau ajouté" });
    } catch (error) {
      toast({ status: "error", title: "Créneau", description: String(error) });
    }
  }

  return (
    <Stack spacing={6}>
      <Heading size="md">Entretiens</Heading>
      <Text color="gray.600">Pilotage des interviewés et des créneaux d’entretien.</Text>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <Heading size="sm" mb={4}>Interviewés</Heading>
        <VStack spacing={4} align="stretch" mb={4}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm">Nom complet</FormLabel>
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Rôle</FormLabel>
              <Input value={role} onChange={(event) => setRole(event.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Email</FormLabel>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Entité</FormLabel>
              <Input value={entity} onChange={(event) => setEntity(event.target.value)} />
            </FormControl>
          </SimpleGrid>
          <Box>
            <Button colorScheme="blue" onClick={handleCreateInterviewee}>Ajouter</Button>
          </Box>
        </VStack>
        <Stack spacing={2}>
          {interviewees.map((item) => (
            <Text key={item.id} fontSize="sm">{item.fullName} — {item.role} ({item.email})</Text>
          ))}
          {interviewees.length === 0 && <Text color="gray.500" fontSize="sm">Aucun interviewé.</Text>}
        </Stack>
      </Box>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <Heading size="sm" mb={4}>Créneaux</Heading>
        <VStack spacing={4} align="stretch" mb={4}>
          <FormControl>
            <FormLabel fontSize="sm">Titre</FormLabel>
            <Input value={slotTitle} onChange={(event) => setSlotTitle(event.target.value)} />
          </FormControl>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm">Début</FormLabel>
              <Input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Fin</FormLabel>
              <Input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} />
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
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm">Salle</FormLabel>
              <Input value={room} onChange={(event) => setRoom(event.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Lien Teams</FormLabel>
              <Input value={teamsLink} onChange={(event) => setTeamsLink(event.target.value)} />
            </FormControl>
          </SimpleGrid>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm">Thème</FormLabel>
              <Input value={theme} onChange={(event) => setTheme(event.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Code critère</FormLabel>
              <Input value={criterionCode} onChange={(event) => setCriterionCode(event.target.value)} />
            </FormControl>
          </SimpleGrid>
          
          <Box>
            <Button colorScheme="blue" onClick={handleCreateSlot}>Ajouter le créneau</Button>
          </Box>
        </VStack>
        <Stack spacing={2}>
          {slots.map((slot) => (
            <Text key={slot.id} fontSize="sm">{slot.title} — {slot.startAt} → {slot.endAt} ({slot.mode})</Text>
          ))}
          {slots.length === 0 && <Text color="gray.500" fontSize="sm">Aucun créneau.</Text>}
        </Stack>
      </Box>
    </Stack>
  );
}
