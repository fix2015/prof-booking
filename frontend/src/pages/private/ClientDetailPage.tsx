import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, User, Phone, Mail, Calendar, TrendingUp, DollarSign,
  Plus, Pencil, Trash2, Upload, X, Tag, Clock,
} from "lucide-react";
import { clientsApi } from "@/api/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/useToast";
import { useAuthContext } from "@/context/AuthContext";
import type { ClientNote, ClientPhoto } from "@/types";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDatetime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ---------------------------------------------------------------------------
// Note card
// ---------------------------------------------------------------------------

function NoteCard({
  note,
  canEdit,
  onEdit,
  onDelete,
}: {
  note: ClientNote;
  canEdit: boolean;
  onEdit: (note: ClientNote) => void;
  onDelete: (note: ClientNote) => void;
}) {
  return (
    <div className="border border-ds-border rounded-ds-xl p-ds-3 space-y-[4px] bg-ds-bg-primary">
      <div className="flex items-start justify-between gap-ds-2">
        <span className="ds-body-strong text-ds-text-primary">{note.title}</span>
        {canEdit && (
          <div className="flex gap-ds-1 shrink-0">
            <button onClick={() => onEdit(note)} className="p-[4px] hover:text-ds-interactive transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(note)} className="p-[4px] hover:text-[var(--ds-feedback-error)] transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      <p className="ds-body text-ds-text-secondary whitespace-pre-wrap">{note.content}</p>
      <p className="ds-caption text-ds-text-muted">{formatDatetime(note.created_at)}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Photo card
// ---------------------------------------------------------------------------

function PhotoCard({
  photo,
  canEdit,
  onDelete,
}: {
  photo: ClientPhoto;
  canEdit: boolean;
  onDelete: (photo: ClientPhoto) => void;
}) {
  return (
    <div className="relative group rounded-ds-xl overflow-hidden aspect-square bg-ds-bg-tertiary">
      <img src={photo.url} alt={photo.caption ?? "client photo"} className="w-full h-full object-cover" />
      {photo.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-ds-text-inverse ds-caption px-ds-2 py-[4px] truncate">
          {photo.caption}
        </div>
      )}
      {canEdit && (
        <button
          onClick={() => onDelete(photo)}
          className="absolute top-[4px] right-[4px] opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--ds-feedback-error)] text-ds-text-inverse rounded-ds-full p-[2px]"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { role } = useAuthContext();
  const isProfessional = role === "professional";
  const isAdmin = role === "platform_admin";

  const id = Number(clientId);

  const { data: client, isLoading } = useQuery({
    queryKey: ["clients", id],
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
  });

  // ── Edit profile state ────────────────────────────
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", birth_date: "", avatar_url: "", tagInput: "" });
  const [profileTags, setProfileTags] = useState<string[]>([]);

  const openProfileEdit = () => {
    if (!client) return;
    setProfileForm({
      name: client.name,
      email: client.email ?? "",
      birth_date: client.birth_date ?? "",
      avatar_url: client.avatar_url ?? "",
      tagInput: "",
    });
    setProfileTags(client.tags ?? []);
    setEditingProfile(true);
  };

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof clientsApi.update>[1]) => clientsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients", id] });
      setEditingProfile(false);
      toast({ title: "Profile updated", variant: "success" });
    },
    onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
  });

  const saveProfile = () => {
    updateMutation.mutate({
      name: profileForm.name || undefined,
      email: profileForm.email || undefined,
      birth_date: profileForm.birth_date || undefined,
      avatar_url: profileForm.avatar_url || undefined,
      tags: profileTags,
    });
  };

  const addTag = () => {
    const tag = profileForm.tagInput.trim();
    if (tag && !profileTags.includes(tag)) setProfileTags((t) => [...t, tag]);
    setProfileForm((f) => ({ ...f, tagInput: "" }));
  };

  // ── Avatar upload ─────────────────────────────────
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/v1/upload/image", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      await clientsApi.update(id, { avatar_url: url });
      qc.invalidateQueries({ queryKey: ["clients", id] });
      toast({ title: "Avatar updated", variant: "success" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Notes ─────────────────────────────────────────
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState<ClientNote | null>(null);
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });

  const addNoteMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) => clientsApi.addNote(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients", id] });
      setShowNoteForm(false);
      setNoteForm({ title: "", content: "" });
      toast({ title: "Note added", variant: "success" });
    },
    onError: () => toast({ title: "Failed to add note", variant: "destructive" }),
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, data }: { noteId: number; data: { title?: string; content?: string } }) =>
      clientsApi.updateNote(id, noteId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients", id] });
      setEditingNote(null);
      setNoteForm({ title: "", content: "" });
      toast({ title: "Note updated", variant: "success" });
    },
    onError: () => toast({ title: "Failed to update note", variant: "destructive" }),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: number) => clientsApi.deleteNote(id, noteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients", id] });
      toast({ title: "Note deleted" });
    },
    onError: () => toast({ title: "Failed to delete note", variant: "destructive" }),
  });

  const openEditNote = (note: ClientNote) => {
    setEditingNote(note);
    setNoteForm({ title: note.title, content: note.content });
    setShowNoteForm(true);
  };

  const submitNote = () => {
    if (!noteForm.title.trim() || !noteForm.content.trim()) return;
    if (editingNote) {
      updateNoteMutation.mutate({ noteId: editingNote.id, data: noteForm });
    } else {
      addNoteMutation.mutate(noteForm);
    }
  };

  const cancelNoteForm = () => {
    setShowNoteForm(false);
    setEditingNote(null);
    setNoteForm({ title: "", content: "" });
  };

  // ── Photos ────────────────────────────────────────
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoCaption, setPhotoCaption] = useState("");

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: number) => clientsApi.deletePhoto(id, photoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients", id] });
      toast({ title: "Photo deleted" });
    },
    onError: () => toast({ title: "Failed to delete photo", variant: "destructive" }),
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/v1/upload/image", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      await clientsApi.addPhoto(id, { url, caption: photoCaption || undefined });
      qc.invalidateQueries({ queryKey: ["clients", id] });
      setPhotoCaption("");
      toast({ title: "Photo added", variant: "success" });
    } catch {
      toast({ title: "Photo upload failed", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  // ── Delete client (admin) ─────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => clientsApi.delete(id),
    onSuccess: () => {
      navigate("/clients");
      toast({ title: "Client deleted" });
    },
    onError: () => toast({ title: "Failed to delete client", variant: "destructive" }),
  });

  // ── Render ────────────────────────────────────────

  if (isLoading) return <Spinner className="mx-auto mt-20" />;
  if (!client) return <div className="text-center py-ds-12 text-ds-text-secondary">Client not found.</div>;

  return (
    <div className="space-y-ds-6 max-w-2xl mx-auto">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/clients")} className="gap-ds-2">
        <ArrowLeft className="w-4 h-4" />
        Clients
      </Button>

      {/* Profile card */}
      <Card>
        <CardContent className="pt-ds-6">
          {editingProfile ? (
            <div className="space-y-ds-4">
              <div className="flex items-center gap-ds-4">
                <div className="w-16 h-16 rounded-ds-full bg-ds-bg-tertiary flex items-center justify-center overflow-hidden shrink-0">
                  {profileForm.avatar_url ? (
                    <img src={profileForm.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-ds-text-muted" />
                  )}
                </div>
                <div className="space-y-[4px] flex-1">
                  <p className="ds-caption text-ds-text-muted">Avatar URL</p>
                  <Input
                    value={profileForm.avatar_url}
                    onChange={(e) => setProfileForm((f) => ({ ...f, avatar_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-ds-3">
                <div>
                  <p className="ds-caption text-ds-text-muted mb-[4px]">Name</p>
                  <Input value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <p className="ds-caption text-ds-text-muted mb-[4px]">Email</p>
                  <Input value={profileForm.email} onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <p className="ds-caption text-ds-text-muted mb-[4px]">Birth date</p>
                  <Input type="date" value={profileForm.birth_date} onChange={(e) => setProfileForm((f) => ({ ...f, birth_date: e.target.value }))} />
                </div>
              </div>
              {/* Tags */}
              <div>
                <p className="ds-caption text-ds-text-muted mb-[4px]">Tags</p>
                <div className="flex gap-ds-2 flex-wrap mb-ds-2">
                  {profileTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-[4px]">
                      {tag}
                      <button onClick={() => setProfileTags((t) => t.filter((x) => x !== tag))}>
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-ds-2">
                  <Input
                    value={profileForm.tagInput}
                    onChange={(e) => setProfileForm((f) => ({ ...f, tagInput: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Add tag…"
                  />
                  <Button variant="outline" size="sm" onClick={addTag} disabled={!profileForm.tagInput.trim()}>
                    <Tag className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-ds-2">
                <Button onClick={saveProfile} disabled={updateMutation.isPending} size="sm">
                  {updateMutation.isPending ? "Saving…" : "Save"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingProfile(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-ds-4 items-start">
              {/* Avatar with upload overlay */}
              <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-ds-full bg-ds-bg-tertiary flex items-center justify-center overflow-hidden">
                  {client.avatar_url ? (
                    <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-ds-text-muted" />
                  )}
                </div>
                <label className="absolute inset-0 rounded-ds-full cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar ? <Spinner className="w-4 h-4" /> : <Upload className="w-4 h-4 text-ds-text-inverse" />}
                  <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </label>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-ds-2">
                <div className="flex items-start justify-between gap-ds-2">
                  <div>
                    <h2 className="ds-h3 text-ds-text-primary">{client.name}</h2>
                    {client.tags && client.tags.length > 0 && (
                      <div className="flex gap-ds-1 flex-wrap mt-[4px]">
                        {client.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="ds-caption">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={openProfileEdit} className="shrink-0">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="space-y-[4px] ds-body text-ds-text-secondary">
                  <div className="flex items-center gap-ds-2">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-ds-2">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.birth_date && (
                    <div className="flex items-center gap-ds-2">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{formatDate(client.birth_date)}</span>
                    </div>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex gap-ds-4 pt-[4px]">
                  <div className="text-center">
                    <div className="flex items-center gap-[4px] ds-caption text-ds-text-muted">
                      <TrendingUp className="w-3 h-3" /> Visits
                    </div>
                    <div className="ds-body-strong text-ds-text-primary">{client.total_visits}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-[4px] ds-caption text-ds-text-muted">
                      <DollarSign className="w-3 h-3" /> Spent
                    </div>
                    <div className="ds-body-strong text-ds-text-primary">${client.total_spent.toFixed(2)}</div>
                  </div>
                  {client.last_visit_at && (
                    <div className="text-center">
                      <div className="flex items-center gap-[4px] ds-caption text-ds-text-muted">
                        <Clock className="w-3 h-3" /> Last visit
                      </div>
                      <div className="ds-body-strong text-ds-text-primary">{formatDate(client.last_visit_at)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Private notes */}
      <Card>
        <CardHeader className="pb-ds-3">
          <div className="flex items-center justify-between">
            <CardTitle className="ds-body-strong">
              {role === "provider_owner" ? "Team Notes" : "My Private Notes"}
            </CardTitle>
            {isProfessional && !showNoteForm && (
              <Button size="sm" variant="outline" onClick={() => setShowNoteForm(true)} className="gap-[4px]">
                <Plus className="w-3.5 h-3.5" /> Add Note
              </Button>
            )}
          </div>
          {role === "provider_owner" && (
            <p className="ds-caption text-ds-text-muted">Notes added by all professionals in your salon</p>
          )}
          {isProfessional && (
            <p className="ds-caption text-ds-text-muted">Only you can see these notes</p>
          )}
        </CardHeader>
        <CardContent className="space-y-ds-3">
          {/* Note form */}
          {isProfessional && showNoteForm && (
            <div className="border border-ds-border rounded-ds-xl p-ds-3 space-y-ds-3 bg-ds-bg-secondary">
              <Input
                value={noteForm.title}
                onChange={(e) => setNoteForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Title (e.g. Nail color used)"
              />
              <textarea
                value={noteForm.content}
                onChange={(e) => setNoteForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Note content…"
                rows={3}
                className="w-full ds-body border border-ds-border rounded-ds-md px-ds-3 py-ds-2 bg-ds-bg-primary resize-none focus:outline-none focus:border-ds-interactive text-ds-text-primary"
              />
              <div className="flex gap-ds-2">
                <Button
                  size="sm"
                  onClick={submitNote}
                  disabled={addNoteMutation.isPending || updateNoteMutation.isPending || !noteForm.title.trim() || !noteForm.content.trim()}
                >
                  {editingNote ? "Update" : "Add Note"}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelNoteForm}>Cancel</Button>
              </div>
            </div>
          )}

          {client.my_notes.length === 0 && !showNoteForm && (
            <p className="ds-body text-ds-text-secondary text-center py-ds-4">No notes yet.</p>
          )}

          {client.my_notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              canEdit={isProfessional}
              onEdit={openEditNote}
              onDelete={(n) => deleteNoteMutation.mutate(n.id)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader className="pb-ds-3">
          <div className="flex items-center justify-between flex-wrap gap-ds-2">
            <CardTitle className="ds-body-strong">
              {role === "provider_owner" ? "Team Photos" : "My Photos"}
            </CardTitle>
            {isProfessional && (
              <div className="flex items-center gap-ds-2">
                <Input
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Caption (optional)"
                  className="w-40"
                />
                <label className="cursor-pointer">
                  <Button size="sm" variant="outline" asChild>
                    <span className="gap-[4px]">
                      {uploadingPhoto ? <Spinner className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                      Upload
                    </span>
                  </Button>
                  <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                </label>
              </div>
            )}
          </div>
          {isProfessional && (
            <p className="ds-caption text-ds-text-muted">Only you can see these photos</p>
          )}
        </CardHeader>
        <CardContent>
          {client.my_photos.length === 0 ? (
            <p className="ds-body text-ds-text-secondary text-center py-ds-4">No photos yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-ds-2">
              {client.my_photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  canEdit={isProfessional}
                  onDelete={(p) => deletePhotoMutation.mutate(p.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session history */}
      <Card>
        <CardHeader className="pb-ds-3">
          <CardTitle className="ds-body-strong">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-ds-2">
          {client.recent_sessions.length === 0 ? (
            <p className="ds-body text-ds-text-secondary text-center py-ds-4">No sessions found.</p>
          ) : (
            client.recent_sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between ds-body py-ds-2 border-b border-ds-border last:border-0">
                <div className="space-y-[2px]">
                  <div className="ds-body-strong text-ds-text-primary">{s.service_name ?? "Service"}</div>
                  <div className="ds-caption text-ds-text-muted">
                    {formatDatetime(s.starts_at)}
                    {s.professional_name && ` · ${s.professional_name}`}
                  </div>
                </div>
                <div className="text-right space-y-[2px]">
                  <Badge variant={s.status === "completed" ? "default" : "secondary"} className="ds-caption">
                    {s.status}
                  </Badge>
                  {s.price != null && (
                    <div className="ds-caption text-ds-text-muted">${s.price.toFixed(2)}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Admin: delete client */}
      {isAdmin && (
        <Card className="border-[var(--ds-feedback-error)]">
          <CardContent className="pt-ds-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="ds-body-strong text-ds-text-primary">Delete Client</p>
                <p className="ds-caption text-ds-text-muted">Permanently removes this client and all their notes/photos.</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm(`Delete ${client.name}? This cannot be undone.`)) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
