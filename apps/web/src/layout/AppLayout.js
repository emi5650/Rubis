import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Drawer, DrawerBody, DrawerContent, DrawerOverlay, Flex, Icon, IconButton, Text, VStack, useDisclosure } from "@chakra-ui/react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiMenu, FiHome } from "react-icons/fi";
import { MENU_ENTRIES } from "../config/menu";
function Sidebar({ onNavigate }) {
    const navigate = useNavigate();
    return (_jsxs(Flex, { direction: "column", h: "100%", bg: "brand.900", color: "white", px: 4, py: 5, children: [_jsxs(Box, { mb: 4, children: [_jsx(Text, { fontSize: "lg", fontWeight: "bold", children: "Rubis" }), _jsx(Text, { fontSize: "xs", color: "whiteAlpha.700", children: "Audit Workspace" })] }), _jsx(Button, { size: "sm", leftIcon: _jsx(Icon, { as: FiHome }), variant: "outline", colorScheme: "whiteAlpha", mb: 4, onClick: () => {
                    navigate("/");
                    onNavigate?.();
                }, children: "Changer de campagne" }), _jsx(VStack, { spacing: 2, align: "stretch", flex: 1, overflowY: "auto", pr: 1, children: MENU_ENTRIES.map((entry) => (_jsx(NavLink, { to: entry.path, onClick: onNavigate, children: ({ isActive }) => (_jsxs(Flex, { align: "center", gap: 3, px: 3, py: 2.5, rounded: "md", bg: isActive ? "white" : "transparent", color: isActive ? "blue.600" : "white", fontWeight: isActive ? "semibold" : "normal", _hover: { bg: "white", color: "blue.600" }, transition: "all 0.15s ease", children: [_jsx(Icon, { as: entry.icon, boxSize: 4 }), _jsx(Text, { fontSize: "sm", children: entry.label })] })) }, entry.id))) }), _jsx(Box, { pt: 4, borderTop: "1px solid", borderColor: "whiteAlpha.300", mt: 4, children: _jsx(Text, { fontSize: "xs", color: "whiteAlpha.700", children: "Mode migration vers nouveau formalisme" }) })] }));
}
export function AppLayout({ children }) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    return (_jsxs(Flex, { minH: "100vh", bg: "gray.100", children: [_jsx(IconButton, { "aria-label": "Ouvrir le menu", icon: _jsx(FiMenu, {}), display: { base: "inline-flex", md: "none" }, position: "fixed", top: 4, left: 4, zIndex: 20, onClick: onOpen }), _jsx(Box, { display: { base: "none", md: "block" }, position: "fixed", left: 0, top: 0, bottom: 0, w: "260px", children: _jsx(Sidebar, {}) }), _jsxs(Drawer, { isOpen: isOpen, placement: "left", onClose: onClose, size: "xs", children: [_jsx(DrawerOverlay, { backdropFilter: "blur(4px)" }), _jsx(DrawerContent, { children: _jsx(DrawerBody, { p: 0, children: _jsx(Sidebar, { onNavigate: onClose }) }) })] }), _jsxs(Box, { as: "main", flex: "1", ml: { base: 0, md: "260px" }, p: { base: 4, md: 8 }, pt: { base: 16, md: 6 }, children: [_jsx(Flex, { align: "center", justify: "flex-end", bg: "white", borderWidth: "1px", borderColor: "gray.200", rounded: "lg", px: 4, py: 3, mb: 6, position: "sticky", top: { base: 4, md: 6 }, zIndex: 10, children: _jsx(Button, { as: NavLink, to: "/administration", colorScheme: "blue", size: "sm", children: "Administration" }) }), children] })] }));
}
