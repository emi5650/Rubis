import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";

type SectionPageProps = {
  title: string;
  description: string;
};

export function SectionPage({ title, description }: SectionPageProps) {
  return (
    <Stack spacing={4}>
      <Box bg="white" rounded="lg" shadow="sm" p={6} borderWidth="1px" borderColor="gray.200">
        <Heading size="md" mb={2}>{title}</Heading>
        <Text color="gray.600">{description}</Text>
      </Box>

      <Box bg="white" rounded="lg" shadow="sm" p={6} borderWidth="1px" borderColor="gray.200">
        <Heading size="sm" mb={3}>Transition Rubis</Heading>
        <Text color="gray.600" mb={4}>
          Cette section est prête dans le nouveau formalisme (layout, routing, thème). Le workspace Rubis existant reste accessible pendant la migration fonctionnelle.
        </Text>
        <Button as={Link} to="/legacy-workspace">Ouvrir l’espace Rubis existant</Button>
      </Box>
    </Stack>
  );
}
