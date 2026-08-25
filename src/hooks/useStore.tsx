import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Store {
  id: string;
  name: string;
  city: string;
  has_ab_weeks?: boolean;
  has_lunch_break?: boolean;
  has_multi_roles?: boolean;
  has_two_floors?: boolean;
  is_direction?: boolean;
}

interface StoreContextType {
  stores: Store[];
  currentStore: Store | null;
  setCurrentStore: (store: Store) => void;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const lastStoreKey = (userId: string) => `planning-fnac:last-store:${userId}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const currentStoreRef = useRef<Store | null>(null);
  const requestIdRef = useRef(0);

  /** Sélection manuelle : mémorisée comme magasin par défaut de la prochaine connexion. */
  const setCurrentStore = (store: Store) => {
    currentStoreRef.current = store;
    setCurrentStoreState(store);
    if (user?.id) {
      try {
        localStorage.setItem(lastStoreKey(user.id), store.id);
      } catch {
        // localStorage indisponible : on ignore, la sélection reste effective pour la session.
      }
    }
  };

  /**
   * Résout le magasin affiché à l'ouverture :
   * 1. dernier magasin sélectionné, 2. magasin de rattachement, 3. premier magasin non-Direction.
   */
  const resolveInitialStore = async (list: Store[], userId: string, email?: string | null) => {
    if (list.length === 0) return null;

    let lastId: string | null = null;
    try {
      lastId = localStorage.getItem(lastStoreKey(userId));
    } catch {
      lastId = null;
    }
    const remembered = lastId ? list.find((s) => s.id === lastId) : undefined;
    if (remembered) return remembered;

    if (email) {
      const { data } = await supabase
        .from("employees")
        .select("store_id")
        .eq("email", email)
        .maybeSingle();
      const own = data?.store_id ? list.find((s) => s.id === data.store_id) : undefined;
      if (own) return own;
    }

    return list.find((s) => !s.is_direction) ?? list[0];
  };

  const fetchStores = useCallback(async () => {
    if (!user) {
      requestIdRef.current += 1;
      currentStoreRef.current = null;
      setStores([]);
      setCurrentStoreState(null);
      setLoading(false);
      return;
    }

    // Tant que le rôle n'est pas connu, on ne charge rien : éviter une première
    // liste restreinte remplacée ensuite (magasin qui « saute » au rafraîchissement).
    if (!role) {
      setLoading(true);
      return;
    }

    const reqId = ++requestIdRef.current;
    const isStale = () => reqId !== requestIdRef.current;

    setLoading(true);
    let storeList: Store[] = [];

    if (role === "admin") {
      // Admin sees all stores
      const { data } = await supabase.from("stores").select("*").order("name");
      storeList = (data ?? []).map((s: any) => ({ id: s.id, name: s.name, city: s.city, has_ab_weeks: s.has_ab_weeks ?? false, has_lunch_break: s.has_lunch_break ?? false, has_multi_roles: s.has_multi_roles ?? false, has_two_floors: s.has_two_floors ?? false, is_direction: s.is_direction ?? false }));
    } else {
      // Editor/user sees only assigned stores
      const { data } = await supabase.rpc("get_my_stores");
      storeList = (data ?? []).map((s: any) => ({
        id: s.store_id,
        name: s.store_name,
        city: s.store_city,
        has_lunch_break: s.store_has_lunch_break ?? false,
        has_ab_weeks: s.store_has_ab_weeks ?? false,
        has_multi_roles: (s as any).store_has_multi_roles ?? false,
        has_two_floors: (s as any).store_has_two_floors ?? false,
        is_direction: s.store_is_direction ?? false,
      }));
      // Managers also get access to the Direction Fnac virtual store automatically
      if (role === "manager" && !storeList.some((s) => s.is_direction)) {
        const { data: dirData } = await supabase
          .from("stores")
          .select("id, name, city, has_ab_weeks, has_lunch_break, has_multi_roles, has_two_floors, is_direction")
          .eq("is_direction", true)
          .maybeSingle();
        if (dirData) {
          storeList.push({
            id: dirData.id,
            name: dirData.name,
            city: dirData.city,
            has_ab_weeks: dirData.has_ab_weeks ?? false,
            has_lunch_break: dirData.has_lunch_break ?? false,
            has_multi_roles: (dirData as any).has_multi_roles ?? false,
            has_two_floors: (dirData as any).has_two_floors ?? false,
            is_direction: dirData.is_direction ?? false,
          });
        }
      }
    }

    if (isStale()) return;
    setStores(storeList);

    if (currentStoreRef.current) {
      // Rafraîchissement : on ré-apparie le magasin courant pour récupérer ses nouveaux réglages.
      const same = storeList.find((s) => s.id === currentStoreRef.current!.id);
      if (same) {
        currentStoreRef.current = same;
        setCurrentStoreState(same);
      }
    } else if (storeList.length > 0) {
      const initial = await resolveInitialStore(storeList, user.id, user.email);
      if (isStale()) return;
      currentStoreRef.current = initial;
      setCurrentStoreState(initial);
    }

    if (!isStale()) setLoading(false);
  }, [user?.id, user?.email, role]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return (
    <StoreContext.Provider value={{ stores, currentStore, setCurrentStore, loading, refreshStores: fetchStores }}>
      {children}
    </StoreContext.Provider>
  );
}


export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
