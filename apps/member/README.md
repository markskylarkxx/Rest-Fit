# 1. Migrate the DB for the two new models
cd apps/api
npx prisma migrate dev --name templates_and_prs
npx prisma generate

# Restart TS server in your editor: Cmd+Shift+P → "TypeScript: Restart TS Server"

# 2. Restart the API
npm run dev

# 3. Restart the member app in a second terminal
cd ../member
npm run dev