## Objectif
Remplacer le flux de réinitialisation par email Supabase par un simple transfert mailto vers `karim.haoud@be.fnac.com`.

## Changements

1. **`src/pages/Login.tsx`**
   - Supprimer la modale de demande d'email et l'appel à `supabase.auth.resetPasswordForEmail`.
   - Le bouton "Mot de passe oublié ?" devient un lien `mailto:karim.haoud@be.fnac.com` avec :
     - sujet pré-rempli : "Demande de réinitialisation de mot de passe / Wachtwoord reset aanvraag"
     - corps pré-rempli (FR/NL) demandant nom + email du compte.

2. **`src/pages/ResetPassword.tsx`** et route `/reset-password` dans `src/App.tsx`
   - Supprimer la page et la route (devenues inutiles).

3. **`src/lib/i18n.tsx`**
   - Retirer les clés liées au reset (`forgotPasswordTitle`, `resendLink`, `resetPasswordSuccess`, etc.).
   - Conserver/ajuster une clé simple pour le bouton "Mot de passe oublié ?" / "Wachtwoord vergeten?".

4. **Versioning**
   - Bump `src/lib/version.ts` → `v4.76`.
   - Ajouter une entrée en haut de `CHANGELOG.md` (FR, DD/MM/YYYY) : "Mot de passe oublié transféré par mail à l'administrateur (suppression du flux de réinitialisation automatique)".

## Hors scope
- Pas de modification backend ni de config Supabase Auth.
- Pas d'edge function.
