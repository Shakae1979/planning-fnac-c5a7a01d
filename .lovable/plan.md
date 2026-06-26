# Fix: lien de réinitialisation renvoie vers Lovable

## Cause
`resetPasswordForEmail` utilise `${window.location.origin}` comme `redirectTo`. Quand la demande est faite depuis l'aperçu Lovable (`*.lovableproject.com`), le lien email pointe vers Lovable au lieu de `planning.befnac.be`.

De plus, après clic sur le lien email, Supabase redirige vers son **Site URL** par défaut s'il n'est pas explicitement défini, ce qui peut aussi renvoyer ailleurs.

## Correctif

1. **`src/pages/Login.tsx`** — Forcer la redirection vers le domaine de production :
   ```ts
   const PROD_URL = "https://planning.befnac.be";
   const redirectTo = window.location.hostname === "planning.befnac.be"
     ? `${window.location.origin}/reset-password`
     : `${PROD_URL}/reset-password`;
   await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo });
   ```
   Ainsi, même si un admin demande un reset depuis l'aperçu Lovable, l'email pointera vers `planning.befnac.be/reset-password`.

2. **Configurer Supabase Auth** (via `configure_auth` / tool) — m'assurer que :
   - **Site URL** = `https://planning.befnac.be`
   - **Additional Redirect URLs** inclut `https://planning.befnac.be/reset-password`
   
   (À faire côté config Cloud ; je vérifierai et ajusterai.)

3. **Bump version** → `v4.74` + entrée CHANGELOG : « Correctif lien email de réinitialisation pointant vers le domaine de production ».

## Hors scope
- Pas de changement de design ni de logique métier.
- Pas de branding email (template Lovable) — séparé.
