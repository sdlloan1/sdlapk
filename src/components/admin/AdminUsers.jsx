import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { formatINR } from "@/lib/sdlUtils";
import { CheckCircle2, XCircle, Clock, Pause, Search
} from "lucide-react";
import UserDetailTabs from "@/components/admin/UserDetailTabs";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    const list = await base44.entities.User.list("-created_date", 200);
    setUsers(list.filter((u) => u.role !== "admin"));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const getName = (u) => u.registration_complete ? (u.display_name || u.full_name || "Unknown") : "KYC Incomplete";
  const getInitial = (u) => (u.registration_complete ? (u.display_name || u.full_name || "") : "")?.[0]?.toUpperCase() || "?";

  let filtered = filter === "all" ? users : users.filter((u) => u.kyc_status === filter);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((u) =>
      (u.display_name || u.full_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.mobile_number || "").includes(q)
    );
  }

  if (loading) return <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or mobile..."
          className="neu-input w-full h-12 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", "pending", "approved", "rejected", "hold"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap capitalize ${filter === f ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>
            {f} {f !== "all" && `(${users.filter((u) => u.kyc_status === f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="neu-card p-8 text-center text-sm text-slate-400">No users found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <div key={u.id} className="neu-card p-4 cursor-pointer active:scale-[0.99] transition-transform" onClick={() => setSelected(u)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {u.profile_picture ? <img src={u.profile_picture} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" /> :
                    <div className="w-10 h-10 rounded-full sdl-gradient flex items-center justify-center text-white font-bold shrink-0">{getInitial(u)}</div>}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{getName(u)}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    <p className="text-xs text-slate-400">{u.mobile_number}</p>
                  </div>
                </div>
                <StatusBadge status={u.kyc_status} />
              </div>
              {u.registration_complete && (
                <div className="mt-3 flex items-center justify-between text-xs gap-2">
                  <span className="text-slate-500 min-w-0">Limit: <span className="font-semibold text-slate-700">{formatINR(u.loan_limit || 0)}</span></span>
                  <span className="sdl-gradient-text font-medium shrink-0 whitespace-nowrap">View Details →</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && <UserDetailTabs user={selected} onClose={() => setSelected(null)} onUpdated={() => { setSelected(null); loadData(); }} />}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { color: "bg-amber-100 text-amber-600", icon: Clock, label: "Pending" },
    approved: { color: "bg-green-100 text-sdl-green", icon: CheckCircle2, label: "Approved" },
    rejected: { color: "bg-red-100 text-sdl-red", icon: XCircle, label: "Rejected" },
    hold: { color: "bg-slate-200 text-slate-500", icon: Pause, label: "On Hold" },
    not_submitted: { color: "bg-slate-100 text-slate-400", icon: Clock, label: "Not Submitted" },
  };
  const m = map[status] || map.not_submitted;
  const Icon = m.icon;
  return <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full shrink-0 ${m.color}`}><Icon className="w-3 h-3 shrink-0" />{m.label}</span>;
}