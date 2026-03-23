# Backend

## Configuration

Créer un fichier `.env` dans `server/` avec :

```
PORT=4000
APP_BASE_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
FEDAPAY_PUBLIC_KEY=pk_test_your_public_key
FEDAPAY_SECRET_KEY=sk_test_your_secret_key
FEDAPAY_ENV=sandbox
FEDAPAY_WEBHOOK_SECRET=your_webhook_secret_optional
```

Appliquer le schéma Supabase (Postgres) :

```
server/sql/schema.sql
```

## Démarrer

```
npm install
npm run dev
```
