"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Store } from "@/lib/types/database";

export function useStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStores() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("name");

      if (error) {
        setError(error.message);
      } else {
        setStores(data ?? []);
      }
      setLoading(false);
    }

    fetchStores();
  }, []);

  return { stores, loading, error };
}
