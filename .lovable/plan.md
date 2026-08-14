# Horaires d'ouverture par jour (précision 30 minutes)

Aujourd'hui chaque magasin a une seule plage horaire (ex. 9h → 20h) valable pour les 7 jours, réglable uniquement à l'heure pleine. Objectif : permettre à chaque responsable de définir, dans les Paramètres magasin, une plage différente pour chaque jour de la semaine, par pas de 30 minutes.

## Ce que verra le responsable

Dans **Paramètres magasin**, la section « Heures de planning » devient un petit tableau de 7 lignes :

```text
Jour        Ouverture   Fermeture   Fermé
Lundi        09:00        20:00      [ ]
Mardi        09:00        20:00      [ ]
...
Dimanche     10:00        18:00      [ ]
```

- Les listes proposent toutes les demi-heures entre 06:00 et 22:00.
- Une case « Fermé » permet de désactiver un jour.
- Un bouton « Appliquer à tous les jours » recopie la ligne du lundi sur les autres jours.
- Sauvegarde automatique à chaque changement (comme aujourd'hui), avec contrôle ouverture < fermeture.
- Les magasins existants démarrent avec leur plage actuelle recopiée sur les 7 jours : rien ne change tant que le responsable ne modifie rien.

## Impact sur les plannings

- **Planning du jour (grille horaire)** : les colonnes suivent la plage du jour affiché.
- **Planning semaine (Gantt)** : l'échelle horaire couvre l'amplitude la plus large de la semaine ; les zones hors ouverture d'un jour sont grisées.
- **Encodage semaine** : les suggestions d'horaires et les alertes « hors plage magasin » utilisent la plage du jour concerné.
- Un jour marqué « Fermé » n'affiche plus de grille et n'est plus compté dans les alertes de couverture.

## Détails techniques

- Migration : ajout d'une colonne `day_hours` (jsonb) sur `store_settings`, du type `{"lundi":{"start":"09:00","end":"20:00","closed":false}, ...}`. Les colonnes `schedule_start_hour` / `schedule_end_hour` sont conservées comme repli et remplies avec le min/max des jours pour rester compatibles.
- Backfill des lignes existantes à partir de `schedule_start_hour` / `schedule_end_hour`.
- `useStoreSettings` expose en plus `getDayRange(dayKey)` (minutes début/fin + `closed`) et `weekRange` (amplitude min/max), tout en gardant `scheduleStart` / `scheduleEnd` pour la compatibilité.
- Mise à jour de `InlineStoreSettings` (nouveau tableau 7 jours), `StoreSettingsPanel`, `HourlyGrid` (slots de 30 min basés sur le jour), `TeamWeekView` (amplitude + zones fermées), `ScheduleEditor` (slots et bornes de validation).
- Nouvelles clés FR/NL dans `i18n.tsx` (jours, « Fermé », « Appliquer à tous les jours »).
- Bump `src/lib/version.ts` en v4.89 + entrée CHANGELOG.
