# Rattacher Jean-Laurent Stubbe au magasin TDO

## État actuel (vérifié en base)
- Compte : `jean-laurent.stubbe@be.fnac.com` (id `43fd1269-a684-47b1-9d95-5e53ef212476`)
- Déjà affecté à **Fnac LLN** (`06f4df34-71bb-49ac-bc85-e8e91e690136`) avec `is_manager = true`
- Aucune affectation à **Fnac TDO** (`bc4ce4e1-62a6-4ea0-a671-d5169a9211fc`)

## Action
Une seule opération en base :

```sql
INSERT INTO public.user_store_assignments (user_id, store_id, is_manager)
VALUES ('43fd1269-a684-47b1-9d95-5e53ef212476', 'bc4ce4e1-62a6-4ea0-a671-d5169a9211fc', true)
ON CONFLICT (user_id, store_id) DO UPDATE SET is_manager = true;
```

## Résultat attendu
- Jean-Laurent Stubbe voit LLN **et** TDO dans son sélecteur de magasin et est responsable des deux (paramètres magasin, planning direction).
- Aucun nouveau compte créé, aucun mot de passe modifié.

## Suite (hors de cette action)
Le bug « compte existe déjà » lors de la création via l'interface reste à corriger séparément (redéploiement de la fonction `manage-users` + garde-fou) — à faire dans une prochaine étape si souhaité.
