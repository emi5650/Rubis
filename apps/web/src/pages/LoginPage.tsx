import { Alert, AlertIcon, Box, Button, FormControl, FormLabel, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthUser, clearSessionAdCredentials, login } from "../api/rubis";

type LoginPageProps = {
  onLogin: (user: AuthUser) => void;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await login({ username, password });
      clearSessionAdCredentials();
      localStorage.setItem("rubis.currentUser", JSON.stringify(result.user));
      onLogin(result.user);
      navigate("/", { replace: true });
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Échec de connexion";
      setError(message || "Échec de connexion");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.100" px={4}>
      <Box w="full" maxW="420px" bg="white" p={8} borderRadius="xl" boxShadow="md" as="form" onSubmit={handleSubmit}>
        <Stack spacing={6}>
          <Box>
            <Heading size="md" color="#CF022B">Connexion Rubis</Heading>
            <Text mt={2} fontSize="sm" color="gray.600">
              Connectez-vous pour associer toutes les actions à votre utilisateur.
            </Text>
          </Box>

          {error ? (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          ) : null}

          <FormControl isRequired>
            <FormLabel>Identifiant</FormLabel>
            <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="admin" autoComplete="username" />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Mot de passe</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </FormControl>

          <Button type="submit" bg="#CF022B" color="white" _hover={{ bg: "#B60226" }} isLoading={isSubmitting}>
            Se connecter
          </Button>

          <Text fontSize="xs" color="gray.500">Compte par défaut: admin / admin</Text>
        </Stack>
      </Box>
    </Box>
  );
}
