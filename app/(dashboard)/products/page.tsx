"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { formatCurrency } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { ProductFormModal } from "@/components/dashboard/product-form-modal";

const categories = [
  "All",
  "smartphones",
  "laptops",
  "fragrances",
  "skincare",
  "groceries",
  "home-decoration",
  "furniture",
  "tops",
  "womens-dresses",
  "womens-shoes",
  "mens-shirts",
  "mens-shoes",
  "mens-watches",
  "womens-watches",
  "womens-bags",
  "womens-jewellery",
  "sunglasses",
  "automotive",
  "motorcycle",
  "lighting",
];

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { products, loading, error, refetch } = useProducts({
    search: debouncedSearch,
    category: selectedCategory === "All" ? undefined : selectedCategory,
  });

  // Simple debounce for search
  function handleSearchChange(value: string) {
    setSearch(value);
    const timeout = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timeout);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Products
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your product catalog across all stores.
          </p>
        </div>
        <GlassButton
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </GlassButton>
      </div>

      {/* Search & Filter Bar */}
      <GlassCard className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-10 w-full rounded-lg border pl-10 pr-3 text-sm backdrop-blur-sm bg-white/20 border-white/30 placeholder:text-gray-400 dark:bg-gray-800/20 dark:border-gray-600/30 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="h-4 w-4 flex-shrink-0 text-gray-400" />
            {categories.slice(0, 8).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                  selectedCategory === cat
                    ? "bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-400/30"
                    : "bg-white/10 text-gray-600 dark:text-gray-400 border border-white/20 dark:border-gray-700/20 hover:bg-white/20"
                )}
              >
                {cat === "All" ? "All" : cat.replace(/-/g, " ")}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {products.length} product{products.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <GlassCard key={i} className="h-72 animate-pulse p-4">
              <div className="h-40 rounded-lg bg-white/10 dark:bg-gray-800/20" />
              <div className="mt-4 h-4 w-3/4 rounded bg-white/10 dark:bg-gray-800/20" />
              <div className="mt-2 h-3 w-1/2 rounded bg-white/10 dark:bg-gray-800/20" />
            </GlassCard>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <GlassButton variant="default" className="mt-4" onClick={refetch}>
            Retry
          </GlassButton>
        </GlassCard>
      )}

      {/* Product Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <GlassCard className="group h-full overflow-hidden transition-all duration-200 hover:shadow-2xl hover:scale-[1.02]">
                <div className="relative h-44 w-full overflow-hidden rounded-t-xl bg-white/5 dark:bg-gray-800/10">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs font-medium text-sky-600 dark:text-sky-400">
                    {product.category?.replace(/-/g, " ") ?? "Uncategorized"}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-gray-900 line-clamp-1 dark:text-gray-100">
                    {product.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {product.price != null
                        ? formatCurrency(Number(product.price))
                        : "N/A"}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {product.sku}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}

          {products.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No products found. Try a different search or add a new product.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Product Modal */}
      <ProductFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={refetch}
      />
    </div>
  );
}
