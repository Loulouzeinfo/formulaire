# Contacts

Application Next.js App Router, React, TypeScript, Tailwind CSS et Supabase.

## Démarrer en local

```sh
npm install
npm run dev
```

Ouvrir http://localhost:3000. `.env.local` doit contenir l’URL et la clé publique du projet Supabase DEV ; voir `.env.example`. Redémarrer le serveur après modification des variables.

## Fonctionnement

Connexion par e-mail et mot de passe avec un compte créé dans Supabase Authentication. La session est restaurée à la réouverture ; le bouton « Se déconnecter » termine la session sur ce navigateur.
Le carnet utilise désormais PostgreSQL Supabase DEV. Création, lecture, modification et suppression passent par le client public et les politiques RLS ; chaque compte accède à ses propres contacts. Les mises à jour de l’interface attendent la confirmation de Supabase.
Les anciens contacts `localStorage` sont conservés dans le navigateur mais ne sont ni affichés ni importés automatiquement.
La session navigateur ne constitue pas un contrôle d’accès serveur : la base applique les autorisations via RLS à chaque requête.

## Vérifications

```sh
npm run lint
npm run build
npm run typecheck
```

Test manuel avec votre compte, sans communiquer votre mot de passe :

1. Se connecter, ajouter un contact de test, vérifier la remise à zéro du formulaire.
2. Modifier ce contact, puis actualiser la liste.
3. Recharger la page : retrouver le contact sauvegardé.
4. Se déconnecter : le carnet ne doit plus être visible.
5. Se reconnecter : retrouver le contact ; le supprimer puis recharger pour confirmer sa suppression.
6. Avec un second compte de test, vérifier que le contact du premier compte n'est pas visible ni modifiable. Ce test d’isolation reste à réaliser avant validation complète des accès.

## Environnements

- LOCAL : application locale connectée au projet Supabase DEV confirmé `mzwkjwlxymkkeuikqeka`.
- DEV prévu : branche `dev`, Vercel Preview et ce même projet Supabase DEV.
- PROD prévu : branche `main`, Vercel Production et un projet Supabase distinct.

GitHub et Vercel restent à configurer. Aucun déploiement n’a été effectué.
Les migrations SQL et leur procédure manuelle sont dans `supabase/`. Aucune migration PROD automatique.
`.env.local` est ignoré par Git ; `.env.example` peut être versionné. Ne jamais utiliser une clé secrète ou un mot de passe PostgreSQL dans une variable `NEXT_PUBLIC_`.
Les secrets précédemment partagés doivent être renouvelés avant tout usage de données personnelles réelles.
