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

## Lancement avec Docker Compose

Le projet peut être lancé avec l'application + MinIO en une commande:

```bash
docker compose up --build
```

Services exposés:

- App Next.js: `http://localhost:3000`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

Le bucket MinIO est créé automatiquement au démarrage (`S3_BUCKET`), avec accès lecture anonyme pour les téléchargements publics.

## Environment Variables

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Logging configurable (YAML/JSON)

Le projet inclut un système de logs structurés (JSON) avec:

- corrélation `requestId` (middleware),
- redaction des champs sensibles,
- niveaux (`trace`, `debug`, `info`, `warn`, `error`, `fatal`),
- sorties console + fichier avec rotation par taille.

Configuration par défaut: `config/logging.yaml`.

Vous pouvez aussi charger un autre fichier via `LOG_CONFIG_PATH` (support `.yaml`, `.yml`, `.json`).

Variables d’override principales:

```bash
LOG_ENABLED=true
LOG_LEVEL=info
LOG_SERVICE_NAME=mon-partenaire
LOG_ENVIRONMENT=development
LOG_REQUEST_ID_HEADER=x-request-id
LOG_REDACT_PATHS=headers.authorization,headers.cookie,payload.password

LOG_CONSOLE_ENABLED=true
LOG_FILE_ENABLED=false
LOG_FILE_PATH=./logs/app.log
LOG_FILE_MAX_SIZE_MB=20
LOG_FILE_MAX_FILES=10
```

## Notifications email (projets incohérents)

Le bouton `Notifier` envoie toujours une notification interne dashboard.
En plus, vous pouvez activer l'email propriétaire via Resend:

```bash
NOTIFICATION_EMAIL_ENABLED=true
NOTIFICATION_EMAIL_PROVIDER=resend
NOTIFICATION_EMAIL_FROM="Mon partenaire <no-reply@votre-domaine.com>"
NOTIFICATION_EMAIL_REPLY_TO="support@votre-domaine.com" # optionnel
RESEND_API_KEY=re_xxxxxxxxx

# optionnel: utilisé dans les liens des emails
APP_BASE_URL=https://votre-domaine.com
```

Si la config email est absente/invalide, la notification interne reste envoyée et l'échec email est journalisé.

Les fichiers de logs tournants sont ignorés par Git (`logs/`).

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

## Résumé des dernières modifications

- Création de projet branchée à la base de données via Server Action :
  - enregistrement des données métier dans `Project`,
  - statut initial par défaut : `DRAFT` (brouillon).
- Mise en place d'un stockage média S3/MinIO pour les images projet :
  - upload côté serveur avec signatures S3,
  - proxy de lecture via `GET /api/project-images/[...key]`,
  - affichage des images uploadées sur la page publique de détail projet.
- Nouvelle page d'édition projet dans le dashboard :
  - route : `/dashboard/projects/[id]/edit`,
  - formulaire pré-rempli avec les données existantes,
  - mise à jour des champs projet via action serveur sécurisée (owner check).
- Gestion avancée des images dans l'édition :
  - affichage des images déjà enregistrées,
  - suppression unitaire et action globale `Tout retirer`,
  - réordonnancement automatique des images restantes (cover + sort order).
- Prévisualisation client des nouvelles images sélectionnées avant soumission.
- Gestion complète des documents projet :
  - stockage et lecture via MinIO/S3 (`ProjectDocument`),
  - upload depuis création/édition,
  - suppression unitaire et `Tout retirer` dans l'édition,
  - section documents sur la page publique avec boutons `Prévisualiser` et `Télécharger`.
- Nouvelle API de documents : `GET /api/project-documents/[...key]`
  - support du mode inline avec `?preview=1`.
- Menu dashboard enrichi avec `Mes projets`.
- Nouvelle page dédiée `Mes projets` :
  - route : `/dashboard/projects`,
  - pagination `10/25/50/100`,
  - actions `Modifier`, `Voir page publique`, changement de statut.
- Navigation d'édition harmonisée :
  - fil d'ariane `Dashboard / Mes projets / Modifier le projet`,
  - entrée `Mes projets` active sur les routes d'édition.
- Correctif React : suppression de la boucle de rendu (`Maximum update depth exceeded`) dans `CreateProjectForm`.

## Dernières évolutions (Documents & Templates)

- Nouvelle page publique `/documents` pour explorer les modèles avec:
  - filtres intelligents (secteur, niveau, type, objectif, recherche),
  - mode `Téléchargement` et mode `Interactif` (création de projet pré-remplie).
- Nouvelle section dashboard `Templates documents`:
  - datatable moderne avec recherche, tri et pagination,
  - actions par ligne (`Modifier`, `Détails` via modal).
- Workflow complet de gestion des templates côté dashboard:
  - création: `/dashboard/document-templates/new`,
  - édition: `/dashboard/document-templates/[templateId]/edit`,
  - formulaire unifié create/edit avec validations serveur.
- Intégration upload de pièce jointe template sur MinIO/S3:
  - stockage des métadonnées dans `DocumentTemplate` (`attachedDocument*`),
  - remplacement/suppression du fichier existant,
  - détection automatique du `type de fichier` selon le document chargé.
- Téléchargement public branché sur le document réel:
  - route `GET /api/document-templates/[slug]` priorise le fichier MinIO attaché,
  - fallback automatique sur génération markdown si aucun fichier n'est joint.
- Navigation dashboard enrichie:
  - entrée `Templates documents`,
  - entrée dédiée `Ajouter un document`.

## Mise à jour récente (Projets & édition)

- Page publique `/projects` branchée sur les images réelles des projets:
  - récupération de la couverture depuis `ProjectImage` (priorité cover/sort order),
  - fallback visuel conservé si aucune image n'est disponible.
- Carte projet modernisée (`ProjectCard`):
  - rendu via `next/image`,
  - gestion d'erreur image avec fallback automatique.
- Section exemples de la landing page:
  - remplacement des 3 exemples statiques par 3 projets issus de la base,
  - logique de sélection: projets publiés/publics non clôturés en priorité, puis fallback sur les plus récents.
- Fiabilisation de la mise à jour projet (dashboard):
  - correction du câblage des Server Actions en mode édition,
  - gestion d'erreur robuste pour éviter les réponses serveur inattendues.
- Upload formulaire projet:
  - augmentation de `serverActions.bodySizeLimit` à `50mb`,
  - validation HTML alignée avec la validation serveur (`title`, `summary`, `description`) pour éviter la perte de fichiers après un aller-retour invalide.

## Mise à jour récente (Besoins & Parts)

- Structuration complète des besoins projet (`FINANCIAL`, `SKILL`, `MATERIAL`, `PARTNERSHIP`) avec UI dédiée:
  - section `Besoins` dans le formulaire projet,
  - ajout/suppression dynamique avant sauvegarde,
  - affichage groupé via composants `NeedsSection` et `NeedCard`.
- Validation serveur renforcée sur la création/édition:
  - règles métier par type de besoin (montant, quantité requise, description, tags),
  - contrôle de cohérence des parts: `parts porteur + parts besoins <= 100`.
- Ajout du pourcentage de parts du porteur (`ownerEquityPercent`) et migration SQL dédiée:
  - script `supabase/project_owner_equity_upgrade.sql`.
- Règle de clôture projet:
  - passage au statut `ARCHIVED` autorisé uniquement si `parts porteur + parts besoins == 100`.
- Dashboard et page détail enrichis avec les nouveaux indicateurs:
  - allocation des parts affichée,
  - statut `Archivé` désactivé tant que la répartition n'est pas complète,
  - sections `Plan de financement` et `Capital recherché` recalculées (capital mobilisé, restant, couverture, besoins financiers ouverts/comblés).
- UX formulaire améliorée:
  - correction boucle React (`Maximum update depth exceeded`) sur `/dashboard/projects/new`,
  - case `Entreprise déjà créée` décochée par défaut,
  - ajout d'aides contextuelles `?` sur les champs du formulaire projet et besoins.

## Mise à jour récente (i18n & navigation publique)

- Internationalisation centralisée des textes statiques avec 3 langues:
  - `fr` (français),
  - `en` (anglais),
  - `cg` (lingala).
- Nouveau module i18n:
  - dictionnaires: `src/i18n/messages/fr.ts`, `src/i18n/messages/en.ts`, `src/i18n/messages/cg.ts`,
  - résolution locale/cookie: `src/i18n/index.ts`.
- Sélecteur de langue dans le header (`FR / EN / CG`) avec persistance cookie:
  - endpoint: `GET /api/locale`,
  - composant: `components/landing/locale-switcher.tsx`.
- Correctif réseau/IP sur le changement de langue:
  - redirection basée sur `x-forwarded-host` / `x-forwarded-proto` pour éviter les retours forcés vers `localhost`.
- Navigation publique améliorée:
  - ajout de l'entrée `Accueil` en première position,
  - état actif du menu selon la route (`/`, `/projects*`, `/documents*`),
  - composant dédié: `components/landing/header-nav.tsx`.
- Accès public ouvert sans authentification:
  - `/projects`,
  - `/projects/[id]`.

## Mise à jour récente (Auth & UX)

- Internationalisation des pages d'authentification:
  - `login` et `signup` branchées sur i18n (`fr`, `en`, `cg`),
  - formulaires `LoginForm` et `SignupForm` localisés (labels, placeholders, boutons, textes contextuels).
- Amélioration UX des pages auth:
  - liens de bascule (`Se connecter` / `Créer un compte`) rendus plus visibles,
  - titre du bloc formulaire mis en évidence par un badge.
- Champ mot de passe amélioré:
  - remplacement du texte `Afficher / Masquer` par une icône oeil/oeil barré,
  - accessibilité conservée avec labels localisés (`aria-label`, `title`, `sr-only`).
- Correctif état session dans le header public:
  - après déconnexion, le dropdown utilisateur n'est plus affiché,
  - les boutons `Se connecter` et `Créer un compte` apparaissent correctement.

## Mise à jour récente (Profil dashboard, mobile & pilotage)

- Landing page mobile:
  - ajout d'un menu mobile complet (hamburger) dans le header public,
  - navigation disponible sur mobile: `Accueil`, `Explorer les projets`, `Documents`,
  - actions compte dans le menu mobile (dashboard, profil, support, login/signup, logout),
  - sélecteur de langue intégré au menu mobile (`FR/EN/CG`).
- Dashboard:
  - nouvelle page profil complète: `/dashboard/profile`,
  - formulaire d'édition du profil (nom complet, téléphone, avatar URL) avec validation serveur,
  - section compte (email, id, dates) et section activité (projets, publiés, besoins ouverts, templates),
  - nouveau formulaire sécurité pour la mise à jour du mot de passe depuis le dashboard (vérification du mot de passe actuel + validation du nouveau).
- Navigation:
  - ajout de l'entrée `Profil` dans le menu dashboard,
  - liens `Profil` des dropdowns (dashboard et header public connecté) redirigés vers `/dashboard/profile`.
- Pilotage:
  - ajout du graphique pie `Publiés: ouverts vs fermés (selon besoins validés)`,
  - amélioration de l'alignement et de la lisibilité des cartes graphiques (hauteurs homogènes, légendes stabilisées, grille responsive).

## Mise à jour récente (Notifications & ergonomie dashboard)

- Qualité projet:
  - nouvelle page `dashboard/pilotage/incoherences` avec datatable (recherche, pagination, tri par sévérité),
  - action `Notifier` par projet incohérent.
- Notifications internes dashboard:
  - centre de notifications `/dashboard/notifications`,
  - dropdown notifications en topbar avec badge non-lu,
  - actions `Marquer lu` / `Tout marquer lu`,
  - liens directs vers `Modifier le projet` et `Voir détail`.
- Notification email propriétaire:
  - envoi d'email en complément de la notification interne lors du clic `Notifier`,
  - support provider `Resend` via variables d'environnement (`NOTIFICATION_EMAIL_*`, `RESEND_API_KEY`),
  - fallback robuste: la notification interne reste envoyée même si l'email échoue.
- Navigation dashboard refondue:
  - menu structuré par blocs (`Pilotage`, `Projets`, `Documents`, `Compte`),
  - sections repliables/dépliables (accordion),
  - icônes sur chaque entrée du menu.
- Responsive dashboard amélioré:
  - menu mobile transformé en panneau flottant lisible (overlay, scroll interne, fermeture `X`/extérieur/`Esc`),
  - topbar et espacements/paddings adaptatifs mobile/tablette/desktop,
  - dropdowns (`notifications`, `menu utilisateur`) adaptés aux petits écrans,
  - champs de recherche datatables adaptatifs en largeur.
- Sidebar desktop:
  - bouton topbar pour réduire/déployer le menu latéral,
  - état mémorisé dans le navigateur,
  - raccourci clavier `Ctrl+B` / `Cmd+B` (hors champs de saisie).

## Mise à jour récente (RBAC rôles/permissions)

- Mise en place d'une base RBAC complète en base de données:
  - script SQL idempotent: `supabase/rbac.sql`,
  - tables: `Role`, `Permission`, `RolePermission`, `UserRole`,
  - fonctions SQL: `user_has_permission`, `user_has_role`,
  - trigger d'assignation automatique du rôle `member` pour chaque nouvel utilisateur.
- Rôles système seedés:
  - `member`, `operator`, `admin`, `super_admin`.
- Permissions centralisées côté application:
  - constantes: `src/lib/rbac/permissions.ts`,
  - helpers serveur: `src/lib/rbac/core.ts`, `src/lib/rbac/server.ts`.
- Dashboard branché au RBAC:
  - accès global contrôlé par `dashboard.access`,
  - menu dashboard filtré dynamiquement selon les permissions du user,
  - guards sur pages sensibles (`pilotage`, `incohérences`, `logs`, routes documents/projets),
  - guards sur actions serveurs critiques (création/modification projet, templates, notification incohérences).

### Activation RBAC

Exécuter dans Supabase SQL Editor:

```sql
-- collez ici le contenu complet de supabase/rbac.sql
```

Ou copier/coller directement le contenu de `supabase/rbac.sql`.

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
