import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface DummyProduct {
  id: number;
  title: string;
  category: string;
  price: number;
  thumbnail: string;
  description: string;
}

export async function POST() {
  const supabase = await createClient();

  try {
    // 1. Seed stores
    const stores = [
      { name: "Downtown Flagship", address: "123 Main St, New York, NY 10001" },
      { name: "Westside Mall", address: "456 Commerce Blvd, Los Angeles, CA 90001" },
      { name: "Lakefront Plaza", address: "789 Lake Shore Dr, Chicago, IL 60601" },
      { name: "Harbor Point", address: "321 Harbor Way, San Francisco, CA 94105" },
      { name: "Midtown Express", address: "654 5th Ave, New York, NY 10022" },
      { name: "Sunrise Center", address: "987 Sunrise Blvd, Miami, FL 33101" },
    ];

    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .upsert(stores, { onConflict: "name" })
      .select();

    if (storeError) {
      return NextResponse.json({ error: `Stores: ${storeError.message}` }, { status: 500 });
    }

    // 2. Fetch products from DummyJSON
    const res = await fetch("https://dummyjson.com/products?limit=50");
    const json = await res.json();
    const dummyProducts: DummyProduct[] = json.products;

    const products = dummyProducts.map((p) => ({
      name: p.title,
      sku: `SKU-${String(p.id).padStart(4, "0")}`,
      category: p.category,
      price: p.price,
      image_url: p.thumbnail,
      description: p.description,
    }));

    const { data: productData, error: productError } = await supabase
      .from("products")
      .upsert(products, { onConflict: "sku" })
      .select();

    if (productError) {
      return NextResponse.json({ error: `Products: ${productError.message}` }, { status: 500 });
    }

    // 3. Seed inventory (random quantities for each store/product combo)
    if (storeData && productData) {
      const inventoryRows = storeData.flatMap((store) =>
        productData.map((product) => ({
          store_id: store.id,
          product_id: product.id,
          quantity: Math.floor(Math.random() * 200),
          reorder_point: Math.floor(Math.random() * 20) + 5,
        }))
      );

      const { error: invError } = await supabase
        .from("inventory")
        .upsert(inventoryRows, { onConflict: "store_id,product_id" });

      if (invError) {
        return NextResponse.json({ error: `Inventory: ${invError.message}` }, { status: 500 });
      }

      // 4. Seed sample sales data (last 90 days)
      const salesRows: {
        store_id: string;
        product_id: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        sale_date: string;
      }[] = [];

      for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
        const date = new Date();
        date.setDate(date.getDate() - dayOffset);
        const dateStr = date.toISOString();

        // 5-15 sales per day
        const salesCount = Math.floor(Math.random() * 11) + 5;
        for (let i = 0; i < salesCount; i++) {
          const store =
            storeData[Math.floor(Math.random() * storeData.length)];
          const product =
            productData[Math.floor(Math.random() * productData.length)];
          const qty = Math.floor(Math.random() * 5) + 1;
          const unitPrice = Number(product.price);

          salesRows.push({
            store_id: store.id,
            product_id: product.id,
            quantity: qty,
            unit_price: unitPrice,
            total_price: unitPrice * qty,
            sale_date: dateStr,
          });
        }
      }

      // Insert sales in batches of 500
      for (let i = 0; i < salesRows.length; i += 500) {
        const batch = salesRows.slice(i, i + 500);
        const { error: salesError } = await supabase
          .from("sales")
          .insert(batch);

        if (salesError) {
          return NextResponse.json(
            { error: `Sales batch ${i}: ${salesError.message}` },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      message: "Database seeded successfully",
      stores: storeData?.length ?? 0,
      products: productData?.length ?? 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
