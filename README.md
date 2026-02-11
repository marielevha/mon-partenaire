This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Pages utilitaires

- `/politique` : politique de confidentialité.
- `/conditions` : conditions générales d'utilisation.
- `/a-propos` : présentation du projet et formulaire de contact.

## Dernières évolutions (Dashboard)

- Dashboard autonome (layout séparé du landing) avec sidebar + topbar.
- Navigation dashboard structurée : `Vue d'ensemble` et `Créer un projet`.
- Liste des projets enrichie :
  - indicateurs clés (totaux, statuts, besoins ouverts, capital cumulé),
  - pagination configurable (`10`, `25`, `50`, `100`),
  - actions de statut par projet.
- Page complète de création de projet avec :
  - formulaire étendu (catégorie, visibilité, modèle, forme légale, capital),
  - sections upload images/documents,
  - spinner sur le bouton de soumission,
  - pré-remplissage des champs pour faciliter les tests.
- Thématisation dashboard (clair/sombre) avec bouton de bascule.
- Dropdown utilisateur topbar :
  - affichage `full_name` + email,
  - liens `Dashboard`, `Profil`, `Support`, `Accueil`,
  - action `Se déconnecter`.
- Corrections UX/UI :
  - contraste badges catégorie/statut en mode clair,
  - harmonisation visuelle globale des composants dashboard.

### Formulaire de contact

- Endpoint : `POST /api/contact`.
- Stockage : fichier local `.data/contact-messages.json` (MVP, pas d'envoi email).
- Validation côté client et côté serveur.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
