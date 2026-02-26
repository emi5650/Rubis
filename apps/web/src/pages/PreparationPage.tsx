import { Box, Button, FormControl, FormLabel, Heading, HStack, Input, Stack, Text, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { createCriterion, getCriteria } from "../api/rubis";

type PreparationPageProps = {
  campaignId: string;
};

export function PreparationPage({ campaignId }: PreparationPageProps) {
  const toast = useToast();
  const [criteria, setCriteria] = useState<Array<{ id: string; code: string; title: string; theme: string }>>([]);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");

  async function refreshCriteria() {
    if (!campaignId) {
      setCriteria([]);
      return;
    }

    const data = await getCriteria(campaignId);
    setCriteria(data);
  }

  useEffect(() => {
    refreshCriteria().catch((error) => {
      toast({ status: "error", title: "Chargement critères", description: String(error) });
    });
  }, [campaignId]);

  async function handleCreateCriterion() {
    if (!campaignId) {
      toast({ status: "warning", title: "Sélectionne une campagne" });
      return;
    }

    try {
      await createCriterion({ campaignId, code, title, theme });
      setCode("");
      setTitle("");
      setTheme("");
      await refreshCriteria();
      toast({ status: "success", title: "Critère ajouté" });
    } catch (error) {
      toast({ status: "error", title: "Création critère", description: String(error) });
    }
  }

  return (
    <Stack spacing={6}>
      <Heading size="md">Préparation</Heading>
      <Text color="gray.600">Structuration des critères d’audit.</Text>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <Heading size="sm" mb={4}>Critères</Heading>
        <VStack spacing={4} align="stretch" mb={4}>
          <HStack spacing={3}>
            <FormControl maxW="120px">
              <FormLabel fontSize="sm">Code</FormLabel>
              <Input value={code} onChange={(event) => setCode(event.target.value)} />
            </FormControl>
            <FormControl flex={1}>
              <FormLabel fontSize="sm">Titre</FormLabel>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </FormControl>
            <FormControl maxW="200px">
              <FormLabel fontSize="sm">Thème</FormLabel>
              <Input value={theme} onChange={(event) => setTheme(event.target.value)} />
            </FormControl>
            <Box pt={7}>
              <Button colorScheme="blue" onClick={handleCreateCriterion}>Ajouter</Button>
            </Box>
          </HStack>
        </VStack>
        <Stack spacing={2}>
          {criteria.map((criterion) => (
            <Text key={criterion.id} fontSize="sm">{criterion.code} — {criterion.title} ({criterion.theme})</Text>
          ))}
          {criteria.length === 0 && <Text color="gray.500" fontSize="sm">Aucun critère pour cette campagne.</Text>}
        </Stack>
      </Box>

    </Stack>
  );
}
