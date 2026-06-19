## Objectif
Compléter la traduction NL en remplaçant les chaînes FR codées en dur par des appels `useI18n()` / `t(...)`.

## Périmètre détecté
Fichiers contenant du texte FR visible non traduit :

**Pages**
- `src/pages/ChangePassword.tsx` — titre, labels, messages d'erreur, placeholders
- `src/pages/NotFound.tsx` — « Oops! Page not found »

**Dashboard / admin**
- `src/components/dashboard/EmployeeManager.tsx` — « Ajouter un collaborateur », labels Nom/Email/Heures contrat/Département, « Annuler » des AlertDialog
- `src/components/dashboard/UserManager.tsx` — « Créer un compte », Email/Mot de passe/Rôle, « Utilisateur »
- `src/components/dashboard/BulkEmployeeImport.tsx` — en-têtes du tableau (Nom/Prénom/Email/Heures/Catégorie/Magasin/État), bouton « Annuler », messages d'erreur, libellés CSV
- `src/components/dashboard/StoreSettingsPanel.tsx` — titre, sous-titre, labels Début/Fin, toasts
- `src/components/dashboard/InlineStoreSettings.tsx` — « Horaires planning », Début/Fin
- `src/components/dashboard/ShareLinks.tsx` — vérification visuelle des labels

**Planning / grille**
- `src/components/team-day/HourlyGrid.tsx` — « Appliquer à la sélection », libellé « H. table »

**Toasts (≈20 occurrences)** et **placeholders (≈14 occurrences)** dans plusieurs composants — passage en revue rapide pour ajout des clés manquantes.

## Approche
1. Ajouter les clés FR/NL manquantes dans `src/lib/i18n.tsx` (préfixes existants : `common.*`, `team.*`, `admin.*`, `auth.*`, `settings.*`, etc.).
2. Remplacer dans chaque fichier les chaînes FR codées en dur par `t("...")` ou `lang === "nl" ? ... : ...` pour les cas simples.
3. Garder le FR identique ; ajouter uniquement la version NL et l'indirection `t()`.
4. Bump `src/lib/version.ts` → v4.57.

## Hors scope
- `HelpFAQ.tsx` est déjà bilingue (objets `FAQ_FR` / `FAQ_NL`) — pas de modification.
- Aucune logique métier, aucun changement DB, aucun changement de design.
- Les libellés CSV d'import (`Nom`, `Prénom`, …) restent en FR côté parsing pour compatibilité fichiers existants ; seul l'affichage UI est traduit.

## Détails techniques
- Convention existante : `useI18n()` retourne `{ t, lang, monthName, dayName }`. Les clés sont des chemins pointés (`team.add`, `auth.password`, …).
- Pour les toasts, utiliser `t()` directement dans l'appel `toast.success(t("..."))`.
- Pour les `AlertDialogCancel`, utiliser `t("common.cancel")` (clé déjà existante à vérifier, sinon l'ajouter).
