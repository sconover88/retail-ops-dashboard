import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(req: NextRequest) {
  // Verify the caller is authenticated
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { memberId, fullName, role, storeIds } = body;

  if (!memberId) {
    return NextResponse.json({ error: "memberId is required" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // Update profile
  const updates: Record<string, string> = {};
  if (fullName !== undefined) updates.full_name = fullName;
  if (role !== undefined) updates.role = role;

  if (Object.keys(updates).length > 0) {
    const { error } = await admin.from("profiles").update(updates).eq("id", memberId);
    if (error) {
      return NextResponse.json({ error: `Profile: ${error.message}` }, { status: 500 });
    }
  }

  // Update store assignments if provided
  if (storeIds !== undefined) {
    await admin.from("user_stores").delete().eq("user_id", memberId);
    if (storeIds.length > 0) {
      const { error } = await admin.from("user_stores").insert(
        storeIds.map((store_id: string) => ({ user_id: memberId, store_id }))
      );
      if (error) {
        return NextResponse.json({ error: `Stores: ${error.message}` }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberId } = await req.json();
  if (!memberId) {
    return NextResponse.json({ error: "memberId is required" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  await admin.from("user_stores").delete().eq("user_id", memberId);
  const { error } = await admin.from("profiles").delete().eq("id", memberId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
