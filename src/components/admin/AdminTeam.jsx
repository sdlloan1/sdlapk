import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import NeuInput from "@/components/NeuInput";
import { Plus, Trash2, X, Loader2, Camera, ChevronUp, ChevronDown, Pencil } from "lucide-react";

export default function AdminTeam() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [reordering, setReordering] = useState(false);

  const loadData = async () => {
    const t = await base44.entities.TeamMember.list("order");
    setTeam(t);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const remove = async (id) => {
    if (!confirm("Remove this team member?")) return;
    await base44.entities.TeamMember.delete(id);
    loadData();
  };

  const move = async (index, direction) => {
    const newTeam = [...team];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newTeam.length) return;
    [newTeam[index], newTeam[swapIndex]] = [newTeam[swapIndex], newTeam[index]];
    setTeam(newTeam);
    setReordering(true);
    try {
      await base44.entities.TeamMember.bulkUpdate(
        newTeam.map((m, i) => ({ id: m.id, order: i }))
      );
    } catch (e) { alert("Failed to reorder"); loadData(); }
    finally { setReordering(false); }
  };

  if (loading) return <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <button onClick={() => setShowAdd(true)} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg">
        <Plus className="w-4 h-4" /> Add Team Member
      </button>
      <div className="space-y-3">
        {team.map((m, i) => (
          <div key={m.id} className="neu-card p-4 flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <button disabled={reordering || i === 0} onClick={() => move(i, -1)} className="w-6 h-5 rounded-md neu-inset-sm flex items-center justify-center text-slate-400 disabled:opacity-30 hover:text-sdl-orange">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button disabled={reordering || i === team.length - 1} onClick={() => move(i, 1)} className="w-6 h-5 rounded-md neu-inset-sm flex items-center justify-center text-slate-400 disabled:opacity-30 hover:text-sdl-orange">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            {m.photo_url ? <img src={m.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" /> :
              <div className="w-12 h-12 rounded-full sdl-gradient flex items-center justify-center text-white font-bold">{m.name?.[0]}</div>}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-700">{m.name}</p>
              <p className="text-xs text-slate-500">{m.role}</p>
              <p className="text-[10px] text-slate-400">{m.education}</p>
              {m.upi_id && (
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-mono truncate">UPI: {m.upi_id}</span>
                  {m.upi_enabled && <span className="text-[9px] font-bold text-white sdl-gradient px-1.5 py-0.5 rounded-full">Active Payee</span>}
                </div>
              )}
            </div>
            <button onClick={() => setEditMember(m)} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-500 hover:text-sdl-orange">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => remove(m.id)} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-sdl-red">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      {showAdd && <AddMemberModal team={team} onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); loadData(); }} />}
      {editMember && <EditMemberModal member={editMember} team={team} onClose={() => setEditMember(null)} onDone={() => { setEditMember(null); loadData(); }} />}
    </div>
  );
}

function AddMemberModal({ team, onClose, onDone }) {
  const [name, setName] = useState("");
  const [education, setEducation] = useState("");
  const [role, setRole] = useState("");
  const [photo, setPhoto] = useState("");
  const [upiId, setUpiId] = useState("");
  const [upiEnabled, setUpiEnabled] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePhoto = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setPhoto(file_url); }
    catch { alert("Upload failed"); } finally { setUploading(false); }
  };

  const submit = async () => {
    if (!name || !role) { alert("Name and role required"); return; }
    setLoading(true);
    try {
      if (upiEnabled) {
        const others = (team || []).filter((m) => m.upi_enabled);
        if (others.length) {
          await base44.entities.TeamMember.bulkUpdate(others.map((m) => ({ id: m.id, upi_enabled: false })));
        }
      }
      await base44.entities.TeamMember.create({ name, education, role, photo_url: photo, upi_id: upiId.trim(), upi_enabled: upiEnabled });
      onDone();
    } catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">Add Team Member</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <label className="flex justify-center mb-2">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center cursor-pointer relative overflow-hidden ${photo ? "" : "neu-inset"}`}>
              {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> :
                uploading ? <Loader2 className="w-6 h-6 text-sdl-orange animate-spin" /> : <Camera className="w-6 h-6 text-slate-400" />}
              <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handlePhoto} className="hidden" />
            </div>
          </label>
          <NeuInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
          <NeuInput value={education} onChange={(e) => setEducation(e.target.value)} placeholder="Education (e.g. B-tech)" />
          <NeuInput value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. Account Manager)" />
          <div className="neu-inset rounded-2xl p-3 space-y-2">
            <label className="block text-[11px] font-medium text-slate-500">UPI ID (for receiving payments)</label>
            <NeuInput value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="e.g. name@bank" />
            <button type="button" onClick={() => setUpiEnabled((v) => !v)} className={`w-full h-10 rounded-xl text-xs font-semibold flex items-center justify-between px-3 ${upiEnabled ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>
              <span>{upiEnabled ? "Enabled as active payee" : "Enable as active payee"}</span>
              <span className={`w-9 h-5 rounded-full relative transition ${upiEnabled ? "bg-white/50" : "bg-slate-300"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${upiEnabled ? "left-4" : "left-0.5"}`} />
              </span>
            </button>
            {upiEnabled && <p className="text-[10px] text-sdl-green">Only one team member can be the active payee at a time.</p>}
          </div>
          <button disabled={loading} onClick={submit} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditMemberModal({ member, team, onClose, onDone }) {
  const [name, setName] = useState(member.name || "");
  const [education, setEducation] = useState(member.education || "");
  const [role, setRole] = useState(member.role || "");
  const [photo, setPhoto] = useState(member.photo_url || "");
  const [upiId, setUpiId] = useState(member.upi_id || "");
  const [upiEnabled, setUpiEnabled] = useState(!!member.upi_enabled);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePhoto = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setPhoto(file_url); }
    catch { alert("Upload failed"); } finally { setUploading(false); }
  };

  const submit = async () => {
    if (!name || !role) { alert("Name and role required"); return; }
    setLoading(true);
    try {
      if (upiEnabled) {
        const others = (team || []).filter((m) => m.id !== member.id && m.upi_enabled);
        if (others.length) {
          await base44.entities.TeamMember.bulkUpdate(others.map((m) => ({ id: m.id, upi_enabled: false })));
        }
      }
      await base44.entities.TeamMember.update(member.id, { name, education, role, photo_url: photo, upi_id: upiId.trim(), upi_enabled: upiEnabled });
      onDone();
    } catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">Edit Team Member</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <label className="flex justify-center mb-2">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center cursor-pointer relative overflow-hidden ${photo ? "" : "neu-inset"}`}>
              {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> :
                uploading ? <Loader2 className="w-6 h-6 text-sdl-orange animate-spin" /> : <Camera className="w-6 h-6 text-slate-400" />}
              <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handlePhoto} className="hidden" />
            </div>
          </label>
          <NeuInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
          <NeuInput value={education} onChange={(e) => setEducation(e.target.value)} placeholder="Education (e.g. B-tech)" />
          <NeuInput value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. Account Manager)" />
          <div className="neu-inset rounded-2xl p-3 space-y-2">
            <label className="block text-[11px] font-medium text-slate-500">UPI ID (for receiving payments)</label>
            <NeuInput value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="e.g. name@bank" />
            <button type="button" onClick={() => setUpiEnabled((v) => !v)} className={`w-full h-10 rounded-xl text-xs font-semibold flex items-center justify-between px-3 ${upiEnabled ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>
              <span>{upiEnabled ? "Enabled as active payee" : "Enable as active payee"}</span>
              <span className={`w-9 h-5 rounded-full relative transition ${upiEnabled ? "bg-white/50" : "bg-slate-300"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${upiEnabled ? "left-4" : "left-0.5"}`} />
              </span>
            </button>
            {upiEnabled && <p className="text-[10px] text-sdl-green">Only one team member can be the active payee at a time.</p>}
          </div>
          <button disabled={loading} onClick={submit} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}