import { Badge, Box, Button, FormControl, FormLabel, Heading, Input, Stack, Text, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getOpenAiKeyStatus, setOpenAiKey } from "../api/rubis";

type AdministrationPageProps = {
  campaignId: string;
};

export function AdministrationPage({ campaignId }: AdministrationPageProps) {
  const toast = useToast();
  const [apiKey, setApiKey] = useState("");
  const [configured, setConfigured] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    getOpenAiKeyStatus()
      .then((status) => {
        setConfigured(status.configured);
        setUpdatedAt(status.updatedAt);
      })
      .catch((error) => {
        toast({ status: "error", title: "Chargement clé OpenAI", description: String(error) });
      });
  }, []);

  async function handleSaveKey() {
    if (!apiKey.trim()) {
      toast({ status: "warning", title: "Clé API requise" });
      return;
    }

    try {
      const result = await setOpenAiKey(apiKey.trim());
      setConfigured(result.configured);
      setUpdatedAt(new Date().toISOString());
      setApiKey("");
      toast({ status: "success", title: "Clé OpenAI enregistrée" });
    } catch (error) {
      toast({ status: "error", title: "Clé OpenAI", description: String(error) });
    }
  }

  return (
    <Stack spacing={6}>
      <Heading size="md">Administration</Heading>
      <Text color="gray.600">Gestion des accès et des intégrations externes.</Text>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <VStack spacing={4} align="stretch">
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">Clé API OpenAI</Text>
            <Badge colorScheme={configured ? "green" : "red"} mt={1}>
              {configured ? "Configurée" : "Non configurée"}
            </Badge>
            {updatedAt && (
              <Text fontSize="xs" color="gray.500" mt={1}>
                Derniere mise a jour : {new Date(updatedAt).toLocaleString("fr-FR")}
              </Text>
            )}
          </Box>

          <FormControl>
            <FormLabel fontSize="sm">Nouvelle clé OpenAI</FormLabel>
            <Input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="sk-..."
            />
          </FormControl>

          <Box>
            <Button colorScheme="blue" onClick={handleSaveKey}>Enregistrer la clé</Button>
          </Box>
        </VStack>
      </Box>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <Text fontSize="sm" color="gray.600">
          Campagne active : {campaignId || "Aucune campagne sélectionnée"}
        </Text>
      </Box>
    </Stack>
  );
}
