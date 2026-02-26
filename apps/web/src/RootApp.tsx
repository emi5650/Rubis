import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { CampaignSelectionPage } from "./pages/CampaignSelectionPage";
import { PreliminairePage } from "./pages/PreliminairePage";
import { PreparationPage } from "./pages/PreparationPage";
import { AnalyseDocumentairePage } from "./pages/AnalyseDocumentairePage";
import { EntretiensPage } from "./pages/EntretiensPage";
import { RedactionPage } from "./pages/RedactionPage";
import { ParametragePage } from "./pages/ParametragePage";
import { AdministrationPage } from "./pages/AdministrationPage";
import { LegacyWorkspacePage } from "./pages/LegacyWorkspacePage";
import theme from "./theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export function RootApp() {
  const [campaignId, setCampaignId] = useState(() => localStorage.getItem("rubis.activeCampaignId") || "");

  useEffect(() => {
    if (campaignId) {
      localStorage.setItem("rubis.activeCampaignId", campaignId);
    }
  }, [campaignId]);

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <HashRouter>
          <Routes>
            <Route path="/" element={<CampaignSelectionPage onCampaignChange={setCampaignId} />} />
            <Route path="/administration" element={<AdministrationPage campaignId={campaignId} />} />
            <Route path="/*" element={
              <AppLayout>
                <Routes>
                  <Route path="/organisation" element={<PreliminairePage campaignId={campaignId} onCampaignChange={setCampaignId} />} />
                  <Route path="/preliminaire" element={<Navigate to="/organisation" replace />} />
                  <Route path="/preparation" element={<PreparationPage campaignId={campaignId} />} />
                  <Route path="/analyse-documentaire" element={<AnalyseDocumentairePage campaignId={campaignId} />} />
                  <Route path="/entretiens" element={<EntretiensPage campaignId={campaignId} />} />
                  <Route path="/redaction" element={<RedactionPage campaignId={campaignId} />} />
                  <Route path="/parametrage" element={<ParametragePage campaignId={campaignId} />} />
                  <Route path="/administration" element={<AdministrationPage campaignId={campaignId} />} />
                  <Route path="/legacy-workspace" element={<LegacyWorkspacePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            } />
          </Routes>
        </HashRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}
