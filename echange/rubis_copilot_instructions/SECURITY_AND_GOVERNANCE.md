# Sécurité & gouvernance (POC OpenAI)

## Bonnes pratiques
- Utiliser exclusivement des données fictives/pseudonymisées (pack “École”).
- Ne jamais logger du contenu sensible (désactiver logs verbeux).
- Conserver les hash SHA256 des documents et un journal d’exécution (audit trail).
- Indiquer clairement : “IA = assistant, auditeur responsable”.

## À connaître sur l’API OpenAI (POC)
- Les plateformes de fournisseurs peuvent conserver des données pour la sûreté/anti-abus sur une durée limitée selon configuration.
- Pour un POC, rester sur du contenu “école”.

## Garde-fous IA
- Sorties JSON validées par Zod.
- Citations obligatoires et vérifiées (chunkId existant).
- Si la sortie ne passe pas le schéma : 1 retry avec instruction stricte.
- Sinon : erreur explicite.
