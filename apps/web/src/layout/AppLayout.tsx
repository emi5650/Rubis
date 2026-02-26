import { Box, Button, Drawer, DrawerBody, DrawerContent, DrawerOverlay, Flex, Icon, IconButton, Text, VStack, useDisclosure } from "@chakra-ui/react";
import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiMenu, FiHome } from "react-icons/fi";
import { MENU_ENTRIES } from "../config/menu";
import logoPassi from "../assets/logo_passi.png";
import logoSopra from "../assets/logo_sopra.png";
import { Campaign, getCampaigns } from "../api/rubis";

type AppLayoutProps = {
  children: ReactNode;
};

function Sidebar({ activeCampaign, onNavigate }: { activeCampaign: Campaign | null; onNavigate?: () => void }) {
  const navigate = useNavigate();
  
  return (
    <Flex direction="column" h="100%" bg="linear-gradient(180deg, #CF022B 0%, #F07D00 100%)" color="white" px={4} py={5}>
      <Box mb={4}>
        <Flex gap={2} align="center" mb={2}>
          <Box bg="white" rounded="md" px={2} py={1} flex="1" display="flex" justifyContent="center" alignItems="center" minH="44px">
            <Box as="img" src={logoSopra} alt="Sopra Steria" maxH="24px" w="auto" />
          </Box>
          <Box bg="white" rounded="md" px={2} py={1} w="64px" display="flex" justifyContent="center" alignItems="center" minH="44px">
            <Box as="img" src={logoPassi} alt="PASSI" maxH="28px" w="auto" />
          </Box>
        </Flex>
        <Text fontSize="sm" fontWeight="bold">Rubis</Text>
        <Text fontSize="xs" color="whiteAlpha.800">Audit Workspace</Text>
        <Box mt={2} p={2} rounded="md" bg="whiteAlpha.200">
          <Text fontSize="xs" fontWeight="semibold" noOfLines={1}>
            {activeCampaign?.name || "Aucune campagne active"}
          </Text>
          <Text fontSize="xs" color="whiteAlpha.900" noOfLines={1}>
            {activeCampaign?.projectCode || "Code projet non défini"}
          </Text>
        </Box>
      </Box>
      
      <Button 
        size="sm" 
        leftIcon={<Icon as={FiHome} />}
        variant="outline"
        colorScheme="whiteAlpha"
        mb={4}
        onClick={() => {
          navigate("/");
          onNavigate?.();
        }}
      >
        Changer de campagne
      </Button>

      <VStack spacing={2} align="stretch" flex={1} overflowY="auto" pr={1}>
        {MENU_ENTRIES.map((entry) => (
          <NavLink key={entry.id} to={entry.path} onClick={onNavigate}>
            {({ isActive }) => (
              <Flex
                align="center"
                gap={3}
                px={3}
                py={2.5}
                rounded="md"
                bg={isActive ? "white" : "transparent"}
                color={isActive ? "#CF022B" : "white"}
                fontWeight={isActive ? "semibold" : "normal"}
                _hover={{ bg: "white", color: "#CF022B" }}
                transition="all 0.15s ease"
              >
                <Icon as={entry.icon} boxSize={4} />
                <Text fontSize="sm">{entry.label}</Text>
              </Flex>
            )}
          </NavLink>
        ))}
      </VStack>

      <Box pt={4} borderTop="1px solid" borderColor="whiteAlpha.300" mt={4}>
        <Text fontSize="xs" color="whiteAlpha.700">Mode migration vers nouveau formalisme</Text>
      </Box>
    </Flex>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadActiveCampaign() {
      const activeCampaignId = localStorage.getItem("rubis.activeCampaignId") || "";
      if (!activeCampaignId) {
        if (mounted) {
          setActiveCampaign(null);
        }
        return;
      }

      try {
        const campaigns = await getCampaigns();
        if (!mounted) {
          return;
        }
        setActiveCampaign(campaigns.find((item) => item.id === activeCampaignId) || null);
      } catch {
        if (mounted) {
          setActiveCampaign(null);
        }
      }
    }

    void loadActiveCampaign();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Flex minH="100vh" bg="gray.100">
      <IconButton
        aria-label="Ouvrir le menu"
        icon={<FiMenu />}
        display={{ base: "inline-flex", md: "none" }}
        position="fixed"
        top={4}
        left={4}
        zIndex={20}
        onClick={onOpen}
      />

      <Box
        display={{ base: "none", md: "block" }}
        position="fixed"
        left={0}
        top={0}
        bottom={0}
        w="260px"
      >
        <Sidebar activeCampaign={activeCampaign} />
      </Box>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
        <DrawerOverlay backdropFilter="blur(4px)" />
        <DrawerContent>
          <DrawerBody p={0}>
            <Sidebar activeCampaign={activeCampaign} onNavigate={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Box as="main" flex="1" ml={{ base: 0, md: "260px" }} p={{ base: 4, md: 8 }} pt={{ base: 16, md: 6 }}>
        {children}
      </Box>
    </Flex>
  );
}
