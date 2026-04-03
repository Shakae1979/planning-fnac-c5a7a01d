import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";

/**
 * Returns active employees for the current store.
 * When the current store is a "direction" store, fetches store managers
 * from all stores (matched by email via manage-users edge function).
 */
export function useStoreEmployees(sortByRole?: string[]) {
  const { currentStore } = useStore();
  const isDirection = currentStore?.is_direction === true;

  // Regular employees (non-direction)
  const { data: regularEmployees, isLoading: loadingRegular } = useQuery({
    queryKey: ["store-employees", currentStore?.id],
    enabled: !!currentStore && !isDirection,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("is_active", true)
        .eq("store_id", currentStore!.id)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Direction: fetch all users with store assignments
  const { data: allUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ["direction-all-users"],
    enabled: isDirection,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "list" },
      });
      if (error) throw error;
      return (data || []) as {
        id: string;
        email: string;
        role: string;
        stores: { store_id: string; store_name: string; is_manager: boolean }[];
      }[];
    },
  });

  // Direction: fetch all active employees
  const { data: allEmployees, isLoading: loadingAllEmp } = useQuery({
    queryKey: ["direction-employees"],
    enabled: isDirection,
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { employees, managerStoreNames } = useMemo(() => {
    let result: typeof regularEmployees = [];
    const storeNames: Record<string, string> = {};

    if (isDirection) {
      // Match store managers to employee records via email
      const storeManagers = (allUsers || []).filter((u) =>
        u.stores?.some((s) => s.is_manager)
      );
      result = storeManagers
        .map((mgr) => {
          const emp = (allEmployees || []).find(
            (e) => e.email && mgr.email && e.email.toLowerCase() === mgr.email.toLowerCase()
          );
          if (emp) {
            const mgrStores = mgr.stores.filter((s) => s.is_manager);
            storeNames[emp.id] = mgrStores.map((s) => s.store_name).join(", ");
          }
          return emp;
        })
        .filter(Boolean) as NonNullable<typeof regularEmployees>;
    } else {
      result = regularEmployees || [];
    }

    if (sortByRole && result) {
      result = [...result].sort((a, b) => {
        const ra = sortByRole.indexOf(a.role);
        const rb = sortByRole.indexOf(b.role);
        if (ra !== rb) return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
        return a.name.localeCompare(b.name, "fr");
      });
    }

    return { employees: result || [], managerStoreNames: storeNames };
  }, [isDirection, regularEmployees, allUsers, allEmployees, sortByRole]);

  return {
    employees,
    managerStoreNames,
    isDirection,
    isLoading: isDirection ? loadingUsers || loadingAllEmp : loadingRegular,
  };
}
