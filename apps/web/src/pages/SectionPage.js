import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
export function SectionPage({ title, description }) {
    return (_jsxs(Stack, { spacing: 4, children: [_jsxs(Box, { bg: "white", rounded: "lg", shadow: "sm", p: 6, borderWidth: "1px", borderColor: "gray.200", children: [_jsx(Heading, { size: "md", mb: 2, children: title }), _jsx(Text, { color: "gray.600", children: description })] }), _jsxs(Box, { bg: "white", rounded: "lg", shadow: "sm", p: 6, borderWidth: "1px", borderColor: "gray.200", children: [_jsx(Heading, { size: "sm", mb: 3, children: "Transition Rubis" }), _jsx(Text, { color: "gray.600", mb: 4, children: "Cette section est pr\u00EAte dans le nouveau formalisme (layout, routing, th\u00E8me). Le workspace Rubis existant reste accessible pendant la migration fonctionnelle." }), _jsx(Button, { as: Link, to: "/legacy-workspace", children: "Ouvrir l\u2019espace Rubis existant" })] })] }));
}
