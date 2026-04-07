"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { use } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassModal } from "@/components/ui/glass-modal";
import { ProductFormModal } from "@/components/dashboard/product-form-modal";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import type { Product } from "@/lib/types/database";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function fetchProduct() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      setError(error.message);
    } else {
      setProduct(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      setError(error.message);
      setDeleting(false);
    } else {
      router.push("/products");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 animate-pulse rounded bg-white/10 dark:bg-gray-800/20" />
        <GlassCard className="h-96 animate-pulse" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-red-500">{error ?? "Product not found."}</p>
        <Link href="/products">
          <GlassButton variant="default">Back to Products</GlassButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      {/* Product Detail Card */}
      <GlassCard className="overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative h-64 w-full md:h-auto md:w-96 flex-shrink-0 bg-white/5 dark:bg-gray-800/10">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 384px"
              />
            ) : (
              <div className="flex h-full min-h-[16rem] items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-sky-600 dark:text-sky-400">
                  {product.category?.replace(/-/g, " ") ?? "Uncategorized"}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {product.name}
                </h1>
                <p className="mt-1 text-xs font-mono text-gray-400">
                  {product.sku}
                </p>
              </div>
              <div className="flex gap-2">
                <GlassButton
                  size="sm"
                  variant="default"
                  onClick={() => setShowEditModal(true)}
                  aria-label="Edit product"
                >
                  <Edit className="h-4 w-4" />
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label="Delete product"
                >
                  <Trash2 className="h-4 w-4" />
                </GlassButton>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {product.description ?? "No description available."}
            </p>

            <div className="mt-auto pt-6 flex items-end justify-between">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {product.price != null
                  ? formatCurrency(Number(product.price))
                  : "N/A"}
              </span>
              <span className="text-xs text-gray-400">
                Added {formatDate(product.created_at)}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Edit Modal */}
      <ProductFormModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSuccess={fetchProduct}
        product={product}
      />

      {/* Delete Confirmation Modal */}
      <GlassModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
      >
        <div className="flex justify-end gap-3 pt-2">
          <GlassButton
            variant="ghost"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancel
          </GlassButton>
          <GlassButton
            variant="danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </GlassButton>
        </div>
      </GlassModal>
    </div>
  );
}
