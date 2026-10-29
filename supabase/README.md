# Base Supabase DEV

Projet DEV confirmé : `mzwkjwlxymkkeuikqeka`.

## Appliquer la première migration manuellement

1. Dans le tableau de bord Supabase, sélectionner ce projet DEV.
2. Ouvrir **SQL Editor**, puis **New query**.
3. Copier tout le contenu de `migrations/20261030000100_create_contacts.sql`.
4. Exécuter avec **Run** une seule fois. Le script est transactionnel : une erreur annule ses changements.
5. Le résultat attendu est `Success. No rows returned`.

Si une table `contacts` existe déjà, le script s'arrête sans l'écraser. Conserver le message d'erreur pour adapter la migration, sans supprimer la table.

## Vérifier la structure après application

Exécuter dans une nouvelle requête :

```sql
select relrowsecurity as rls_active
from pg_class
where oid = 'public.contacts'::regclass;

select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'contacts'
order by policyname;
```

Résultat attendu : `rls_active = true` et quatre politiques pour `authenticated`.
Cela vérifie la configuration ; les tests d'isolation entre utilisateurs et les opérations CRUD restent à effectuer après ajout de la connexion dans l'application.

## Règles d'accès

Chaque utilisateur connecté gère uniquement ses propres contacts. La colonne `user_id` est attribuée par Supabase Auth, sans être modifiable par le navigateur. Les visiteurs non connectés n'ont aucun accès à la table.
La suppression d'un compte Supabase Auth supprime ses contacts par cascade ; la déconnexion ne supprime rien.
Les contacts du mode local ne sont ni importés ni effacés par cette migration.

## Historique et PROD

Ce fichier est prêt à être versionné avec Git lors de l'étape GitHub. L'exécution dans SQL Editor est manuelle : elle n'enregistre pas cette migration dans l'historique de la CLI Supabase. Avant d'adopter `supabase db push`, réconcilier cet historique avec `supabase migration repair`, après vérification de la structure distante.
Ne pas modifier une migration déjà appliquée ; créer un nouveau fichier pour toute évolution.
PROD devra être un projet distinct. Aucune migration PROD automatique n'est configurée.
