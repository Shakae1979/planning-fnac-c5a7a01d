# Mot de passe oublié — vrai flux par email

## Objectif
Remplacer sur la page `/login` le lien actuel "Contacter l'administrateur" par "Mot de passe oublié ?" qui déclenche un vrai envoi d'email de réinitialisation Supabase, avec une page dédiée `/reset-password` pour saisir le nouveau mot de passe.

Cela lève la contrainte mémorisée "no password reset" — je mettrai à jour la mémoire projet en conséquence.

## Étapes

1. **Page Login (`src/pages/Login.tsx` ou équivalent)**
   - Remplacer le lien `mailto:` admin par un bouton "Mot de passe oublié ?" (FR) / "Wachtwoord vergeten?" (NL).
   - Au clic : ouvrir une petite modale demandant l'email, puis appeler  
     `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${window.location.origin}/reset-password })`.
   - Toast de confirmation : "Si un compte existe, un email a été envoyé."

2. **Nouvelle page publique `/reset-password`**
   - Route ajoutée dans `src/App.tsx` (hors `ProtectedRoute`).
   - Détecte le token `type=recovery` dans l'URL hash (Supabase pose automatiquement la session de récupération).
   - Formulaire : nouveau mot de passe + confirmation, validation min 8 caractères.
   - Appel : `supabase.auth.updateUser({ password })`.
   - Succès → toast + redirection vers `/login`.

3. **Traductions** (`src/lib/i18n.tsx`)
   - Nouvelles clés FR/NL : `auth.forgotPassword`, `auth.forgotPasswordTitle`, `auth.resetEmailSent`, `auth.newPassword`, `auth.confirmPassword`, `auth.resetSuccess`, `auth.passwordTooShort`, `auth.passwordsDontMatch`.

4. **Email de récupération**
   - Le template Supabase par défaut fonctionne immédiatement.
   - Optionnel (pas inclus par défaut) : scaffolder les templates auth Lovable pour brander l'email Fnac. À demander seulement si tu veux le style Fnac dans l'email.

5. **Mémoire & versioning**
   - Supprimer la contrainte "no password reset" de `mem://index.md` et créer `mem://features/auth/mot-de-passe-oublie.md` documentant le flux.
   - Bump version à `v4.73` dans `src/lib/version.ts`.
   - Entrée en haut de `CHANGELOG.md` : `## v4.73 — JJ/MM/2026` avec "Ajout du flux Mot de passe oublié".

## Détails techniques
- `/reset-password` doit être déclarée **avant** toute redirection auth (sinon l'utilisateur non connecté est renvoyé vers `/login` et perd le token).
- Le hash `#access_token=...&type=recovery` est consommé automatiquement par le client Supabase au montage ; on attend simplement que `onAuthStateChange` émette `PASSWORD_RECOVERY` avant d'afficher le formulaire.
- Aucune migration DB requise.

## Hors scope
- Branding de l'email (template Lovable) — à faire dans un second temps si souhaité.
- Verrouillage anti-bruteforce (rate-limiting déjà géré côté Supabase).
