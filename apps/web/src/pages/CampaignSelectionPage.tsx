import { Box, Button, Card, CardBody, Divider, FormControl, FormLabel, Heading, Input, Select, SimpleGrid, Text, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Campaign, createCampaign, getCampaigns } from "../api/rubis";

type CampaignSelectionPageProps = {
  onCampaignChange: (campaignId: string) => void;
};

export function CampaignSelectionPage({ onCampaignChange }: CampaignSelectionPageProps) {
  const toast = useToast();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const projectCodePattern = /^[A-Za-z0-9_]+-\d{6}-[A-Za-z0-9_]+-[A-Za-z0-9_-]+$/;
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  
  const [name, setName] = useState("");
  const [projectCode, setProjectCode] = useState("");

  async function refreshCampaigns() {
    const data = await getCampaigns();
    setCampaigns(data);
  }

  useEffect(() => {
    refreshCampaigns().catch((error) => {
      toast({ status: "error", title: "Chargement campagnes", description: String(error) });
    });
  }, []);

  async function handleCreateCampaign() {
    if (!name.trim()) {
      toast({ status: "warning", title: "Le nom de la campagne est requis" });
      return;
    }

    if (!projectCode.trim()) {
      toast({ status: "warning", title: "Le code projet est requis" });
      return;
    }

    if (!projectCodePattern.test(projectCode.trim())) {
      toast({
        status: "warning",
        title: "Format code projet invalide",
        description: "Format attendu: ID_Client-999999-Client-Mention"
      });
      return;
    }

    try {
      const created = await createCampaign({
        name: name.trim(),
        projectCode: projectCode.trim().toUpperCase()
      });
      await refreshCampaigns();
      onCampaignChange(created.id);
      setName("");
      setProjectCode("");
      toast({ status: "success", title: "Campagne créée" });
      navigate("/organisation");
    } catch (error) {
      toast({ status: "error", title: "Création campagne", description: String(error) });
    }
  }

  function handleSelectCampaign() {
    if (!selectedCampaignId) {
      toast({ status: "warning", title: "Veuillez sélectionner une campagne" });
      return;
    }
    
    onCampaignChange(selectedCampaignId);
    toast({ status: "success", title: "Campagne sélectionnée" });
    navigate("/organisation");
  }

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center" p={4}>
      <Box maxW="900px" w="100%">
        <VStack spacing={6} align="stretch">
          <Box textAlign="center" mb={4}>
            <Heading size="xl" mb={2} color="brand.900">Rubis Audit</Heading>
            <Text color="gray.600">Choisis une campagne existante ou crée une nouvelle campagne.</Text>
            <Text color="gray.500" fontSize="sm" mt={1}>Le référentiel d’audit sera saisi à l’étape suivante.</Text>
            <Button colorScheme="blue" size="sm" mt={3} onClick={() => navigate("/administration")}>
              Administration
            </Button>
          </Box>

          <Card>
            <CardBody>
              <VStack spacing={5} align="stretch">
                <Box>
                  <Heading size="md" mb={1}>Sélectionner une campagne existante</Heading>
                  <Text fontSize="sm" color="gray.500" mb={4}>Reprendre une campagne d'audit en cours</Text>
                  
                  <VStack spacing={3} align="stretch">
                    <FormControl>
                      <FormLabel fontSize="sm">Campagne</FormLabel>
                      <Select 
                        value={selectedCampaignId} 
                        onChange={(event) => setSelectedCampaignId(event.target.value)}
                        placeholder={campaigns.length === 0 ? "Aucune campagne disponible" : "Choisir une campagne..."}
                        size="lg"
                      >
                        {campaigns.map((campaign) => (
                          <option key={campaign.id} value={campaign.id}>
                            {campaign.name} ({campaign.projectCode || "N/A"})
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <Button 
                      colorScheme="blue" 
                      size="lg" 
                      onClick={handleSelectCampaign}
                      isDisabled={!selectedCampaignId}
                    >
                      Ouvrir cette campagne
                    </Button>
                  </VStack>
                </Box>
                
                <Divider />
                
                <Box>
                  <Heading size="md" mb={1}>Créer une nouvelle campagne</Heading>
                  <Text fontSize="sm" color="gray.500" mb={4}>Démarrer une nouvelle campagne d'audit</Text>
                  
                  <VStack spacing={4} align="stretch">
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Nom de la campagne</FormLabel>
                        <Input 
                          placeholder="Ex: Audit ISO 27001 - 2026 Q1" 
                          value={name} 
                          onChange={(event) => setName(event.target.value)}
                          size="lg"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Code projet</FormLabel>
                        <Input
                          placeholder="Ex: ID_Client-999999-Client-Mention"
                          value={projectCode}
                          onChange={(event) => setProjectCode(event.target.value)}
                          size="lg"
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Format habituel: ID_Client-999999-Client-Mention
                        </Text>
                      </FormControl>
                    </SimpleGrid>
                    
                    <Button 
                      colorScheme="green" 
                      size="lg" 
                      onClick={handleCreateCampaign}
                      isDisabled={!name.trim() || !projectCode.trim()}
                    >
                      Créer et commencer
                    </Button>
                  </VStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </Box>
  );
}
