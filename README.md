# Dashboard de Metas - Teks Software

Estrutura inicial do projeto interno com React + Vite + Tailwind + Supabase.

## Stack

- React (Vite)
- Tailwind CSS v4
- Supabase (Database, Auth e Real-time)
- React Router

## Estrutura inicial

```txt
teks-dashboard-tv/
  public/
    _redirects
  src/
    app/
      AppRouter.jsx
    components/
      auth/
        ProtectedRoute.jsx
    lib/
      supabaseClient.js
    pages/
      AdminLoginPage.jsx
      AdminPanelPage.jsx
      TvDashboardPage.jsx
    App.jsx
    main.jsx
    index.css
  supabase/
    schema.sql
  .env.example
```

## Configurar ambiente local

1. Copie o exemplo de variaveis:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

2. Preencha no `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

3. Instale dependencias e rode:

```bash
npm install
npm run dev
```

## Rodar SQL no Supabase

1. Abra o projeto no Supabase.
2. Acesse `SQL Editor`.
3. Cole e execute o script de `supabase/schema.sql`.
4. Em `Database > Replication`, habilite real-time para `configuracoes_dashboard`.

## Deploy na Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- O arquivo `public/_redirects` ja esta incluso para funcionar com React Router:

```txt
/* /index.html 200
```

## Proximo passo

Implementar a logica completa:

- leitura e atualizacao em tempo real no `/tv`
- formularios completos do `/admin`
- persistencia de tema, metas e logo
