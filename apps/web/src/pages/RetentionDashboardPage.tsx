import {
  Box,
  Button,
  Heading,
  HStack,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  VStack
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getExpiredPeople, PersonRecord, purgeExpiredPeople } from "../api/rubis";

export function RetentionDashboardPage() {
  const toast = useToast();
  const [items, setItems] = useState<PersonRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  async function refreshExpired() {
    setIsLoading(true);
    try {
      const data = await getExpiredPeople(500);
      setItems(data.items);
    } catch (error) {
      toast({ status: "error", title: "Chargement rétention", description: String(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshExpired();
  }, []);

  async function handleDryRun() {
    setIsPurging(true);
    try {
      const result = await purgeExpiredPeople({ dryRun: true, limit: 500 });
      setPreviewCount(result.selectedCount);
      toast({ status: "info", title: "Dry-run purge", description: `${result.selectedCount} enregistrement(s) éligible(s)` });
    } catch (error) {
      toast({ status: "error", title: "Dry-run purge", description: String(error) });
    } finally {
      setIsPurging(false);
    }
  }

  async function handlePurge() {
    setIsPurging(true);
    try {
      const result = await purgeExpiredPeople({ dryRun: false, limit: 500 });
      toast({ status: "success", title: "Purge soft exécutée", description: `${result.selectedCount} enregistrement(s) marqués supprimés` });
      setPreviewCount(null);
      await refreshExpired();
    } catch (error) {
      toast({ status: "error", title: "Purge soft", description: String(error) });
    } finally {
      setIsPurging(false);
    }
  }

  return (
    <Stack spacing={6}>
      <Heading size="md">RGPD Retention</Heading>
      <Text color="gray.600">Suivi des enregistrements expirés et purge logique.</Text>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <VStack spacing={4} align="stretch">
          <HStack>
            <Button onClick={() => void handleDryRun()} isLoading={isPurging}>Dry-run purge expired</Button>
            <Button onClick={() => void handlePurge()} isLoading={isPurging}>Purge expired</Button>
            <Text fontSize="sm" color="gray.500">Expirés: {items.length}</Text>
            {previewCount !== null ? <Text fontSize="sm" color="gray.500">Prévisualisation: {previewCount}</Text> : null}
          </HStack>

          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Nom</Th>
                  <Th>Email</Th>
                  <Th>Campagne</Th>
                  <Th>Retention until</Th>
                  <Th>Statut</Th>
                </Tr>
              </Thead>
              <Tbody>
                {items.map((person) => (
                  <Tr key={person.id}>
                    <Td>{person.displayName || "-"}</Td>
                    <Td>{person.mail || "-"}</Td>
                    <Td>{person.campaignId || "-"}</Td>
                    <Td>{person.retentionUntil ? new Date(person.retentionUntil).toLocaleString("fr-FR") : "-"}</Td>
                    <Td>{person.deletedAt ? "deleted" : person.status || "unknown"}</Td>
                  </Tr>
                ))}
                {!isLoading && items.length === 0 ? (
                  <Tr>
                    <Td colSpan={5}>
                      <Text fontSize="sm" color="gray.500">Aucun enregistrement expiré.</Text>
                    </Td>
                  </Tr>
                ) : null}
              </Tbody>
            </Table>
          </Box>
        </VStack>
      </Box>
    </Stack>
  );
}
