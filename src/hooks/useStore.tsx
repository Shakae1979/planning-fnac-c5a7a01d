import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Store {
  id: string;
  name: string;
  city: string;
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
        const storeList = (data ?? []).map((s: any) => ({ id: s.id, name: s.name, city: s.city }));
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
        }));
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
