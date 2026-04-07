"use client";

import { useEffect, useState } from "react";
import { Save, Sun, Moon, Monitor } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { cn } from "@/lib/utils/cn";

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email ?? "");
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single();
        if (profile) {
          setFullName(profile.full_name ?? "");
          setRole(profile.role ?? "assistant");
        }
      }
      const stored = localStorage.getItem("theme");
      if (stored === "dark" || stored === "light") setTheme(stored);
      else setTheme("system");
    }
    load();
  }, []);

  function applyTheme(mode: "light" | "dark" | "system") {
    setTheme(mode);
    if (mode === "system") {
      localStorage.removeItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    } else {
      localStorage.setItem("theme", mode);
      document.documentElement.classList.toggle("dark", mode === "dark");
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", user.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Profile</h2>
        <div className="flex flex-col gap-4">
          <GlassInput
            id="settings-name"
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <GlassInput
            id="settings-email"
            label="Email"
            value={email}
            disabled
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{role}</p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <GlassButton variant="primary" onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </GlassButton>
            {saved && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved!</span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Appearance */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Appearance</h2>
        <div className="grid grid-cols-3 gap-3">
          {([
            { value: "light" as const, label: "Light", icon: Sun },
            { value: "dark" as const, label: "Dark", icon: Moon },
            { value: "system" as const, label: "System", icon: Monitor },
          ]).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => applyTheme(value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                theme === value
                  ? "bg-sky-500/10 border-sky-400/30 text-sky-700 dark:text-sky-300"
                  : "bg-white/10 border-white/20 dark:border-gray-700/20 text-gray-500 hover:bg-white/20"
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Keyboard Shortcuts */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Keyboard Shortcuts</h2>
        <div className="space-y-2 text-sm">
          {[
            { keys: "⌘ + K", action: "Search" },
            { keys: "⌘ + /", action: "Toggle sidebar" },
            { keys: "⌘ + D", action: "Toggle dark mode" },
          ].map(({ keys, action }) => (
            <div key={action} className="flex items-center justify-between py-1.5">
              <span className="text-gray-600 dark:text-gray-400">{action}</span>
              <kbd className="rounded bg-white/20 dark:bg-gray-800/30 px-2 py-0.5 font-mono text-xs text-gray-500">{keys}</kbd>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
