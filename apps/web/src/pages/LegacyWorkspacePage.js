import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Heading, Stack, Text } from "@chakra-ui/react";
import { App as LegacyRubisApp } from "../App";
export function LegacyWorkspacePage() {
    return (_jsxs(Stack, { spacing: 4, children: [_jsx(Heading, { size: "md", children: "Workspace Rubis (legacy)" }), _jsx(Text, { color: "gray.600", children: "Version existante conserv\u00E9e pendant la migration vers le nouveau formalisme." }), _jsx(LegacyRubisApp, {})] }));
}
