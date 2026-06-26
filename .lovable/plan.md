## Plan

1. **Corriger l’accès à la page de réinitialisation**
   - S’assurer que la route `/reset-password` existe bien dans l’application publiée.
   - Publier la version qui contient cette page, car le screenshot montre encore une ancienne version en ligne.

2. **Configurer le bon domaine de retour**
   - Vérifier que les liens de réinitialisation renvoient vers `https://planning.befnac.be/reset-password`.
   - Ajouter/valider ce domaine dans la configuration d’authentification Lovable Cloud pour éviter les redirections vers Lovable ou une page introuvable.

3. **Permettre une vraie réinitialisation**
   - Quand l’utilisateur clique sur le lien reçu par email, afficher le formulaire “Nouveau mot de passe”.
   - Après validation, enregistrer le nouveau mot de passe et rediriger vers la connexion avec un message de confirmation.

4. **Ne pas bloquer l’utilisateur si le lien est invalide**
   - Les liens expirés ne peuvent pas être rendus permanents pour des raisons de sécurité.
   - Par contre, au lieu d’une 404, afficher une page claire avec un bouton pour demander immédiatement un nouveau lien de réinitialisation.

5. **Maintenance version**
   - Bumper la version suivante.
   - Ajouter l’entrée correspondante dans le changelog.