"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types/database";

interface UseProductsOptions {
  search?: string;
  category?: string;
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase.from("products").select("*").order("name");

    if (options.search) {
      query = query.ilike("name", `%${options.search}%`);
    }

    if (options.category) {
      query = query.eq("category", options.category);
    }

    const { data, error } = await query;

    if (error) {
      setError(error.message);
    } else {
      setProducts(data ?? []);
    }
    setLoading(false);
  }, [options.search, options.category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}
