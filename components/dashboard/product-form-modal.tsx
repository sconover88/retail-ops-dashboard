"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import type { Product } from "@/lib/types/database";

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  product?: Product | null;
}

export function ProductFormModal({
  open,
  onOpenChange,
  onSuccess,
  product,
}: ProductFormModalProps) {
  const isEditing = !!product;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setCategory(product.category ?? "");
      setPrice(product.price?.toString() ?? "");
      setImageUrl(product.image_url ?? "");
      setDescription(product.description ?? "");
    } else {
      setName("");
      setSku("");
      setCategory("");
      setPrice("");
      setImageUrl("");
      setDescription("");
    }
    setError(null);
  }, [product, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const payload = {
      name: name.trim(),
      sku: sku.trim(),
      category: category.trim() || null,
      price: price ? parseFloat(price) : null,
      image_url: imageUrl.trim() || null,
      description: description.trim() || null,
    };

    if (!payload.name || !payload.sku) {
      setError("Name and SKU are required.");
      setLoading(false);
      return;
    }

    let result;
    if (isEditing) {
      result = await supabase
        .from("products")
        .update(payload)
        .eq("id", product.id);
    } else {
      result = await supabase.from("products").insert(payload);
    }

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onOpenChange(false);
    onSuccess();
  }

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Product" : "Add Product"}
      description={
        isEditing
          ? "Update the product details below."
          : "Fill in the details to add a new product."
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <GlassInput
          id="product-name"
          label="Product Name"
          placeholder="e.g. Wireless Earbuds"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <GlassInput
          id="product-sku"
          label="SKU"
          placeholder="e.g. SKU-001"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          required
          disabled={isEditing}
        />
        <div className="grid grid-cols-2 gap-4">
          <GlassInput
            id="product-category"
            label="Category"
            placeholder="e.g. electronics"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <GlassInput
            id="product-price"
            label="Price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <GlassInput
          id="product-image"
          label="Image URL"
          type="url"
          placeholder="https://..."
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="product-description"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description
          </label>
          <textarea
            id="product-description"
            rows={3}
            placeholder="Product description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm backdrop-blur-sm bg-white/20 border-white/30 placeholder:text-gray-400 dark:bg-gray-800/20 dark:border-gray-600/30 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 transition-all duration-200 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <GlassButton
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </GlassButton>
          <GlassButton type="submit" variant="primary" disabled={loading}>
            {loading
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
              ? "Save Changes"
              : "Create Product"}
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
}
