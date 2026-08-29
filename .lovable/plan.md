# Cloche de notifications vide : correction des règles d'accès

## Diagnostic (vérifié)

Les notifications existent bien en base : 53 notifications créées, dont une pour la fiche collaborateur de Karim Haoud (semaine du 31/08). Le problème n'est donc pas l'envoi mais la lecture.

Les règles de sécurité de la table `schedule_notifications` contiennent une condition qui va chercher l'adresse e-mail du compte connecté dans la table interne des comptes (`auth.users`). Or le rôle utilisé par l'application n'a aucun droit de lecture sur cette table (vérifié sur les privilèges réels). La règle échoue donc avec une erreur de permission, et comme toutes les règles sont évaluées ensemble, la requête entière échoue : la cloche s'affiche mais la liste revient vide, même pour un administrateur.

## Correction

- Réécrire la règle de lecture « mes notifications » pour comparer l'e-mail du collaborateur à celui du jeton de session (`auth.jwt()`), sans toucher à la table interne des comptes.
- Faire la même correction sur la règle de mise à jour (marquer comme lu), qui souffre du même problème et empêcherait aussi le clic « marquer comme lu ».
- Conserver la règle existante pour le personnel encadrant (accès à leur périmètre magasin) telle quelle.

## Détails techniques

Migration SQL :

```sql
DROP POLICY schedule_notifications_select_own ON public.schedule_notifications;
DROP POLICY schedule_notifications_mark_read_own ON public.schedule_notifications;

CREATE POLICY schedule_notifications_select_own
ON public.schedule_notifications FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = schedule_notifications.employee_id
    AND lower(e.email) = lower(auth.jwt() ->> 'email')
));

CREATE POLICY schedule_notifications_mark_read_own
ON public.schedule_notifications FOR UPDATE TO authenticated
USING (... même condition ...) WITH CHECK (... même condition ...);
```

Vérifier également que la résolution du collaborateur dans `NotificationBell.tsx` (recherche par e-mail) reste inchangée, et remonter l'erreur éventuelle de la requête dans la console pour faciliter le diagnostic futur.

## Vérification

- Se connecter avec un compte lié à une fiche collaborateur, ouvrir la cloche : la notification « Votre planning de la semaine a été publié » doit apparaître.
- Cliquer dessus : elle passe en lu, le badge diminue.

## Versioning

Bump `src/lib/version.ts` en v5.27 + entrée en haut de `CHANGELOG.md` (FR, 29/08/2026).
