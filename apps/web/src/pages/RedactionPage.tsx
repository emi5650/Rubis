import { Box, Button, Divider, Heading, Stack, Text, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { generateReport, getAuditLog, getReports } from "../api/rubis";

type RedactionPageProps = {
  campaignId: string;
};

export function RedactionPage({ campaignId }: RedactionPageProps) {
  const toast = useToast();
  const [reports, setReports] = useState<Array<{ id: string; title: string; generatedAt: string; version: string }>>([]);
  const [logs, setLogs] = useState<Array<{ id: string; action: string; timestamp: string; details: string }>>([]);

  async function refreshData() {
    if (!campaignId) {
      setReports([]);
      setLogs([]);
      return;
    }

    const [reportsData, logsData] = await Promise.all([
      getReports(campaignId),
      getAuditLog(campaignId)
    ]);

    setReports(reportsData);
    setLogs(logsData.slice(0, 20));
  }

  useEffect(() => {
    refreshData().catch((error) => {
      toast({ status: "error", title: "Chargement rédaction", description: String(error) });
    });
  }, [campaignId]);

  async function handleGenerate() {
    if (!campaignId) {
      toast({ status: "warning", title: "Sélectionne une campagne" });
      return;
    }

    try {
      await generateReport(campaignId);
      await refreshData();
      toast({ status: "success", title: "Rapport généré" });
    } catch (error) {
      toast({ status: "error", title: "Génération rapport", description: String(error) });
    }
  }

  return (
    <Stack spacing={6}>
      <Heading size="md">Rédaction</Heading>
      <Text color="gray.600">Génération de rapports et consultation du journal d’audit.</Text>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <VStack spacing={4} align="stretch">
          <Box>
            <Heading size="sm" mb={2}>Générer un rapport</Heading>
            <Text fontSize="sm" color="gray.600" mb={3}>Crée un nouveau rapport d'audit pour cette campagne.</Text>
            <Button colorScheme="blue" onClick={handleGenerate}>Générer un rapport d'audit</Button>
          </Box>
          
          <Divider />
          
          <Box>
            <Heading size="sm" mb={3}>Rapports générés</Heading>
            <Stack spacing={2}>
              {reports.map((report) => (
                <Text key={report.id} fontSize="sm">{report.title} — {new Date(report.generatedAt).toLocaleString("fr-FR")} (v{report.version})</Text>
              ))}
              {reports.length === 0 && <Text color="gray.500" fontSize="sm">Aucun rapport généré.</Text>}
            </Stack>
          </Box>
        </VStack>
      </Box>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <Heading size="sm" mb={4}>Journal récent</Heading>
        <Stack spacing={2}>
          {logs.map((log) => (
            <Text key={log.id} fontSize="sm">{new Date(log.timestamp).toLocaleString("fr-FR")} — {log.action} — {log.details}</Text>
          ))}
          {logs.length === 0 && <Text color="gray.500" fontSize="sm">Aucun évènement de journal.</Text>}
        </Stack>
      </Box>
    </Stack>
  );
}
