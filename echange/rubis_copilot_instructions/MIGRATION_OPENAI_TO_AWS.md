# Passer facilement de “IA web (OpenAI API)” à “IA sur Amazon (AWS)” ?

Oui, si tu appliques ces règles dès le POC :

## 1) Abstraction Provider
Créer une interface unique côté API, par ex :
- `LLMProvider.generateJSON(...)`
- `EmbeddingProvider.embed(...)`

Puis implémentations :
- OpenAIProvider (web/API)
- AWSHostedProvider (ton modèle sur EC2/EKS via HTTP)
- OllamaProvider (local)

## 2) Même contrat d’E/S (critique)
La sortie attendue doit rester identique (Zod schemas).
Le provider ne fait que :
- recevoir prompt + contexte + contraintes
- retourner JSON conforme

## 3) Déploiement AWS du modèle
Sur AWS, tu peux exposer ton modèle en API interne :
- EC2 + docker + vLLM/llama.cpp + FastAPI
ou
- EKS + service interne

Rubis ne change presque pas : il appelle un autre endpoint.

## 4) RAG inchangé
Ton index (embeddings + vector store) peut rester dans Rubis.
Seul le composant LLM change.

## 5) Attention (différences à anticiper)
- Les embeddings doivent venir du même provider ou être remplacés (OpenAI -> local embeddings).
- Les tokens/latences changent : gérer timeouts et retry.
- Gestion des secrets : AWS Secrets Manager / Parameter Store.

## Stratégie recommandée
POC : OpenAI (rapidité)
V1 interne : LLM sur AWS (EC2/EKS) + embeddings locaux
V2 souveraine : on-prem/OVH + isolation réseau stricte
