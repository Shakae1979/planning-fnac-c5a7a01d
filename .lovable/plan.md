Déplacer le bouton « Aujourd'hui » tout à gauche de la barre de navigation des semaines dans `WeekNavigator.tsx`.

Actuellement l'ordre est :
1. Flèche ← précédent
2. Sélecteur de date (S12 · 16/06 → 20/06)
3. Sous-label optionnel
4. Flèche → suivant
5. Bouton « Aujourd'hui » (affiché seulement quand on n'est pas sur la semaine courante)

Nouvel ordre souhaité :
1. Bouton « Aujourd'hui » (affiché seulement quand on n'est pas sur la semaine courante)
2. Flèche ← précédent
3. Sélecteur de date
4. Sous-label optionnel
5. Flèche → suivant

Le bouton est déjà conditionnel (`!isToday`) — on conserve ce comportement, on déplace juste son bloc JSX avant la flèche précédente.