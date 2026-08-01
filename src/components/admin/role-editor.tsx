"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Btn } from "@/components/btn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRole, deleteRole, updateRole } from "@/lib/actions/admin-roles";
import {
  CAPABILITY_GROUPS,
  ESCALATING_CAPABILITIES,
} from "@/lib/admin/capabilities";
import { cn } from "@/lib/utils";

export type EditableRole = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  capabilities: string[];
  is_system: boolean;
  memberCount: number;
};

function CapabilityPicker({
  selected,
  onToggle,
  disabled,
}: {
  selected: Set<string>;
  onToggle: (key: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-5">
      {CAPABILITY_GROUPS.map((group) => {
        const groupKeys = group.capabilities.map((c) => c.key);
        const allOn = groupKeys.every((k) => selected.has(k));
        return (
          <fieldset key={group.key} className="border-grey-100 rounded-xl border p-4">
            <legend className="flex items-center gap-2 px-2">
              <span className="font-heading text-ink text-sm font-bold">
                {group.label}
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  groupKeys.forEach((k) => {
                    if (allOn === selected.has(k)) onToggle(k);
                  })
                }
                className="text-green-600 text-[11px] font-semibold hover:underline disabled:opacity-40"
              >
                {allOn ? "none" : "all"}
              </button>
            </legend>
            <p className="text-grey-500 -mt-1 mb-3 text-xs">{group.description}</p>
            <div className="space-y-2">
              {group.capabilities.map((cap) => {
                const on = selected.has(cap.key);
                return (
                  <label
                    key={cap.key}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg p-2 transition",
                      on ? "bg-green-100/60" : "hover:bg-grey-50",
                      disabled && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={disabled}
                      onChange={() => onToggle(cap.key)}
                      className="accent-green-600 mt-0.5 size-4 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="text-ink flex items-center gap-1.5 text-sm font-medium">
                        {cap.label}
                        {cap.sensitive && (
                          <ShieldAlert
                            className="text-gold size-3.5"
                            aria-label="Sensitive"
                          />
                        )}
                      </span>
                      <span className="text-grey-500 block text-xs leading-snug">
                        {cap.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

function RoleCard({ role }: { role: EditableRole }) {
  const router = useRouter();
  const isSuper = role.key === "super_admin";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description ?? "");
  const [selected, setSelected] = useState(new Set(role.capabilities));
  const [pending, start] = useTransition();

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const escalating = [...selected].filter((c) => ESCALATING_CAPABILITIES.has(c));

  return (
    <li className="border-grey-100 rounded-2xl border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-ink flex items-center gap-2 font-semibold">
            {role.name}
            {isSuper && (
              <span className="text-grey-500 inline-flex items-center gap-1 text-xs font-normal">
                <Lock className="size-3" /> fixed
              </span>
            )}
          </p>
          <p className="text-grey-500 text-sm">
            {role.description || "No description."}
          </p>
          <p className="text-grey-500 mt-1 text-xs">
            {isSuper
              ? "Full access to everything"
              : `${role.capabilities.length} permission${role.capabilities.length === 1 ? "" : "s"}`}
            {" · "}
            {role.memberCount} {role.memberCount === 1 ? "person" : "people"}
          </p>
        </div>
        {!isSuper && (
          <div className="flex gap-2">
            <Btn
              type="button"
              variant="ghost"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Close" : "Change permissions"}
            </Btn>
            {!role.is_system && (
              <Btn
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Delete the "${role.name}" role?`)) return;
                  start(async () => {
                    const r = await deleteRole(role.id);
                    if (r.ok) { toast.success(r.message); router.refresh(); }
                    else toast.error(r.message);
                  });
                }}
                aria-label={`Delete ${role.name}`}
              >
                <Trash2 className="text-destructive size-4" />
              </Btn>
            )}
          </div>
        )}
      </div>

      {open && !isSuper && (
        <div className="border-grey-100 border-t p-5">
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`role-name-${role.id}`}>Name</Label>
              <Input
                id={`role-name-${role.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`role-desc-${role.id}`}>
                What is this role for?
              </Label>
              <Input
                id={`role-desc-${role.id}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Looks after events and photos"
              />
            </div>
          </div>

          <CapabilityPicker
            selected={selected}
            onToggle={toggle}
            disabled={pending}
          />

          {escalating.length > 0 && (
            <p className="bg-gold/15 text-ink mt-4 flex gap-2 rounded-lg p-3 text-xs">
              <ShieldAlert className="text-gold size-4 shrink-0" />
              <span>
                This role can change who has access. Only give it to people you
                trust with the whole site.
              </span>
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <Btn
              type="button"
              variant="green"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await updateRole(
                    role.id,
                    name,
                    description,
                    [...selected],
                  );
                  if (r.ok) {
                    toast.success(r.message);
                    setOpen(false);
                    router.refresh();
                  } else toast.error(r.message);
                })
              }
            >
              Save permissions
            </Btn>
            <Btn
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setSelected(new Set(role.capabilities));
                setName(role.name);
                setDescription(role.description ?? "");
                setOpen(false);
              }}
            >
              Cancel
            </Btn>
          </div>
        </div>
      )}
    </li>
  );
}

export function RoleEditor({ roles }: { roles: EditableRole[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState(new Set<string>());
  const [pending, start] = useTransition();

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div>
      <ul className="space-y-3">
        {roles.map((role) => (
          <RoleCard key={role.id} role={role} />
        ))}
      </ul>

      <div className="mt-6">
        {creating ? (
          <div className="border-grey-100 rounded-2xl border bg-white p-5">
            <h3 className="font-heading text-ink mb-4 font-bold">
              New role
            </h3>
            <div className="mb-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-role-name">Name</Label>
                <Input
                  id="new-role-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Prayer team"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-role-desc">What is this role for?</Label>
                <Textarea
                  id="new-role-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="A short note so others know when to use it."
                />
              </div>
            </div>

            <CapabilityPicker
              selected={selected}
              onToggle={toggle}
              disabled={pending}
            />

            <div className="mt-5 flex gap-2">
              <Btn
                type="button"
                variant="green"
                disabled={pending || !name.trim()}
                onClick={() =>
                  start(async () => {
                    const r = await createRole(name, description, [...selected]);
                    if (r.ok) {
                      toast.success(r.message);
                      setCreating(false);
                      setName("");
                      setDescription("");
                      setSelected(new Set());
                      router.refresh();
                    } else toast.error(r.message);
                  })
                }
              >
                Create role
              </Btn>
              <Btn
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => setCreating(false)}
              >
                Cancel
              </Btn>
            </div>
          </div>
        ) : (
          <Btn type="button" variant="ghost" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New role
          </Btn>
        )}
      </div>
    </div>
  );
}
