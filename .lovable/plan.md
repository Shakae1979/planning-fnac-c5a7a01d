## Objectif

Dans **Magasins**, quand on clique sur **"Ajouter un responsable"** d'un magasin (ex. Fnac Charleroi), le dropdown ne doit lister que les utilisateurs (comptes `editor`/`admin`) dont l'email correspond à un **employé actif de ce magasin**. Plus aucun compte d'un autre magasin n'apparaît.

## Modification

**`src/components/dashboard/StoreManager.tsx`** (seul fichier touché)

1. Ajouter une query qui charge, par magasin, le set des emails d'employés actifs :
   ```ts
   const { data: employeeEmailsByStore } = useQuery({
     queryKey: ["store-employee-emails"],
     queryFn: async () => {
       const { data } = await supabase
         .from("employees")
         .select("store_id, email")
         .eq("is_active", true)
         .not("email", "is", null);
       const map: Record<string, Set<string>> = {};
       (data ?? []).forEach((e) => {
         if (!e.store_id || !e.email) return;
         (map[e.store_id] ??= new Set()).add(e.email.toLowerCase());
       });
       return map;
     },
   });
   ```

2. Restreindre `getAvailableUsers(storeId)` : un utilisateur n'apparaît que si son email est présent dans `employeeEmailsByStore[storeId]`.
   ```ts
   const getAvailableUsers = (storeId: string) => {
     const assigned = new Set((storeManagers[storeId] || []).map((m) => m.user_id));
     const allowed = employeeEmailsByStore?.[storeId] ?? new Set<string>();
     return (allUsers || []).filter(
       (u) =>
         (u.role === "editor" || u.role === "admin") &&
         !assigned.has(u.id) &&
         u.email && allowed.has(u.email.toLowerCase())
     );
   };
   ```

3. Si la liste est vide, ajouter un petit message sous le `Select` du formulaire d'ajout : *"Aucun employé de ce magasin n'a de compte. Utilisez « Créer un nouveau »."* (avec traduction FR/NL via `useI18n`).

## Hors scope

- Le bouton **"Créer un nouveau responsable"** reste inchangé (création directe possible).
- Aucun changement back-end / RLS / edge function `manage-users`.
- Magasin **Direction** : pas d'employés réels → liste vide, message affiché ; on continue via "Créer un nouveau".
