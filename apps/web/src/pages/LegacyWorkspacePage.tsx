import { Heading, Stack, Text } from "@chakra-ui/react";
import { App as LegacyRubisApp } from "../App";

export function LegacyWorkspacePage() {
  return (
    <Stack spacing={4}>
      <Heading size="md">Workspace Rubis (legacy)</Heading>
      <Text color="gray.600">Version existante conservée pendant la migration vers le nouveau formalisme.</Text>
      <LegacyRubisApp />
    </Stack>
  );
}
