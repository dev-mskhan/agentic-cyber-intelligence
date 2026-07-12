import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteMemberSchema } from "../../features/team/schemas";
import { useGetCurrentSessionQuery } from "../../api/authApi";
import { useGetOrganizationQuery } from "../../api/organizationApi";
import {
  useGetTeamQuery,
  useInviteMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
} from "../../api/teamApi";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Table } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../components/ui/Toast";
import { Users, UserPlus, Shield, Trash2, Edit2, ShieldAlert } from "lucide-react";
import type { User, UserRole } from "../../types/api.types";

export const Team: React.FC = () => {
  const { showToast } = useToast();
  const { data: session } = useGetCurrentSessionQuery();
  const { data: teamResponse, isLoading } = useGetTeamQuery();
  const [inviteMember, { isLoading: isInviting }] = useInviteMemberMutation();
  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateMemberRoleMutation();
  const [removeMember] = useRemoveMemberMutation();

  // Responses are wrapped as { statusCode, data, message, success }
  // The team endpoint's data is { notifyEmails: string[], users: User[] }
  const team = teamResponse?.data?.users ?? [];
  const notifyEmails = teamResponse?.data?.notifyEmails ?? [];

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("viewer");
  const [editEmailNotify, setEditEmailNotify] = useState<boolean>(false);

  const currentUser = session?.data.user;

  const startEditing = (member: any) => {
    setEditingUserId(member._id);
    setEditRole(member.role);
    setEditEmailNotify(notifyEmails.includes(member.email));
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "viewer" as const,
    },
  });

  const onInviteSubmit = async (data: any) => {
    try {
      await inviteMember(data).unwrap();
      showToast("success", `Invite sent to ${data.email}.`);
      reset();
      setIsInviteOpen(false);
    } catch (err: any) {
      showToast("error", err?.data?.message || "Could not send the invite.");
    }
  };

  const handleUpdateMember = async (userId: string) => {
    try {
      await updateRole({ userId, role: editRole, emailNotify: editEmailNotify }).unwrap();
      showToast("success", "Member updated.");
      setEditingUserId(null);
    } catch {
      showToast("error", "Could not update this member.");
    }
  };

  const handleEvictMember = async (userId: string, name: string) => {
    if (userId === currentUser?._id) {
      showToast("error", "You can't remove yourself from the team.");
      return;
    }
    if (!window.confirm(`Remove ${name} from your team?`)) {
      return;
    }
    try {
      await removeMember(userId).unwrap();
      showToast("success", `${name} was removed.`);
    } catch {
      showToast("error", "Could not remove this member.");
    }
  };

  const getRoleColor = (role: string) => {
    if (role === "admin") return "bg-slate-900 text-white border-slate-950";
    if (role === "analyst") return "bg-blue-50 text-blue-800 border-blue-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-sm text-brand-muted">
        Loading team...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-5">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-brand-primary">
            Team
          </h2>
          <p className="text-sm text-brand-muted mt-0.5">
            Add teammates, set their access level, and remove people when needed.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsInviteOpen(!isInviteOpen)}
          className="flex items-center gap-1.5"
        >
          <UserPlus className="h-4 w-4" />
          <span>Invite Member</span>
        </Button>
      </div>

      {/* INVITE FORM COLLAPSIBLE */}
      {isInviteOpen && (
        <Card title="Invite a Team Member" description="We'll send them a link to join.">
          <form onSubmit={handleSubmit(onInviteSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="teammate@company.com"
                error={errors.email?.message}
                {...register("email")}
              />

              <div>
                <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-1.5">
                  Access Level
                </label>
                <select
                  className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  {...register("role")}
                >
                  <option value="viewer">Viewer (can only view)</option>
                  <option value="analyst">Analyst (can run scans, add assets)</option>
                  <option value="admin">Admin (full access, including team & billing)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isInviting}>
                Send Invite
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ROSTER TABLE */}
      <Card title="Team Members" description={`${team.length} people have access to this organization.`}>
        <Table headers={["Name", "Email", "Access Level", "Status", "Actions"]}>
          {team.map((member) => {
            const isEditing = editingUserId === member._id;
            const isSelf = member._id === currentUser?._id;
            const getsReports = notifyEmails.includes(member.email);
            return (
              <tr key={member._id} className="border-b border-brand-border last:border-0 hover:bg-slate-50/50">
                <td className="px-5 py-4 text-sm font-bold text-brand-primary flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold font-mono">
                    {member.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span>{member.name}</span>
                    {isSelf && <span className="text-[10px] text-slate-500 font-mono ml-1.5 font-normal">(YOU)</span>}
                  </div>
                </td>
                <td className="px-5 py-4 text-xs font-semibold font-mono text-brand-secondary">
                  {member.email}
                </td>
                <td className="px-5 py-4">
                  {isEditing ? (
                    <div className="flex flex-col gap-2.5 max-w-[180px]">
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        className="text-xs bg-white border border-brand-border rounded-lg px-2.5 py-1.5 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="analyst">Analyst</option>
                        <option value="admin">Admin</option>
                      </select>

                      {/* Notify toggle */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-brand-secondary font-semibold select-none">
                          Send them reports
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={editEmailNotify}
                          onClick={() => setEditEmailNotify((prev) => !prev)}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1 ${
                            editEmailNotify ? "bg-slate-900" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                              editEmailNotify ? "translate-x-4.5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={getsReports}
                          disabled
                          className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors cursor-default ${
                            getsReports ? "bg-slate-900" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
                              getsReports ? "translate-x-3.5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {getsReports ? "Gets reports" : "No reports"}
                        </span>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-800 font-mono">
                      Active
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {/* Edit button */}
                    {!isSelf ? (
                      isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateMember(member._id)}
                            disabled={isUpdatingRole}
                            className="px-2.5 py-1 text-xs font-bold bg-slate-900 text-white rounded hover:bg-slate-800 cursor-pointer active:scale-95"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-2.5 py-1 text-xs font-medium border border-brand-border text-brand-secondary hover:text-brand-primary rounded hover:bg-slate-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(member)}
                          className="text-slate-400 hover:text-slate-900 p-1 rounded-md hover:bg-slate-50 cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )
                    ) : null}

                    {/* Evict/Delete button */}
                    {!isSelf ? (
                      <button
                        onClick={() => handleEvictMember(member._id, member.name)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-brand-muted italic">That's you</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
};
