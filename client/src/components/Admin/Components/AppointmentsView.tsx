import { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Clock3, 
  FileText, 
  Search, 
  Filter, 
  Loader2,
  Edit3,
  X
} from "lucide-react";
import { useAuth } from "../../Common/context/AuthContext";
import { useToast } from "../../../components/Common/context/ToastContext";
import { API_URL, getAuthToken } from "../../../utils/api";

interface Appointment {
  _id: string;
  customerName: string;
  phone: string;
  userLocation: string;
  preferredDate: string;
  interests: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AppointmentsView() {
  const { user: adminUser } = useAuth();
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selected for viewing/editing notes
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [notesText, setNotesText] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/appointments`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data || []);
      } else {
        showToast(data.message || "Failed to load appointments.", "error");
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      showToast("Network error loading appointments.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchAppointments();
    }
  }, [adminUser]);

  const handleUpdateStatusAndNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;

    try {
      setIsUpdating(true);
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/appointments/${editingAppointment._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus || editingAppointment.status,
          adminNotes: notesText
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast("Appointment updated successfully.", "success");
        setAppointments(prev =>
          prev.map(app => (app._id === editingAppointment._id ? data.data : app))
        );
        setEditingAppointment(null);
      } else {
        showToast(data.message || "Failed to update appointment.", "error");
      }
    } catch (error) {
      console.error("Failed to update appointment:", error);
      showToast("Network error updating appointment.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickStatusChange = async (appointmentId: string, targetStatus: string) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/appointments/${appointmentId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ status: targetStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Appointment marked as ${targetStatus}.`, "success");
        setAppointments(prev =>
          prev.map(app => (app._id === appointmentId ? data.data : app))
        );
      } else {
        showToast(data.message || "Failed to change status.", "error");
      }
    } catch (error) {
      console.error("Quick status error:", error);
      showToast("Failed to change appointment status.", "error");
    }
  };

  // Filtered list
  const filteredAppointments = appointments.filter(app => {
    const matchesStatus = statusFilter === "All" || app.status === statusFilter;
    const matchesSearch = 
      app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.phone.includes(searchTerm) ||
      app.userLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.interests.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Metrics
  const pendingCount = appointments.filter(a => a.status === 'Pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'Confirmed').length;
  const completedCount = appointments.filter(a => a.status === 'Completed').length;

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="animate-in fade-in duration-500 font-jost">
      {/* HEADER */}
      <header className="mb-6 md:mb-10">
        <h1 className="font-cormorant text-3xl sm:text-4xl text-[#4A0E1B] mb-2">
          Boutique Appointments
        </h1>
        <p className="text-[#7A6A5C] text-sm">
          Coordinate showroom private viewings, karigar bespoke consultations, and gold exchanges.
        </p>
      </header>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-5 border border-[#C9A24B]/30 shadow-sm rounded-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase font-semibold">Total Requests</h3>
            <div className="bg-[#4A0E1B]/10 p-2 text-[#4A0E1B] rounded-full">
              <Calendar size={16} />
            </div>
          </div>
          <p className="font-cormorant text-3xl text-[#4A0E1B]">{appointments.length}</p>
          <p className="text-xs text-[#7A6A5C] mt-1">All recorded bookings</p>
        </div>

        <div className="bg-white p-5 border border-[#C9A24B]/30 shadow-sm rounded-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase font-semibold">Pending Action</h3>
            <div className="bg-amber-100 p-2 text-amber-800 rounded-full">
              <Clock3 size={16} />
            </div>
          </div>
          <p className="font-cormorant text-3xl text-amber-700">{pendingCount}</p>
          <p className="text-xs text-amber-700 mt-1 font-medium">Requires concierge callback</p>
        </div>

        <div className="bg-white p-5 border border-[#C9A24B]/30 shadow-sm rounded-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase font-semibold">Confirmed Viewings</h3>
            <div className="bg-blue-100 p-2 text-blue-800 rounded-full">
              <CheckCircle size={16} />
            </div>
          </div>
          <p className="font-cormorant text-3xl text-blue-700">{confirmedCount}</p>
          <p className="text-xs text-blue-700 mt-1">Ready for showroom visit</p>
        </div>

        <div className="bg-white p-5 border border-[#C9A24B]/30 shadow-sm rounded-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase font-semibold">Completed</h3>
            <div className="bg-green-100 p-2 text-green-800 rounded-full">
              <CheckCircle size={16} />
            </div>
          </div>
          <p className="font-cormorant text-3xl text-green-700">{completedCount}</p>
          <p className="text-xs text-green-700 mt-1">Viewings concluded</p>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white p-4 mb-6 border border-[#C9A24B]/30 rounded-sm shadow-sm flex flex-col md:flex-row justify-between gap-4 items-center">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A5C]" />
          <input
            type="text"
            placeholder="Search by client, phone, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[#C9A24B]/30 rounded-sm text-sm focus:outline-none focus:border-[#C9A24B] text-[#4A0E1B]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <Filter size={16} className="text-[#C9A24B] shrink-0" />
          <span className="text-xs uppercase tracking-wider text-[#7A6A5C] shrink-0 font-medium">Status:</span>
          {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs rounded-sm transition-colors uppercase tracking-wider cursor-pointer whitespace-nowrap font-medium ${
                statusFilter === st
                  ? "bg-[#4A0E1B] text-[#F3E9D8]"
                  : "bg-[#FDFBF4] text-[#7A6A5C] hover:bg-[#EAE3D5] border border-[#C9A24B]/20"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* APPOINTMENTS TABLE */}
      <div className="bg-white border border-[#C9A24B]/30 shadow-sm rounded-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="bg-[#FDFBF4] text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase border-b border-[#C9A24B]/20">
                <th className="p-4 font-semibold">Client</th>
                <th className="p-4 font-semibold">Preferred Date</th>
                <th className="p-4 font-semibold">Location</th>
                <th className="p-4 font-semibold">Interests & Pieces</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Admin Notes</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#7A6A5C]">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 size={20} className="animate-spin text-[#C9A24B]" />
                      <span>Loading appointments...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#7A6A5C]">
                    No appointment requests found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map(app => (
                  <tr key={app._id} className="border-b border-[#C9A24B]/10 hover:bg-[#FDFBF4]/60 transition-colors">
                    {/* Client */}
                    <td className="p-4">
                      <p className="font-medium text-[#4A0E1B]">{app.customerName}</p>
                      <a
                        href={`tel:${app.phone}`}
                        className="text-xs text-[#C9A24B] hover:text-[#4A0E1B] flex items-center gap-1 mt-0.5"
                      >
                        <Phone size={12} />
                        <span>{app.phone}</span>
                      </a>
                    </td>

                    {/* Preferred Date */}
                    <td className="p-4 text-[#4A0E1B]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar size={14} className="text-[#C9A24B]" />
                        <span>{formatDate(app.preferredDate)}</span>
                      </div>
                      <p className="text-[11px] text-[#7A6A5C] mt-0.5">
                        Booked {new Date(app.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </td>

                    {/* Location */}
                    <td className="p-4 text-[#7A6A5C]">
                      <div className="flex items-start gap-1 max-w-[200px] truncate" title={app.userLocation}>
                        <MapPin size={14} className="text-[#C9A24B] shrink-0 mt-0.5" />
                        <span className="truncate">{app.userLocation}</span>
                      </div>
                    </td>

                    {/* Interests */}
                    <td className="p-4 text-[#4A0E1B]">
                      <p className="max-w-[240px] truncate" title={app.interests}>
                        {app.interests}
                      </p>
                    </td>

                    {/* Status Badge & Dropdown */}
                    <td className="p-4">
                      <select
                        value={app.status}
                        onChange={(e) => handleQuickStatusChange(app._id, e.target.value)}
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-sm border cursor-pointer outline-none ${
                          app.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                          app.status === 'Confirmed' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                          app.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-300' :
                          'bg-red-50 text-red-700 border-red-300'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Admin Notes */}
                    <td className="p-4 text-[#7A6A5C] text-xs max-w-[180px] truncate">
                      {app.adminNotes ? (
                        <span title={app.adminNotes}>{app.adminNotes}</span>
                      ) : (
                        <span className="italic opacity-60">No notes</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setEditingAppointment(app);
                          setNewStatus(app.status);
                          setNotesText(app.adminNotes || "");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#4A0E1B] border border-[#C9A24B]/40 hover:bg-[#C9A24B]/10 rounded-sm transition-colors cursor-pointer"
                        title="Edit appointment notes and timing"
                      >
                        <Edit3 size={14} />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT / MANAGE APPOINTMENT MODAL */}
      {editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FDFBF4] w-full max-w-lg rounded-sm shadow-2xl border border-[#C9A24B]/40 relative text-left">
            <div className="p-5 border-b border-[#C9A24B]/20 flex justify-between items-center bg-white">
              <div>
                <h3 className="font-cormorant text-2xl text-[#4A0E1B]">Manage Boutique Appointment</h3>
                <p className="font-jost text-xs text-[#7A6A5C]">Client: {editingAppointment.customerName}</p>
              </div>
              <button
                onClick={() => setEditingAppointment(null)}
                className="text-[#7A6A5C] hover:text-[#4A0E1B] p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusAndNotes} className="p-6 space-y-4 font-jost">
              {/* Quick Details */}
              <div className="bg-white p-4 border border-[#EAE3D5] rounded-sm text-xs space-y-2">
                <p><strong className="text-[#4A0E1B]">Phone:</strong> <a href={`tel:${editingAppointment.phone}`} className="text-[#C9A24B] underline">{editingAppointment.phone}</a></p>
                <p><strong className="text-[#4A0E1B]">Location:</strong> {editingAppointment.userLocation}</p>
                <p><strong className="text-[#4A0E1B]">Preferred Date:</strong> {formatDate(editingAppointment.preferredDate)}</p>
                <p><strong className="text-[#4A0E1B]">Interests:</strong> {editingAppointment.interests}</p>
              </div>

              <div>
                <label className="block text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-1.5 font-semibold">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-white border border-[#C9A24B]/40 p-2.5 text-xs text-[#4A0E1B] rounded-sm outline-none focus:border-[#C9A24B]"
                >
                  <option value="Pending">Pending Callback</option>
                  <option value="Confirmed">Confirmed Viewing</option>
                  <option value="Completed">Completed Viewing</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-1.5 font-semibold">
                  Concierge / Showroom Notes
                </label>
                <textarea
                  rows={4}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Record customer preferences, assigned karigar, showroom slot timing, or follow-up notes..."
                  className="w-full bg-white border border-[#C9A24B]/40 p-3 text-xs text-[#4A0E1B] rounded-sm outline-none focus:border-[#C9A24B] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#EAE3D5]">
                <button
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-[#7A6A5C] hover:text-[#4A0E1B] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2 bg-[#4A0E1B] text-[#F3E9D8] text-xs uppercase tracking-wider font-semibold rounded-sm hover:bg-[#3B0A14] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
