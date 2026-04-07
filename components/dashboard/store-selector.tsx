"use client";

import { useState } from "react";
import { ChevronDown, Store } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StoreOption {
  id: string;
  name: string;
}

interface StoreSelectorProps {
  stores: StoreOption[];
  selectedStoreId: string | null;
  onSelect: (storeId: string | null) => void;
  className?: string;
}

export function StoreSelector({
  stores,
  selectedStoreId,
  onSelect,
  className,
}: StoreSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium backdrop-blur-sm bg-white/20 border border-white/30 hover:bg-white/30 dark:bg-gray-800/20 dark:border-gray-600/30 dark:hover:bg-gray-700/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Store className="h-4 w-4" />
        <span>{selectedStore?.name ?? "All Stores"}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-white/20 bg-white/80 backdrop-blur-xl p-1 shadow-xl dark:border-gray-700/20 dark:bg-gray-900/80"
          role="listbox"
        >
          <button
            role="option"
            aria-selected={selectedStoreId === null}
            className={cn(
              "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-white/30 dark:hover:bg-gray-800/30",
              selectedStoreId === null && "bg-sky-500/10 text-sky-700 dark:text-sky-300"
            )}
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
          >
            All Stores
          </button>
          {stores.map((store) => (
            <button
              key={store.id}
              role="option"
              aria-selected={selectedStoreId === store.id}
              className={cn(
                "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-white/30 dark:hover:bg-gray-800/30",
                selectedStoreId === store.id &&
                  "bg-sky-500/10 text-sky-700 dark:text-sky-300"
              )}
              onClick={() => {
                onSelect(store.id);
                setOpen(false);
              }}
            >
              {store.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
