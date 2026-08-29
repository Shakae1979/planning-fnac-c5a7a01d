# Responsables TDO + notifications de changement d'horaire

## 1. Jean-Laurent visible comme responsable de Fnac TDO

Diagnostic confirmé : la base est correcte (rôle `manager`, assignation `is_manager` sur TDO et LLN, fiches employés dans les deux magasins). Le bug est dans `src/components/dashboard/StoreManager.tsx` : la rubrique « Responsables » ne liste que les rôles `editor`/`admin`.

- Inclure le rôle `manager` dans le filtre `storeManagers` (ligne ~83).
- Même correction dans `getAvailableUsers` (ligne ~294) pour le menu « Ajouter un responsable ».

## 2. Notifications de changement d'horaire (jamais implémenté)

État réel : aucune trace du système annoncé — ni table, ni edge function, ni code UI. À construire :

### Base de données (migration)
- Table `public.schedule_notifications` : `id`, `employee_id`, `store_id`, `week_start`, `message`, `is_read`, `created_at` (+ GRANTs, RLS : lecture par le collaborateur concerné, écriture staff).
- Table `public.notified_schedule_snapshots` : empreinte (hash) du planning notifié par employé/semaine, pour n'envoyer que les vrais changements.

### Application
- Bouton « Notifier l'équipe » dans `ScheduleEditor.tsx` : compare le planning actuel au dernier snapshot notifié et crée une notification par employé dont les horaires ont changé.
- Cloche de notification dans le header : badge avec le nombre de non lues, panneau listant les changements (semaine, jour, avant → après), bouton « marquer comme lu ».
- Visible par tous les utilisateurs connectés ; un vendeur ne voit que ses propres notifications.

## 3. Versioning

Bump `src/lib/version.ts` (v5.26) + entrées en haut de `CHANGELOG.md` (FR, date du jour).

## Vérification

- Gestion des magasins : Jean-Laurent apparaît dans les Responsables de Fnac TDO avec le badge Store Manager.
- Modifier un horaire, cliquer « Notifier l'équipe », vérifier que la cloche affiche la notification côté collaborateur.
