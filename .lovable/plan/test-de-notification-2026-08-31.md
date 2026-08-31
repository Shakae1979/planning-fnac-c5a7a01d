# Test de notification

Objectif : envoyer une notification de test sur ton compte (karim.haoud@be.fnac.com) pour vérifier la cloche dans l'en-tête et la pastille sur le favicon/onglet.

## Ce que je vais faire

1. Créer une notification de test rattachée à ta fiche collaborateur (Karim Haoud), sur la semaine en cours, avec un message clair du type :
   « Test — Lun : 09h00–17h00 → 10h00–18h00 (notification de test, à ignorer). »
2. Te demander de rafraîchir l'application : la cloche doit afficher une pastille « 1 », le titre de l'onglet doit être préfixé « (1) » et le favicon porter le badge jaune.
3. Une fois le test validé, supprimer la notification de test (ou tu la marques simplement comme lue).

## Vérifications attendues

- Pastille jaune sur l'icône cloche dans l'en-tête.
- Panneau au clic : semaine + détail du changement.
- Badge sur le favicon + titre « (1) … », qui disparaissent après « Tout marquer comme lu ».

## Détails techniques

- Insertion d'une ligne dans `schedule_notifications` (employee_id = fiche Karim Haoud, store_id de sa fiche, `week_start` = lundi de la semaine courante, `is_read` = false).
- Aucune modification de code : le test valide la chaîne existante (RLS par e-mail de session, `NotificationBell`, `useFaviconBadge`).
- Nettoyage : suppression de la ligne de test après validation.
