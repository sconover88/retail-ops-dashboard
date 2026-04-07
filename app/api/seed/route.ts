import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface DummyProduct {
  id: number;
  title: string;
  category: string;
  price: number;
  thumbnail: string;
  description: string;
}

export async function POST() {
  // Use admin client (bypasses RLS) for seeding data
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local. Get it from your Supabase dashboard → Settings → API." },
      { status: 500 }
    );
  }

  // Get the calling user so we can promote them to manager
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();

  try {
    // 0. Ensure required UNIQUE constraints exist (idempotent)
    await admin.rpc("exec_sql", {
      query: "ALTER TABLE stores ADD CONSTRAINT IF NOT EXISTS stores_name_unique UNIQUE (name);",
    }).maybeSingle();
    // Fallback: if rpc doesn't exist, try raw — ignore errors since it may already exist
    await admin.from("stores").select("id").limit(0); // no-op to warm connection

    // Try adding constraint directly via Supabase REST if rpc not available
    // We'll just catch the upsert error and fall back to delete+insert
    
    // 1. Seed stores
    const stores = [
      { name: "Downtown Flagship", address: "123 Main St, New York, NY 10001" },
      { name: "Westside Mall", address: "456 Commerce Blvd, Los Angeles, CA 90001" },
      { name: "Lakefront Plaza", address: "789 Lake Shore Dr, Chicago, IL 60601" },
      { name: "Harbor Point", address: "321 Harbor Way, San Francisco, CA 94105" },
      { name: "Midtown Express", address: "654 5th Ave, New York, NY 10022" },
      { name: "Sunrise Center", address: "987 Sunrise Blvd, Miami, FL 33101" },
    ];

    // Try upsert first; if it fails (no unique constraint), fall back to delete+insert
    let storeData: any[] | null = null;
    const upsertResult = await admin
      .from("stores")
      .upsert(stores, { onConflict: "name" })
      .select();

    if (upsertResult.error) {
      // Fallback: delete existing stores and re-insert
      await admin.from("stores").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const insertResult = await admin.from("stores").insert(stores).select();
      if (insertResult.error) {
        return NextResponse.json({ error: `Stores: ${insertResult.error.message}` }, { status: 500 });
      }
      storeData = insertResult.data;
    } else {
      storeData = upsertResult.data;
    }

    // 2. Promote calling user to manager and assign all stores
    if (user) {
      await admin
        .from("profiles")
        .upsert({ id: user.id, role: "manager", full_name: user.user_metadata?.full_name ?? "" }, { onConflict: "id" });

      if (storeData) {
        const assignments = storeData.map((store) => ({
          user_id: user.id,
          store_id: store.id,
        }));
        await admin
          .from("user_stores")
          .upsert(assignments, { onConflict: "user_id,store_id" });
      }
    }

    // 3. Fetch products from DummyJSON
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

    const { data: productData, error: productError } = await admin
      .from("products")
      .upsert(products, { onConflict: "sku" })
      .select();

    if (productError) {
      return NextResponse.json({ error: `Products: ${productError.message}` }, { status: 500 });
    }

    // 4. Seed inventory (random quantities for each store/product combo)
    if (storeData && productData) {
      // Clear existing inventory and sales to avoid duplicates on re-seed
      await admin.from("sales").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await admin.from("inventory").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const inventoryRows = storeData.flatMap((store: any) =>
        productData.map((product: any) => ({
          store_id: store.id,
          product_id: product.id,
          quantity: Math.floor(Math.random() * 200),
          reorder_point: Math.floor(Math.random() * 20) + 5,
        }))
      );

      // Insert inventory in batches of 500
      for (let i = 0; i < inventoryRows.length; i += 500) {
        const batch = inventoryRows.slice(i, i + 500);
        const { error: invError } = await admin.from("inventory").insert(batch);
        if (invError) {
          return NextResponse.json({ error: `Inventory batch ${i}: ${invError.message}` }, { status: 500 });
        }
      }

      // 5. Seed sample sales data (last 90 days)
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
        const { error: salesError } = await admin
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
