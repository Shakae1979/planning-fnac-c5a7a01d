import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub as string;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get caller role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .in("role", ["admin", "editor"])
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerRole = roleData.role;

    // Check if caller is store manager for any store
    const { data: callerManagerStores } = await adminClient
      .from("user_store_assignments")
      .select("store_id")
      .eq("user_id", callerId)
      .eq("is_manager", true);
    const callerManagedStoreIds = new Set((callerManagerStores || []).map((s: any) => s.store_id));
    const isStoreManager = callerManagedStoreIds.size > 0;

    const { action, ...payload } = await req.json();

    // Helper: check if caller can manage a given store
    const canManageStore = (storeId: string) => {
      return callerRole === "admin" || callerManagedStoreIds.has(storeId);
    };

    if (action === "list") {
      const { data: { users }, error } = await adminClient.auth.admin.listUsers();
      if (error) throw error;

      const { data: roles } = await adminClient.from("user_roles").select("user_id, role");
      const roleMap: Record<string, string> = {};
      (roles || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });

      const { data: assignments } = await adminClient
        .from("user_store_assignments")
        .select("user_id, store_id, is_manager, stores(name)");
      const storeMap: Record<string, { store_id: string; store_name: string; is_manager: boolean }[]> = {};
      (assignments || []).forEach((a: any) => {
        if (!storeMap[a.user_id]) storeMap[a.user_id] = [];
        storeMap[a.user_id].push({
          store_id: a.store_id,
          store_name: a.stores?.name || "",
          is_manager: a.is_manager || false,
        });
      });

      const result = (users || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        role: roleMap[u.id] || "user",
        created_at: u.created_at,
        stores: storeMap[u.id] || [],
      }));

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const { email, password, role, store_id } = payload;
      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email et mot de passe requis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Admin can create any role; store manager can create editor/user in their store
      if (callerRole !== "admin") {
        if (role === "admin") {
          return new Response(JSON.stringify({ error: "Seul un admin peut créer des comptes admin" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (!store_id || !canManageStore(store_id)) {
          return new Response(JSON.stringify({ error: "Vous ne pouvez créer des comptes que dans vos magasins" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const { data: newUser, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw error;

      await adminClient.from("user_roles").insert({
        user_id: newUser.user.id,
        role: role || "user",
      });

      if (store_id) {
        await adminClient.from("user_store_assignments").insert({
          user_id: newUser.user.id,
          store_id,
        });
      }

      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id } = payload;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id requis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (user_id === callerId) {
        return new Response(JSON.stringify({ error: "Impossible de supprimer votre propre compte" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Admin can delete anyone; store manager can delete users in their stores
      if (callerRole !== "admin") {
        const { data: targetStores } = await adminClient
          .from("user_store_assignments")
          .select("store_id")
          .eq("user_id", user_id);
        const targetStoreIds = (targetStores || []).map((s: any) => s.store_id);
        const canDelete = targetStoreIds.some((sid: string) => callerManagedStoreIds.has(sid));
        if (!canDelete) {
          return new Response(JSON.stringify({ error: "Vous ne pouvez supprimer que des comptes de vos magasins" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      await adminClient.from("user_store_assignments").delete().eq("user_id", user_id);
      await adminClient.from("user_roles").delete().eq("user_id", user_id);
      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_role") {
      const { user_id, role } = payload;
      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: "user_id et role requis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Admin can change any role; store manager can only set editor/user
      if (callerRole !== "admin") {
        if (role === "admin") {
          return new Response(JSON.stringify({ error: "Seul un admin peut attribuer le rôle admin" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: targetStores } = await adminClient
          .from("user_store_assignments")
          .select("store_id")
          .eq("user_id", user_id);
        const canUpdate = (targetStores || []).some((s: any) => callerManagedStoreIds.has(s.store_id));
        if (!canUpdate) {
          return new Response(JSON.stringify({ error: "Vous ne pouvez modifier que les rôles de vos magasins" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const { error } = await adminClient.from("user_roles").update({ role }).eq("user_id", user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "assign_store") {
      const { user_id, store_id } = payload;
      if (!canManageStore(store_id)) {
        return new Response(JSON.stringify({ error: "Accès refusé" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await adminClient.from("user_store_assignments").upsert(
        { user_id, store_id },
        { onConflict: "user_id,store_id" }
      );
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "unassign_store") {
      const { user_id, store_id } = payload;
      if (!canManageStore(store_id)) {
        return new Response(JSON.stringify({ error: "Accès refusé" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await adminClient.from("user_store_assignments").delete()
        .eq("user_id", user_id).eq("store_id", store_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set_manager") {
      // Only admin can set/unset store managers
      if (callerRole !== "admin") {
        return new Response(JSON.stringify({ error: "Seul un admin peut désigner un store manager" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { user_id, store_id, is_manager } = payload;
      if (!user_id || !store_id) {
        return new Response(JSON.stringify({ error: "user_id et store_id requis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await adminClient
        .from("user_store_assignments")
        .update({ is_manager: !!is_manager })
        .eq("user_id", user_id)
        .eq("store_id", store_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "bulk_import") {
      if (callerRole !== "admin") {
        return new Response(JSON.stringify({ error: "Seul un admin peut importer en masse" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { employees } = payload;
      if (!Array.isArray(employees) || employees.length === 0) {
        return new Response(JSON.stringify({ error: "Liste d'employés requise" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: { imported: number; duplicates: number; errors: number; details: any[] } = {
        imported: 0, duplicates: 0, errors: 0, details: [],
      };

      const validCategories = ["responsable", "technique", "éditorial", "caisse", "stock"];

      for (const emp of employees) {
        const { nom, prenom, email, heures_contrat, categorie, magasin_id } = emp;
        if (!email || !nom) {
          results.errors++;
          results.details.push({ email: email || "?", reason: "Données manquantes (nom ou email)" });
          continue;
        }

        const catLower = (categorie || "").toLowerCase();
        if (!validCategories.includes(catLower)) {
          results.errors++;
          results.details.push({ email, reason: `Catégorie invalide "${categorie}"` });
          continue;
        }

        // Check if email already exists in employees table
        const { data: existing } = await adminClient
          .from("employees")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (existing) {
          results.duplicates++;
          results.details.push({ email, reason: "Email déjà existant dans la base employés" });
          continue;
        }

        try {
          // Create auth user
          const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
            email,
            password: "123456",
            email_confirm: true,
          });

          if (createErr) {
            // Could be duplicate auth user
            if (createErr.message?.includes("already been registered") || createErr.message?.includes("already exists")) {
              results.duplicates++;
              results.details.push({ email, reason: "Compte utilisateur déjà existant" });
              continue;
            }
            throw createErr;
          }

          // Create user role
          await adminClient.from("user_roles").insert({
            user_id: newUser.user.id,
            role: "user",
          });

          // Assign store if provided
          if (magasin_id) {
            await adminClient.from("user_store_assignments").insert({
              user_id: newUser.user.id,
              store_id: magasin_id,
            });
          }

          // Create employee record
          await adminClient.from("employees").insert({
            name: prenom || nom,
            last_name: nom,
            email,
            contract_hours: heures_contrat || 36,
            role: catLower,
            store_id: magasin_id || null,
            must_change_password: true,
          });

          results.imported++;
        } catch (e: any) {
          results.errors++;
          results.details.push({ email, reason: e.message || "Erreur inconnue" });
        }
      }

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Action inconnue" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
