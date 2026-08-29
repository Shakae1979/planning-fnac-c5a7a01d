# Notifier les collaborateurs d'un changement d'horaire

Objectif : quand un responsable a fini de modifier une semaine, il clique sur « Notifier l'équipe » et chaque collaborateur concerné voit, à sa connexion, une notification listant ses jours modifiés.

## Fonctionnement pour l'utilisateur

**Côté responsable (Planning / encodage semaine)**
- Un bouton « Notifier l'équipe » à côté des actions existantes de la semaine.
- Il compare les horaires actuels de la semaine avec l'état déjà notifié, et affiche un récapitulatif avant envoi : « 4 collaborateurs concernés, 7 jours modifiés ».
- Si rien n'a changé depuis la dernière notification, le bouton indique « Aucun changement à notifier ».
- Confirmation → les notifications sont créées et l'état notifié est mis à jour.

**Côté collaborateur**
- Une cloche dans l'en-tête avec une pastille du nombre de notifications non lues.
- Au clic : liste des changements, du plus récent au plus ancien, par ex. « Semaine du 07/09 — mercredi : 09h00–17h00 (était 12h00–20h00) », « vendredi : repos (était 09h00–17h00) ».
- Bouton « Tout marquer comme lu » ; un clic sur une notification la marque lue.
- Visible pour tout compte relié à un collaborateur (rattachement par e-mail, comme aujourd'hui).

## Portée

Seuls les horaires de travail déclenchent une notification : heures de début/fin de chaque jour de la semaine (y compris passage à un jour de repos ou inversement). Les congés, rôles du jour et commentaires ne déclenchent rien.

## Détails techniques

**Base de données**
- `schedule_notifications` : `id`, `employee_id`, `week_start`, `changes` (jsonb : jour, ancien créneau, nouveau créneau), `created_at`, `read_at`, `created_by`.
  - GRANT `select, update` à `authenticated`, `insert` au staff, `all` à `service_role`.
  - RLS : lecture/mise à jour de `read_at` uniquement si la notification appartient au collaborateur dont l'e-mail correspond à celui de l'utilisateur connecté ; insertion réservée au staff via `is_staff(auth.uid())`.
- `notified_schedule_snapshots` : `employee_id`, `week_start`, `snapshot` (jsonb des 7 paires début/fin), `updated_at`, clé unique `(employee_id, week_start)`. Sert de référence pour le diff. Accès staff uniquement.

**Front**
- `ScheduleEditor.tsx` : bouton + dialogue de confirmation ; calcul du diff entre les lignes `weekly_schedules` de la semaine affichée et les snapshots, insertion des notifications puis upsert des snapshots.
- Nouveau `src/components/NotificationBell.tsx` monté dans `FnacHeader.tsx` : requête des notifications non lues du collaborateur courant, popover avec la liste, marquage lu.
- Nouveau hook `src/hooks/useMyEmployee.tsx` (ou réutilisation existante) pour résoudre le collaborateur lié à l'e-mail du compte connecté.
- Traductions FR/NL dans `i18n.tsx`.

**Divers**
- Bump de `src/lib/version.ts` en v5.25 + entrée CHANGELOG.
