import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/config/db/migrations',
  schema: './src/config/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
});


