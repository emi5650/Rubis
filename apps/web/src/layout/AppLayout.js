import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Drawer, DrawerBody, DrawerContent, DrawerOverlay, Flex, Icon, IconButton, Text, VStack, useDisclosure } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiMenu, FiHome } from "react-icons/fi";
import { MENU_ENTRIES } from "../config/menu";
import logoPassi from "../assets/logo_passi.png";
import logoSopra from "../assets/logo_sopra.png";
import { getCampaigns } from "../api/rubis";
function Sidebar({ activeCampaign, onNavigate }) {
    const navigate = useNavigate();
    return (_jsxs(Flex, { direction: "column", h: "100%", bg: "linear-gradient(180deg, #CF022B 0%, #F07D00 100%)", color: "white", px: 4, py: 5, children: [_jsxs(Box, { mb: 4, children: [_jsxs(Flex, { gap: 2, align: "center", mb: 2, children: [_jsx(Box, { bg: "white", rounded: "md", px: 2, py: 1, flex: "1", display: "flex", justifyContent: "center", alignItems: "center", minH: "44px", children: _jsx(Box, { as: "img", src: logoSopra, alt: "Sopra Steria", maxH: "24px", w: "auto" }) }), _jsx(Box, { bg: "white", rounded: "md", px: 2, py: 1, w: "64px", display: "flex", justifyContent: "center", alignItems: "center", minH: "44px", children: _jsx(Box, { as: "img", src: logoPassi, alt: "PASSI", maxH: "28px", w: "auto" }) })] }), _jsx(Text, { fontSize: "sm", fontWeight: "bold", children: "Rubis" }), _jsx(Text, { fontSize: "xs", color: "whiteAlpha.800", children: "Audit Workspace" }), _jsxs(Box, { mt: 2, p: 2, rounded: "md", bg: "whiteAlpha.200", children: [_jsx(Text, { fontSize: "xs", fontWeight: "semibold", noOfLines: 1, children: activeCampaign?.name || "Aucune campagne active" }), _jsx(Text, { fontSize: "xs", color: "whiteAlpha.900", noOfLines: 1, children: activeCampaign?.projectCode || "Code projet non défini" })] })] }), _jsx(Button, { size: "sm", leftIcon: _jsx(Icon, { as: FiHome }), variant: "outline", colorScheme: "whiteAlpha", mb: 4, onClick: () => {
                    navigate("/");
                    onNavigate?.();
                }, children: "Changer de campagne" }), _jsx(VStack, { spacing: 2, align: "stretch", flex: 1, overflowY: "auto", pr: 1, children: MENU_ENTRIES.map((entry) => (_jsx(NavLink, { to: entry.path, onClick: onNavigate, children: ({ isActive }) => (_jsxs(Flex, { align: "center", gap: 3, px: 3, py: 2.5, rounded: "md", bg: isActive ? "white" : "transparent", color: isActive ? "#CF022B" : "white", fontWeight: isActive ? "semibold" : "normal", _hover: { bg: "white", color: "#CF022B" }, transition: "all 0.15s ease", children: [_jsx(Icon, { as: entry.icon, boxSize: 4 }), _jsx(Text, { fontSize: "sm", children: entry.label })] })) }, entry.id))) }), _jsx(Box, { pt: 4, borderTop: "1px solid", borderColor: "whiteAlpha.300", mt: 4, children: _jsx(Text, { fontSize: "xs", color: "whiteAlpha.700", children: "Mode migration vers nouveau formalisme" }) })] }));
}
export function AppLayout({ children }) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [activeCampaign, setActiveCampaign] = useState(null);
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
            }
            catch {
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
    return (_jsxs(Flex, { minH: "100vh", bg: "gray.100", children: [_jsx(IconButton, { "aria-label": "Ouvrir le menu", icon: _jsx(FiMenu, {}), display: { base: "inline-flex", md: "none" }, position: "fixed", top: 4, left: 4, zIndex: 20, onClick: onOpen }), _jsx(Box, { display: { base: "none", md: "block" }, position: "fixed", left: 0, top: 0, bottom: 0, w: "260px", children: _jsx(Sidebar, { activeCampaign: activeCampaign }) }), _jsxs(Drawer, { isOpen: isOpen, placement: "left", onClose: onClose, size: "xs", children: [_jsx(DrawerOverlay, { backdropFilter: "blur(4px)" }), _jsx(DrawerContent, { children: _jsx(DrawerBody, { p: 0, children: _jsx(Sidebar, { activeCampaign: activeCampaign, onNavigate: onClose }) }) })] }), _jsx(Box, { as: "main", flex: "1", ml: { base: 0, md: "260px" }, p: { base: 4, md: 8 }, pt: { base: 16, md: 6 }, children: children })] }));
}
