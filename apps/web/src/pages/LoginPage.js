import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Alert, AlertIcon, Box, Button, FormControl, FormLabel, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSessionAdCredentials, login } from "../api/rubis";
export function LoginPage({ onLogin }) {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            const result = await login({ username, password });
            clearSessionAdCredentials();
            localStorage.setItem("rubis.currentUser", JSON.stringify(result.user));
            onLogin(result.user);
            navigate("/", { replace: true });
        }
        catch (submissionError) {
            const message = submissionError instanceof Error ? submissionError.message : "Échec de connexion";
            setError(message || "Échec de connexion");
        }
        finally {
            setIsSubmitting(false);
        }
    }
    return (_jsx(Box, { minH: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bg: "gray.100", px: 4, children: _jsx(Box, { w: "full", maxW: "420px", bg: "white", p: 8, borderRadius: "xl", boxShadow: "md", as: "form", onSubmit: handleSubmit, children: _jsxs(Stack, { spacing: 6, children: [_jsxs(Box, { children: [_jsx(Heading, { size: "md", color: "#CF022B", children: "Connexion Rubis" }), _jsx(Text, { mt: 2, fontSize: "sm", color: "gray.600", children: "Connectez-vous pour associer toutes les actions \u00E0 votre utilisateur." })] }), error ? (_jsxs(Alert, { status: "error", borderRadius: "md", children: [_jsx(AlertIcon, {}), error] })) : null, _jsxs(FormControl, { isRequired: true, children: [_jsx(FormLabel, { children: "Identifiant" }), _jsx(Input, { value: username, onChange: (event) => setUsername(event.target.value), placeholder: "admin", autoComplete: "username" })] }), _jsxs(FormControl, { isRequired: true, children: [_jsx(FormLabel, { children: "Mot de passe" }), _jsx(Input, { type: "password", value: password, onChange: (event) => setPassword(event.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", autoComplete: "current-password" })] }), _jsx(Button, { type: "submit", bg: "#CF022B", color: "white", _hover: { bg: "#B60226" }, isLoading: isSubmitting, children: "Se connecter" }), _jsx(Text, { fontSize: "xs", color: "gray.500", children: "Compte par d\u00E9faut: admin / admin" })] }) }) }));
}
