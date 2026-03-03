
# Rubis — AD People Directory Module (v2)

Includes:
- AD/LDAP routes skeleton
- People directory routes skeleton
- CSV export endpoint placeholder
- RGPD retention config + purge endpoints placeholders
- Frontend pages skeleton (directory, detail, retention dashboard)
- Shared types (PeopleRecord, PeopleEvent, ImportJob)

Next steps for Copilot:
1) Implement ldapts client in services.adClient.ts
2) Implement lowdb store + events
3) Implement CSV streaming export in /api/people/export.csv
4) Implement retention computation + expired listing + purge (dryRun)
5) Wire UI to API

Offline-only. Do not log secrets.
