"use client";

import { useEffect, useState, useCallback } from "react";
import { UserPlus, Users, Shield, ShieldCheck, Store, Trash2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassModal } from "@/components/ui/glass-modal";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/formatters";

interface TeamMember {
  id: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
  stores: string[];
}

export default function TeamPage() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "manager" | "assistant">("all");
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editStores, setEditStores] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const storesRes = await supabase.from("stores").select("id, name").order("name");
    setStores(storesRes.data ?? []);
    const storeMap = new Map((storesRes.data ?? []).map((s: any) => [s.id, s.name]));

    const profilesRes = await supabase.from("profiles").select("*");
    const assignRes = await supabase.from("user_stores").select("user_id, store_id");

    const assignMap: Record<string, string[]> = {};
    (assignRes.data ?? []).forEach((a: any) => {
      if (!assignMap[a.user_id]) assignMap[a.user_id] = [];
      assignMap[a.user_id].push(a.store_id);
    });

    const team: TeamMember[] = (profilesRes.data ?? []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      role: p.role ?? "assistant",
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      stores: (assignMap[p.id] ?? []).map((sid) => storeMap.get(sid) ?? sid),
    }));

    setMembers(team);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const filtered = members.filter((m) => {
    if (roleFilter !== "all" && m.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (m.full_name ?? "").toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function handleSaveRole() {
    if (!editingMember) return;
    setSaving(true);
    const supabase = createClient();

    await supabase
      .from("profiles")
      .update({ role: editRole, full_name: editName })
      .eq("id", editingMember.id);

    // Update store assignments
    await supabase.from("user_stores").delete().eq("user_id", editingMember.id);
    if (editStores.length > 0) {
      await supabase.from("user_stores").insert(
        editStores.map((store_id) => ({
          user_id: editingMember.id,
          store_id,
        }))
      );
    }

    setSaving(false);
    setEditingMember(null);
    fetchTeam();
  }

  async function handleRemoveMember(id: string) {
    const supabase = createClient();
    await supabase.from("user_stores").delete().eq("user_id", id);
    await supabase.from("profiles").delete().eq("id", id);
    fetchTeam();
  }

  function openEdit(member: TeamMember) {
    setEditingMember(member);
    setEditName(member.full_name ?? "");
    setEditRole(member.role);
    // Get store IDs for this member
    const supabase = createClient();
    supabase
      .from("user_stores")
      .select("store_id")
      .eq("user_id", member.id)
      .then(({ data }) => {
        setEditStores((data ?? []).map((d: any) => d.store_id));
      });
  }

  const managerCount = members.filter((m) => m.role === "manager").length;
  const assistantCount = members.filter((m) => m.role === "assistant").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Team</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage team members and store assignments.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setRoleFilter("all")}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/10">
            <Users className="h-6 w-6 text-sky-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{members.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Members</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setRoleFilter("manager")}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
            <ShieldCheck className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{managerCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Managers</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setRoleFilter("assistant")}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
            <Shield className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{assistantCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Assistants</p>
          </div>
        </GlassCard>
      </div>

      {/* Search + Filter */}
      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border pl-10 pr-3 text-sm backdrop-blur-sm bg-white/20 border-white/30 placeholder:text-gray-400 dark:bg-gray-800/20 dark:border-gray-600/30 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "manager", "assistant"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  roleFilter === r
                    ? "bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-400/30"
                    : "bg-white/10 text-gray-600 dark:text-gray-400 border border-white/20 dark:border-gray-700/20 hover:bg-white/20"
                )}
              >
                {r === "all" ? "All Roles" : r.charAt(0).toUpperCase() + r.slice(1) + "s"}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Team List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassCard key={i} className="h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((member) => (
            <GlassCard key={member.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-sm">
                  {(member.full_name ?? "?")[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {member.full_name || "No name"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        member.role === "manager"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                      )}
                    >
                      {member.role === "manager" ? (
                        <ShieldCheck className="h-3 w-3" />
                      ) : (
                        <Shield className="h-3 w-3" />
                      )}
                      {member.role}
                    </span>
                    {member.stores.length > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Store className="h-3 w-3" />
                        {member.stores.slice(0, 2).join(", ")}
                        {member.stores.length > 2 && ` +${member.stores.length - 2}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 mr-2">Joined {formatDate(member.created_at)}</span>
                <GlassButton size="sm" variant="ghost" onClick={() => openEdit(member)}>
                  Edit
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (confirm("Remove this team member?")) handleRemoveMember(member.id);
                  }}
                  aria-label="Remove member"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </GlassButton>
              </div>
            </GlassCard>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              No team members found.
            </div>
          )}
        </div>
      )}

      {/* Edit Role / Store Assignment Modal */}
      <GlassModal
        open={!!editingMember}
        onOpenChange={(open) => { if (!open) setEditingMember(null); }}
        title="Edit Team Member"
        description={editingMember?.full_name ?? ""}
      >
        <div className="flex flex-col gap-4">
          <GlassInput
            id="edit-name"
            label="Full Name"
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Enter full name"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <div className="flex gap-2">
              {["manager", "assistant"].map((r) => (
                <button
                  key={r}
                  onClick={() => setEditRole(r)}
                  className={cn(
                    "flex-1 rounded-lg px-4 py-2 text-sm font-medium border transition-all",
                    editRole === r
                      ? "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-400/30"
                      : "bg-white/10 text-gray-600 dark:text-gray-400 border-white/20 dark:border-gray-700/20 hover:bg-white/20"
                  )}
                >
                  {r === "manager" ? "Manager" : "Assistant"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Store Assignments</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stores.map((store) => (
                <label
                  key={store.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/10 dark:hover:bg-gray-800/10 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={editStores.includes(store.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditStores([...editStores, store.id]);
                      } else {
                        setEditStores(editStores.filter((s) => s !== store.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{store.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <GlassButton variant="ghost" onClick={() => setEditingMember(null)}>Cancel</GlassButton>
            <GlassButton variant="primary" onClick={handleSaveRole} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
