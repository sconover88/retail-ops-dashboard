import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, quantity, reorder_point, arriving_qty, arriving_date } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {};
  if (quantity !== undefined) updates.quantity = quantity;
  if (reorder_point !== undefined) updates.reorder_point = reorder_point;
  if (arriving_qty !== undefined) updates.arriving_qty = arriving_qty;
  if (arriving_date !== undefined) updates.arriving_date = arriving_date;

  const { error } = await supabase.from("inventory").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
