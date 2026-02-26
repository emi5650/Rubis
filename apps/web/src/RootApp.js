import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsxs(ChakraProvider, { theme: theme, children: [_jsx(ColorModeScript, { initialColorMode: theme.config.initialColorMode }), _jsx(HashRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(CampaignSelectionPage, { onCampaignChange: setCampaignId }) }), _jsx(Route, { path: "/administration", element: _jsx(AdministrationPage, { campaignId: campaignId }) }), _jsx(Route, { path: "/*", element: _jsx(AppLayout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/preliminaire", element: _jsx(PreliminairePage, { campaignId: campaignId, onCampaignChange: setCampaignId }) }), _jsx(Route, { path: "/preparation", element: _jsx(PreparationPage, { campaignId: campaignId }) }), _jsx(Route, { path: "/analyse-documentaire", element: _jsx(AnalyseDocumentairePage, { campaignId: campaignId }) }), _jsx(Route, { path: "/entretiens", element: _jsx(EntretiensPage, { campaignId: campaignId }) }), _jsx(Route, { path: "/redaction", element: _jsx(RedactionPage, { campaignId: campaignId }) }), _jsx(Route, { path: "/parametrage", element: _jsx(ParametragePage, { campaignId: campaignId }) }), _jsx(Route, { path: "/administration", element: _jsx(AdministrationPage, { campaignId: campaignId }) }), _jsx(Route, { path: "/legacy-workspace", element: _jsx(LegacyWorkspacePage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }) })] }) })] }) }));
}
