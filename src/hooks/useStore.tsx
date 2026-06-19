import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Store {
  id: string;
  name: string;
  city: string;
  has_ab_weeks?: boolean;
  has_lunch_break?: boolean;
  is_direction?: boolean;
}

interface StoreContextType {
  stores: Store[];
  currentStore: Store | null;
  setCurrentStore: (store: Store) => void;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStores([]);
      setCurrentStore(null);
      setLoading(false);
      return;
    }

    const fetchStores = async () => {
      setLoading(true);

      if (role === "admin") {
        // Admin sees all stores
        const { data } = await supabase.from("stores").select("*").order("name");
        const storeList = (data ?? []).map((s: any) => ({ id: s.id, name: s.name, city: s.city, has_ab_weeks: s.has_ab_weeks ?? false, has_lunch_break: s.has_lunch_break ?? false, is_direction: s.is_direction ?? false }));
        setStores(storeList);
        if (!currentStore && storeList.length > 0) {
          setCurrentStore(storeList[0]);
        }
      } else {
        // Editor/user sees only assigned stores
        const { data } = await supabase.rpc("get_my_stores");
        const storeList = (data ?? []).map((s: any) => ({
          id: s.store_id,
          name: s.store_name,
          city: s.store_city,
          has_lunch_break: s.store_has_lunch_break ?? false,
          has_ab_weeks: s.store_has_ab_weeks ?? false,
          is_direction: s.store_is_direction ?? false,
        }));
        // Managers also get access to the Direction Fnac virtual store automatically
        if (role === "manager" && !storeList.some((s) => s.is_direction)) {
          const { data: dirData } = await supabase
            .from("stores")
            .select("id, name, city, has_ab_weeks, has_lunch_break, is_direction")
            .eq("is_direction", true)
            .maybeSingle();
          if (dirData) {
            storeList.push({
              id: dirData.id,
              name: dirData.name,
              city: dirData.city,
              has_ab_weeks: dirData.has_ab_weeks ?? false,
              has_lunch_break: dirData.has_lunch_break ?? false,
              is_direction: dirData.is_direction ?? false,
            });
          }
        }
        setStores(storeList);
        if (!currentStore && storeList.length > 0) {
          setCurrentStore(storeList[0]);
        }
      }

      setLoading(false);
    };

    fetchStores();
  }, [user, role]);

  return (
    <StoreContext.Provider value={{ stores, currentStore, setCurrentStore, loading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
