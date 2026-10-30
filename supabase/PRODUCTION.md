# Mise en service de supabase-contacts-prod

État : projet annoncé créé par l’utilisateur. Structure, règles RLS et authentification PROD non encore vérifiées. Aucun changement distant n’est effectué par ce fichier ou par un push Git.

## 1. Créer la structure dans PROD (action manuelle explicite)

Dans Supabase, sélectionner **supabase-contacts-prod** et vérifier son nom avant toute exécution.
Ouvrir **SQL Editor → New query**. Copier la migration complète `migrations/20261030000100_create_contacts.sql` et cliquer **Run** une seule fois.
Bien que son commentaire mentionne la première application en DEV, c’est la même migration validée qu’il faut appliquer sur ce nouveau projet PROD, après votre validation.
Résultat attendu : `Success. No rows returned`. En cas de table déjà existante, arrêter et examiner l’erreur, sans supprimer la table.
Ne pas exporter les contacts ni les utilisateurs de DEV.

Vérifier avec les requêtes de `supabase/README.md` que RLS est activé et que les quatre politiques existent. Cette inspection ne remplace pas les tests d’accès avec deux comptes.

## 2. Préparer les comptes PROD

Dans **Authentication → Users → Add user → Create new user**, créer le compte destiné à PROD. Conserver son mot de passe hors du dépôt et hors de la conversation.
Un compte DEV n’existe pas automatiquement dans PROD, même si vous utilisez la même adresse e-mail.
Pour un carnet privé, désactiver les nouvelles inscriptions publiques dans la configuration Auth : les comptes seront créés par l’administrateur. Ne pas activer les connexions anonymes.
Dans la configuration des URL Auth, renseigner l’URL finale de production comme Site URL ; n’autoriser que les URL de retour nécessaires. Le formulaire actuel utilise e-mail et mot de passe sans redirection.

## 3. Séparer les variables Vercel

Dans le même projet Vercel → **Settings → Environment Variables** :

| Variable | Preview, branche dev | Production |
| --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | URL Supabase DEV actuelle | URL de supabase-contacts-prod |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Clé publique DEV actuelle | Clé publique du projet PROD |

Ne pas sélectionner Production pour les valeurs DEV. Ne pas sélectionner Preview pour les valeurs PROD.
Ne jamais ajouter de secret, service_role, JWT secret ou mot de passe PostgreSQL à ces variables publiques.
Ne pas modifier `.env.local` : LOCAL utilise toujours DEV.
Chaque changement de variable nécessite un nouveau build pour être pris en compte.

Le code est identique entre DEV et PROD. Vercel injecte les valeurs selon la cible : aucune URL PROD ne doit être codée dans les composants ni dans un fichier versionné.
`next.config.ts` refuse un build Production connecté au projet DEV connu et refuse un build Preview connecté à une autre base que DEV. Ce contrôle protège contre une inversion DEV/PROD, mais ne vérifie pas à lui seul l’identité du nouveau projet PROD : vérifier ses valeurs dans le tableau de bord.
L’étiquette de l’interface utilise la cible Vercel réelle, et non le nom de la branche ou NODE_ENV.

## 4. Valider DEV, puis seulement autoriser PROD

Le redesign est poussé uniquement sur `dev`, donc à valider dans Vercel Preview : connexion, ajout, modification, rechargement, suppression, déconnexion, puis affichage mobile.
Après validation du design, configuration de la base PROD, renouvellement des secrets DEV exposés et test des règles d’isolation, ouvrir une Pull Request `dev` vers `main`.
Ne pas fusionner avant accord explicite : Vercel déploie automatiquement la branche `main` en Production.
La migration PROD reste manuelle et doit être validée séparément. Aucun push ne doit appliquer une migration SQL.

## 5. Vérifier après le futur déploiement autorisé

L’écran doit afficher Production. Se connecter avec le compte PROD. Vérifier qu’aucun contact de DEV n’apparaît.
Créer un contact de validation, le modifier, recharger, puis le supprimer volontairement. Vérifier avec un deuxième compte PROD que les contacts ne sont pas partagés. Vérifier que la lecture anonyme reste refusée.
Prévoir sauvegardes et restauration adaptées avant utilisation réelle ; vérifier les limites du forfait choisi.
