# Archived SQL

These sprint setup scripts are superseded by Prisma migrations / schema in
`movie-aggregator-api/prisma/`. Kept for historical reference only — do not
apply on new environments. Prefer:

```bash
cd movie-aggregator-api
npx prisma migrate deploy
# or apply prisma/*.sql that ship with the API
```
