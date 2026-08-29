"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Building, 
  Wallet, 
  MessageSquare, 
  FileText, 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Search, 
  Filter, 
  Activity, 
  Loader2, 
  LogOut, 
  ShieldAlert, 
  Eye, 
  Lock,
  ArrowRight
} from "lucide-react";

interface Query {
  id: string;
  studentName: string;
  studentPhone: string;
  question: string;
  answer: string | null;
  status: string;
  createdAt: string;
  pg: { name: string };
}

interface Booking {
  id: string;
  studentName: string;
  studentPhone: string;
  amountPaid: number;
  status: string;
  utr: string;
  checkInDate: string;
  createdAt: string;
  room: {
    sharingType: string;
    pg: { id: string; name: string };
  };
}

interface PgLead {
  id: string;
  hostelName: string;
  address: string;
  collegeName: string;
  ownerName: string;
  ownerPhone: string;
  sharingTypes: string;
  priceRange: string;
  status: string;
  createdAt: string;
  description?: string;
  locationUrl?: string;
  amenities?: string;
  imageUrl?: string;
  images?: string;
  distanceKm?: number;
}

interface College {
  id: string;
  name: string;
}

interface Owner {
  id: string;
  name: string;
  phone: string;
}

export default function AdminPortal() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pgs, setPgs] = useState<any[]>([]);
  const [leads, setLeads] = useState<PgLead[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "transactions" | "queries" | "leads"
  const [loading, setLoading] = useState(true);
  const [answeringId, setAnsweringId] = useState("");
  const [adminAnswer, setAdminAnswer] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const router = useRouter();

  // Selected details drawer states
  const [selectedPgDetail, setSelectedPgDetail] = useState<any | null>(null);
  const [guestSearchQuery, setGuestSearchQuery] = useState("");
  const [guestStatusFilter, setGuestStatusFilter] = useState("ALL");

  // CRUD PG modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<any | null>(null);
  const [showApproveLeadModal, setShowApproveLeadModal] = useState<PgLead | null>(null);

  // Form Fields State
  const [pgName, setPgName] = useState("");
  const [pgAddress, setPgAddress] = useState("");
  const [pgDescription, setPgDescription] = useState("");
  const [pgCollegeId, setPgCollegeId] = useState("");
  const [pgOwnerId, setPgOwnerId] = useState("");
  const [pgDistance, setPgDistance] = useState("0.5");
  const [pgAmenities, setPgAmenities] = useState("WiFi, Meals, RO Water, Security");
  const [pgImageUrl, setPgImageUrl] = useState("");
  const [pgImages, setPgImages] = useState("");
  const [pgReservationFee, setPgReservationFee] = useState("2000");

  const fetchAdminData = async () => {
    try {
      // 1. Verify session is admin
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok || !sessionData.user || sessionData.user.role !== "admin") {
        router.push("/login");
        return;
      }

      // 2. Fetch queries
      const queriesRes = await fetch("/api/queries");
      if (queriesRes.ok) {
        setQueries(await queriesRes.json());
      }

      // 3. Fetch bookings
      const bookingsRes = await fetch("/api/bookings");
      if (bookingsRes.ok) {
        setBookings(await bookingsRes.json());
      }

      // 4. Fetch PG Directory
      const pgsRes = await fetch("/api/admin/pgs");
      if (pgsRes.ok) {
        setPgs(await pgsRes.json());
      }

      // 5. Fetch ambassador submissions
      const leadsRes = await fetch("/api/partner");
      if (leadsRes.ok) {
        setLeads(await leadsRes.json());
      }

      // 6. Fetch setup directory (Colleges and Owners)
      const setupRes = await fetch("/api/admin/setup");
      if (setupRes.ok) {
        const setupData = await setupRes.json();
        setColleges(setupData.colleges);
        setOwners(setupData.owners);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAnswerSubmit = async (e: React.FormEvent, queryId: string) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const res = await fetch("/api/queries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queryId, answer: adminAnswer }),
      });

      if (res.ok) {
        setAdminAnswer("");
        setAnsweringId("");
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleBookingVerification = async (bookingId: string, status: string) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });

      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveRejectUpdates = async (pgId: string, action: "approve" | "reject") => {
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/admin/pgs/approve-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pgId, action }),
      });
      if (res.ok) {
        alert(action === "approve" ? "Updates approved and published live!" : "Proposed landlord edits discarded.");
        fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to process updates");
      }
    } catch (err) {
      alert("Error processing updates");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Create PG Submission
  const handleCreatePg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const res = await fetch("/api/admin/pgs/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pgName,
          address: pgAddress,
          description: pgDescription,
          collegeId: pgCollegeId,
          ownerId: pgOwnerId,
          distanceKm: pgDistance,
          amenities: pgAmenities,
          imageUrl: pgImageUrl,
          images: pgImages,
          reservationFee: pgReservationFee,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        resetForm();
        fetchAdminData();
        alert("PG Hostel added successfully with default double & triple sharing rooms!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create PG");
      }
    } catch (err) {
      alert("Error creating PG");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Update PG Submission
  const handleUpdatePg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    setSubmitLoading(true);

    try {
      const res = await fetch("/api/admin/pgs/crud", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: showEditModal.id,
          name: pgName,
          address: pgAddress,
          description: pgDescription,
          collegeId: pgCollegeId,
          ownerId: pgOwnerId,
          distanceKm: pgDistance,
          amenities: pgAmenities,
          imageUrl: pgImageUrl,
          images: pgImages,
          reservationFee: pgReservationFee,
          isVerified: showEditModal.isVerified,
        }),
      });

      if (res.ok) {
        setShowEditModal(null);
        resetForm();
        fetchAdminData();
        alert("PG Hostel details updated successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update PG");
      }
    } catch (err) {
      alert("Error updating PG");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete PG Submission
  const handleDeletePg = async (id: string) => {
    if (!confirm("Are you absolutely sure you want to delete this PG and all its rooms/bookings? This cannot be undone.")) return;

    try {
      const res = await fetch("/api/admin/pgs/crud", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchAdminData();
        alert("PG deleted successfully.");
      } else {
        alert("Failed to delete PG.");
      }
    } catch (err) {
      alert("Error deleting PG.");
    }
  };

  // Approve Lead
  const handleApproveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showApproveLeadModal) return;
    setSubmitLoading(true);

    try {
      const res = await fetch("/api/admin/pgs/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: showApproveLeadModal.hostelName,
          address: showApproveLeadModal.address,
          description: showApproveLeadModal.description || `Price Range: ${showApproveLeadModal.priceRange}. Sharing: ${showApproveLeadModal.sharingTypes}`,
          collegeId: pgCollegeId,
          ownerId: pgOwnerId,
          ownerName: showApproveLeadModal.ownerName,
          ownerPhone: showApproveLeadModal.ownerPhone,
          distanceKm: pgDistance || showApproveLeadModal.distanceKm?.toString() || "0.5",
          amenities: showApproveLeadModal.amenities || "WiFi, Meals, RO Water, Security",
          imageUrl: showApproveLeadModal.imageUrl || "",
          images: showApproveLeadModal.images || "",
          sharingTypes: showApproveLeadModal.sharingTypes,
        }),
      });

      if (res.ok) {
        await fetch("/api/partner", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: showApproveLeadModal.id,
            status: "Approved",
          }),
        });

        setShowApproveLeadModal(null);
        resetForm();
        fetchAdminData();
        alert("Ambassador form approved! PG registered and live on directory.");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to register PG from lead form");
      }
    } catch (err) {
      alert("Error processing ambassador approval");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Reject Lead
  const handleRejectLead = async (submissionId: string) => {
    if (!confirm("Are you sure you want to reject this ambassador form submission?")) return;

    try {
      const res = await fetch("/api/partner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          status: "Rejected",
        }),
      });

      if (res.ok) {
        fetchAdminData();
        alert("Ambassador form rejected.");
      }
    } catch (err) {
      alert("Error rejecting lead");
    }
  };

  const resetForm = () => {
    setPgName("");
    setPgAddress("");
    setPgDescription("");
    setPgCollegeId(colleges[0]?.id || "");
    setPgOwnerId(owners[0]?.id || "");
    setPgDistance("0.5");
    setPgAmenities("WiFi, Meals, RO Water, Security");
    setPgImageUrl("");
    setPgImages("");
    setPgReservationFee("2000");
  };

  const openEditModal = (pgItem: any) => {
    setPgName(pgItem.name);
    setPgAddress(pgItem.address);
    setPgDescription(pgItem.description);
    setPgCollegeId(pgItem.collegeId);
    setPgOwnerId(pgItem.ownerId);
    setPgDistance(pgItem.distanceKm.toString());
    setPgAmenities(pgItem.amenities);
    setPgImageUrl(pgItem.imageUrl || "");
    setPgImages(pgItem.images || "");
    setPgReservationFee((pgItem.reservationFee ?? 2000).toString());
    setShowEditModal(pgItem);
  };

  const openApproveLeadModal = (leadItem: PgLead) => {
    setPgCollegeId(colleges[0]?.id || "");
    setPgOwnerId("CREATE_NEW");
    setPgDistance("0.5");
    setShowApproveLeadModal(leadItem);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-pearl min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-midnight/60" />
        <p className="text-xs text-midnight/60 font-semibold tracking-wide">Loading Operations Console...</p>
      </div>
    );
  }

  const totalBedsLive = pgs.reduce((sum, pg) => {
    return sum + pg.rooms.reduce((rSum: number, r: any) => rSum + r.availableBeds, 0);
  }, 0);
  const totalApproved = bookings.filter(b => b.status === "Approved").length;
  const totalQueriesPending = queries.filter(q => q.status === "Pending").length;
  const totalLeadsPending = leads.filter(l => l.status === "Pending").length;
  const totalPendingUpdates = pgs.filter(p => p.hasPendingUpdates).length;
  const totalEscrowHeld = totalApproved * 2000;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-pearl font-sans text-midnight">
      
      {/* Page Header */}
      <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <span className="text-[10px] text-midnight/55 uppercase font-bold tracking-widest block">
            Super Admin Console
          </span>
          <h1 className="text-3xl font-sans font-bold text-midnight mt-0.5">CampusNest Operations</h1>
          <p className="text-xs text-midnight/60 font-sans mt-0.5">
            Monitor registered properties, verify escrow transactions, moderate student Q&As, and review ambassador submissions.
          </p>
        </div>
        <div>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
              router.refresh();
            }}
            className="inline-flex items-center justify-center bg-red-50 hover:bg-red-100 border border-red-200 text-red-750 font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-xs cursor-pointer uppercase tracking-wider gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-beige/35 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`py-3.5 px-5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5 ${
            activeTab === "overview"
              ? "border-midnight text-midnight font-bold"
              : "border-transparent text-midnight/55 hover:text-midnight"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>PG Hostels ({pgs.length})</span>
        </button>
        
        <button
          onClick={() => setActiveTab("transactions")}
          className={`py-3.5 px-5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5 ${
            activeTab === "transactions"
              ? "border-midnight text-midnight font-bold"
              : "border-transparent text-midnight/55 hover:text-midnight"
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Verify Transactions ({bookings.length})</span>
        </button>
        
        <button
          onClick={() => setActiveTab("queries")}
          className={`py-3.5 px-5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5 ${
            activeTab === "queries"
              ? "border-midnight text-midnight font-bold"
              : "border-transparent text-midnight/55 hover:text-midnight"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Moderation Q&A ({totalQueriesPending})</span>
        </button>
        
        <button
          onClick={() => setActiveTab("leads")}
          className={`py-3.5 px-5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5 ${
            activeTab === "leads"
              ? "border-midnight text-midnight font-bold"
              : "border-transparent text-midnight/55 hover:text-midnight"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Ambassador Leads ({totalLeadsPending})</span>
        </button>

        <button
          onClick={() => setActiveTab("updates")}
          className={`py-3.5 px-5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5 ${
            activeTab === "updates"
              ? "border-midnight text-midnight font-bold"
              : "border-transparent text-midnight/55 hover:text-midnight"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Landlord Edits ({totalPendingUpdates})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          
          {/* Analytics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white border border-beige/40 rounded-2xl p-6 shadow-sm space-y-2">
              <span className="text-[9px] font-bold text-midnight/50 uppercase tracking-wider block">Total Hostels</span>
              <p className="text-3xl font-sans font-bold text-midnight">{pgs.length}</p>
              <span className="text-[9px] text-midnight/50 block font-sans">Live on map directory</span>
            </div>

            <div className="bg-white border border-beige/40 rounded-2xl p-6 shadow-sm space-y-2">
              <span className="text-[9px] font-bold text-midnight/50 uppercase tracking-wider block">Live Vacant Beds</span>
              <p className="text-3xl font-sans font-bold text-midnight">{totalBedsLive}</p>
              <span className="text-[9px] text-midnight/50 block font-sans">Beds ready to reserve</span>
            </div>

            <div className="bg-white border border-beige/40 rounded-2xl p-6 shadow-sm space-y-2">
              <span className="text-[9px] font-bold text-midnight/50 uppercase tracking-wider block">Total Escrow Vault</span>
              <p className="text-3xl font-sans font-bold text-midnight">₹{totalEscrowHeld}</p>
              <span className="text-[9px] text-midnight/50 block font-sans">₹2,000 per verified booking</span>
            </div>

            <div className="bg-white border border-beige/40 rounded-2xl p-6 shadow-sm space-y-2">
              <span className="text-[9px] font-bold text-midnight/50 uppercase tracking-wider block">Traffic Clicks</span>
              <p className="text-3xl font-sans font-bold text-midnight">{pgs.reduce((sum, p) => sum + (p.viewCount || 0), 0)}</p>
              <span className="text-[9px] text-midnight/50 block font-sans">Details page direct clicks</span>
            </div>

          </div>

          {/* Hostels Directory List */}
          <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-beige/25 pb-4 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-sans font-bold text-midnight">Registered PG Directory & Landlords</h2>
                <p className="text-xs text-midnight/55 mt-0.5">Publish new hostels, edit live listings, or delete records</p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="inline-flex items-center justify-center bg-midnight hover:bg-midnight-light text-pearl font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-xs cursor-pointer uppercase tracking-wider gap-1.5"
              >
                <Plus className="w-4 h-4 text-pearl" />
                <span>Register PG Hostel</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pgs.map((pgItem) => {
                const hostelBeds = pgItem.rooms.reduce((sum: number, r: any) => sum + r.availableBeds, 0);
                return (
                  <div key={pgItem.id} className="border border-beige/45 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-midnight/35 transition-colors bg-beige/5 font-sans">
                    
                    <div className="p-6 space-y-4 flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-midnight text-base leading-snug">{pgItem.name}</h3>
                          <p className="text-xs text-midnight/55 mt-1">{pgItem.address}</p>
                        </div>
                        <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-beige/65 bg-white text-midnight uppercase tracking-wider">
                          {pgItem.viewCount || 0} Views
                        </span>
                      </div>

                      {/* Landlord Contact */}
                      <div className="bg-white border border-beige/35 rounded-xl p-4 text-xs space-y-1">
                        <span className="font-bold text-midnight/50 uppercase tracking-widest block text-[9px] mb-1">Landlord Contact</span>
                        <p className="font-sans">Name: <strong className="text-midnight font-bold">{pgItem.owner.name}</strong></p>
                        <p className="font-sans">Phone: <strong className="text-midnight font-bold select-all font-mono">{pgItem.owner.phone}</strong></p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                        <div>
                          <span className="text-midnight/55 block text-[9px] font-bold uppercase tracking-wider">Nearby College</span>
                          <span className="font-bold text-midnight">{pgItem.college.name.split(" (")[0]}</span>
                        </div>
                        <div>
                          <span className="text-midnight/55 block text-[9px] font-bold uppercase tracking-wider">Proximity Distance</span>
                          <span className="font-bold text-midnight">{pgItem.distanceKm} KM from gate</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer options */}
                    <div className="bg-beige/10 border-t border-beige/35 p-4 flex justify-between items-center text-xs flex-wrap gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedPgDetail(pgItem)}
                          className="bg-white border border-beige/40 hover:bg-beige/10 text-midnight font-bold text-[9px] py-2 px-3 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                        >
                          Ledger
                        </button>
                        <button
                          onClick={() => openEditModal(pgItem)}
                          className="bg-white border border-beige/40 hover:bg-beige/10 text-midnight font-bold text-[9px] py-2 px-3 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePg(pgItem.id)}
                          className="bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold text-[9px] py-2 px-3 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                        >
                          Delete
                        </button>
                      </div>
                      <span className="text-[9px] font-bold text-midnight bg-white border border-beige/35 rounded-md px-2.5 py-1 uppercase tracking-wider">
                        {hostelBeds} Beds Vacant
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
          <div className="border-b border-beige/25 pb-3">
            <h2 className="text-xl font-sans font-bold text-midnight">Verify Escrow Payments</h2>
            <p className="text-xs text-midnight/55 mt-0.5">Transactions processed through gateway are auto-verified. Manually verify bank UTRs if needed.</p>
          </div>

          {bookings.length === 0 ? (
            <p className="text-midnight/50 text-xs italic py-8 text-center">No transactions registered on platform.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookings.map((booking) => {
                const isPending = booking.status === "Pending";
                const isApproved = booking.status === "Approved";
                const isPendingPayment = booking.status === "Pending_Payment";
                const isPaymentSubmitted = booking.status === "Payment_Submitted";

                return (
                  <div
                    key={booking.id}
                    className="border border-beige/45 rounded-2xl p-5 bg-beige/5 space-y-4 text-xs sm:text-sm hover:border-midnight/35 transition-colors font-sans"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <p className="font-bold text-midnight uppercase text-xs">CN-{booking.id.slice(0, 8)}</p>
                        <p className="text-[10px] text-midnight/55 font-semibold mt-1">Student: {booking.studentName} ({booking.studentPhone})</p>
                      </div>
                      
                      <span
                        className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                          isPendingPayment
                            ? "bg-white text-midnight border-beige/65 animate-pulse"
                            : isPaymentSubmitted
                            ? "bg-yellow-50 text-yellow-800 border-yellow-250 animate-pulse"
                            : isPending
                            ? "bg-white text-midnight border-beige/65"
                            : isApproved
                            ? "bg-emerald-50 text-emerald-800 border-emerald-250"
                            : "bg-red-50 text-red-800 border-red-200"
                        }`}
                      >
                        {booking.status === "Pending_Payment" 
                          ? "Awaiting Pay" 
                          : booking.status === "Payment_Submitted" 
                          ? "Awaiting Verification" 
                          : booking.status === "Pending"
                          ? "Awaiting Landlord"
                          : booking.status}
                      </span>
                    </div>

                    <div className="bg-white border border-beige/35 p-4 rounded-xl space-y-2 text-xs">
                      <p className="flex justify-between">
                        <span className="text-midnight/55">Target PG:</span>{" "}
                        <span className="font-bold text-midnight">{booking.room.pg.name}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-midnight/55">Room type:</span>{" "}
                        <span className="font-bold text-midnight">{booking.room.sharingType} Sharing</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-midnight/55">Check-in:</span>{" "}
                        <span className="font-bold text-midnight">
                          {new Date(booking.checkInDate).toLocaleDateString()}
                        </span>
                      </p>
                      
                      <div className="pt-2.5 border-t border-beige/25 mt-2 flex justify-between items-center">
                        <span className="text-[10px]">UTR Ref: <strong className="font-mono text-midnight select-all font-bold">{booking.utr || "Direct Gateway Card"}</strong></span>
                        <span className="font-black text-midnight text-sm">₹{booking.amountPaid}</span>
                      </div>
                    </div>

                    {isPaymentSubmitted && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBookingVerification(booking.id, "Pending")}
                          className="bg-midnight hover:bg-midnight-light text-pearl font-bold text-[10px] py-2 px-4 rounded-lg transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3 h-3 text-pearl" />
                          <span>Verify Payment (Notify Landlord)</span>
                        </button>
                        <button
                          onClick={() => handleBookingVerification(booking.id, "Rejected")}
                          className="bg-white border border-beige/45 hover:bg-beige/10 text-midnight font-bold text-[10px] py-2 px-4 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                        >
                          Reject Payment
                        </button>
                      </div>
                    )}

                    {isPending && (
                      <div className="flex gap-2 items-center justify-between w-full">
                        <span className="text-[10px] text-midnight/50 italic font-semibold">Awaiting Landlord Confirmation...</span>
                        <button
                          onClick={() => handleBookingVerification(booking.id, "Approved")}
                          className="bg-white border border-beige/40 text-midnight font-bold text-[9px] py-1.5 px-3 rounded-lg hover:bg-beige/10 transition-all cursor-pointer uppercase tracking-wider"
                        >
                          Force Approve
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "queries" && (
        <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 space-y-6 max-w-3xl mx-auto">
          <div className="border-b border-beige/25 pb-3">
            <h2 className="text-xl font-sans font-bold text-midnight">Moderate Student Queries</h2>
            <p className="text-xs text-midnight/55 mt-0.5">Moderate questions asked by students. Submit replies verified with landlords.</p>
          </div>

          {queries.length === 0 ? (
            <p className="text-midnight/55 text-xs italic py-8 text-center">No student queries received.</p>
          ) : (
            <div className="space-y-4 pr-1">
              {queries.map((q) => (
                <div
                  key={q.id}
                  className="border border-beige/40 rounded-2xl p-5 bg-beige/5 space-y-3 text-xs sm:text-sm hover:border-midnight/35 transition-colors font-sans"
                >
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <span className="text-[10px] font-bold text-midnight bg-white border border-beige/40 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      PG: {q.pg.name}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        q.status === "Answered"
                          ? "bg-white text-midnight border-beige/65"
                          : "bg-white text-midnight border-beige/65 animate-pulse"
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>

                  <div className="space-y-1 leading-relaxed">
                    <p className="text-midnight/50 text-[10px] font-bold uppercase tracking-wider">
                      Student: {q.studentName} ({q.studentPhone})
                    </p>
                    <p className="font-semibold text-midnight italic">" {q.question} "</p>
                  </div>

                  {q.status === "Answered" ? (
                    <div className="bg-white border border-beige/35 p-4 rounded-xl text-xs text-midnight/70 font-sans">
                      <span className="font-bold text-midnight">Answer: </span>
                      {q.answer}
                    </div>
                  ) : answeringId === q.id ? (
                    <form onSubmit={(e) => handleAnswerSubmit(e, q.id)} className="space-y-3 pt-2">
                      <textarea
                        required
                        placeholder="Write the official answer verified with the landlord..."
                        rows={2}
                        className="w-full bg-white border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold font-sans"
                        value={adminAnswer}
                        onChange={(e) => setAdminAnswer(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={submitLoading}
                          className="bg-midnight hover:bg-midnight-light text-pearl font-bold text-[10px] py-2 px-4 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                        >
                          Submit Answer
                        </button>
                        <button
                          type="button"
                          onClick={() => setAnsweringId("")}
                          className="bg-white border border-beige/45 hover:bg-beige/10 text-midnight font-bold text-[10px] py-2 px-4 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        setAnsweringId(q.id);
                        setAdminAnswer("");
                      }}
                      className="bg-midnight hover:bg-midnight-light text-pearl font-bold text-[10px] py-2.5 px-4 rounded-lg transition-all cursor-pointer uppercase tracking-wider inline-flex"
                    >
                      Reply on Behalf of Landlord
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "leads" && (
        <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
          <div className="border-b border-beige/25 pb-3">
            <h2 className="text-xl font-sans font-bold text-midnight">Ambassador Leads Approval</h2>
            <p className="text-xs text-midnight/55 mt-0.5">Verify new hostel boardings submitted by college ambassadors. Assign owner and publish to map directory.</p>
          </div>

          {leads.length === 0 ? (
            <p className="text-midnight/55 text-xs italic py-8 text-center">No ambassador submission leads received.</p>
          ) : (
            <div className="space-y-6 font-sans">
              {leads.map((lead) => {
                const isPending = lead.status === "Pending";
                const isApproved = lead.status === "Approved";
                const leadAmenities = lead.amenities ? lead.amenities.split(", ") : [];
                const leadImages = lead.images ? lead.images.split(",") : [];

                return (
                  <div key={lead.id} className="border border-beige/45 rounded-2xl p-5 bg-beige/5 space-y-4 text-xs sm:text-sm hover:border-midnight/35 transition-colors">
                    
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="space-y-0.5">
                        <h3 className="font-bold text-midnight text-base leading-snug">{lead.hostelName}</h3>
                        <p className="text-xs text-midnight/55">{lead.address}</p>
                        {lead.locationUrl && (
                          <a
                            href={lead.locationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-midnight underline inline-flex items-center gap-1 font-bold mt-1"
                          >
                            <span>📍 View coordinates on GPS map</span>
                          </a>
                        )}
                      </div>
                      
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        isPending
                          ? "bg-white text-midnight border-beige/65 animate-pulse"
                          : isApproved
                          ? "bg-white text-midnight border-beige/65"
                          : "bg-red-50 text-red-850 border-red-200"
                      }`}>
                        {lead.status}
                      </span>
                    </div>

                    <div className="bg-white border border-beige/35 p-4 rounded-xl text-xs space-y-3 leading-relaxed">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-midnight/55 block text-[9px] font-bold uppercase tracking-wider">Nearby College</span>
                          <span className="font-bold text-midnight">{lead.collegeName}</span>
                          <span className="text-midnight/55 block text-[9px] font-bold uppercase tracking-wider mt-2.5">Proximity</span>
                          <span className="font-bold text-midnight">{lead.distanceKm || "0.5"} KM</span>
                        </div>
                        <div>
                          <span className="text-midnight/55 block text-[9px] font-bold uppercase tracking-wider">Landlord Info</span>
                          <span className="font-bold text-midnight">{lead.ownerName}</span>
                          <span className="text-midnight/55 block text-[9px] font-bold uppercase tracking-wider mt-2.5">Owner Phone</span>
                          <span className="font-bold text-midnight font-mono">{lead.ownerPhone}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-midnight/55 block text-[9px] font-bold uppercase tracking-wider">Rent & Sharing Categories</span>
                          {lead.sharingTypes.trim().startsWith("[") ? (
                            <div className="mt-1 space-y-1 bg-beige/5 border border-beige/35 p-2 rounded-lg text-xs">
                              {(() => {
                                try {
                                  const customR = JSON.parse(lead.sharingTypes);
                                  return customR.map((r: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center py-0.5">
                                      <span className="font-bold text-midnight">{r.sharingType} Sharing</span>
                                      <span className="font-semibold text-midnight/70">₹{r.priceMonthly}/mo ({r.availableBeds} beds)</span>
                                    </div>
                                  ));
                                } catch {
                                  return <span className="font-bold text-midnight">{lead.priceRange} ({lead.sharingTypes} sharing)</span>;
                                }
                              })()}
                            </div>
                          ) : (
                            <span className="font-bold text-midnight">{lead.priceRange} ({lead.sharingTypes} sharing)</span>
                          )}
                          <span className="text-midnight/55 block text-[9px] font-bold uppercase tracking-wider mt-2.5">Ambassador Notes</span>
                          <p className="text-[11px] text-midnight/65 italic mt-0.5 leading-relaxed">"{lead.description}"</p>
                        </div>
                      </div>

                      {/* Amenities checklist tags */}
                      {leadAmenities.length > 0 && (
                        <div className="pt-3 border-t border-beige/20">
                          <span className="text-midnight/55 block text-[9px] font-bold uppercase tracking-wider mb-2">Amenities Verified</span>
                          <div className="flex flex-wrap gap-1.5">
                            {leadAmenities.map((amenity) => (
                              <span key={amenity} className="bg-beige/10 text-midnight border border-beige/35 rounded-md py-0.5 px-2 text-[9px] font-bold">
                                ✓ {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Photos List Preview */}
                      {leadImages.length > 0 && (
                        <div className="pt-3 border-t border-beige/20">
                          <span className="text-midnight/55 block text-[9px] font-bold uppercase tracking-wider mb-2">Submitted Gallery (Click to expand)</span>
                          <div className="flex gap-3 overflow-x-auto py-1">
                            {leadImages.map((imgUrl, index) => {
                              const labels = ["Cover Image", "Bathroom", "Bed Room", "Mess Dining", "Study Desk"];
                              return (
                                <div key={imgUrl} className="flex-shrink-0 text-center space-y-1">
                                  <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="block relative group border border-beige/30 rounded-lg overflow-hidden shadow-xs hover:border-midnight/40 bg-white">
                                    <img
                                      src={imgUrl}
                                      alt={labels[index] || `Photo ${index + 1}`}
                                      className="w-20 h-16 object-cover bg-beige/10 group-hover:scale-105 transition-transform"
                                    />
                                  </a>
                                  <span className="text-[9px] font-bold text-midnight/50 uppercase tracking-wide block">
                                    {labels[index] || `Image ${index + 1}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {isPending && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openApproveLeadModal(lead)}
                          className="bg-midnight hover:bg-midnight-light text-pearl font-bold text-[10px] py-2 px-4 rounded-lg transition-colors cursor-pointer uppercase tracking-wider shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-pearl" />
                          <span>Approve & Publish</span>
                        </button>
                        <button
                          onClick={() => handleRejectLead(lead.id)}
                          className="bg-white border border-beige/45 hover:bg-beige/10 text-midnight font-bold text-[10px] py-2 px-4 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "updates" && (
        <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 space-y-6 max-w-4xl mx-auto font-sans">
          <div className="border-b border-beige/25 pb-3">
            <h2 className="text-xl font-sans font-bold text-midnight">Landlord Profile & PG Edits Approval</h2>
            <p className="text-xs text-midnight/55 mt-0.5">Review PG listing changes submitted by landlords. Changes must be approved before they appear live on the directory.</p>
          </div>

          {pgs.filter(p => p.hasPendingUpdates).length === 0 ? (
            <p className="text-midnight/55 text-xs italic py-8 text-center">No pending landlord updates received.</p>
          ) : (
            <div className="space-y-8">
              {pgs.filter(p => p.hasPendingUpdates).map((pgItem) => {
                const currentAmenities = pgItem.amenities.split(", ");
                const pendingAmenities = (pgItem.pendingAmenities || "").split(", ").filter(Boolean);

                const currentImages = pgItem.images ? pgItem.images.split(",") : [];
                const pendingImages = pgItem.pendingImages ? pgItem.pendingImages.split(",") : [];

                return (
                  <div key={pgItem.id} className="border border-beige/45 rounded-2xl p-5 bg-beige/5 space-y-5">
                    <div className="flex justify-between items-start flex-wrap gap-2 border-b border-beige/25 pb-3">
                      <div>
                        <h3 className="font-bold text-midnight text-base leading-snug">{pgItem.name}</h3>
                        <p className="text-[10px] text-midnight/55 font-bold uppercase mt-1">Landlord: {pgItem.owner.name} ({pgItem.owner.phone})</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRejectUpdates(pgItem.id, "approve")}
                          disabled={submitLoading}
                          className="bg-midnight hover:bg-midnight-light text-pearl font-bold text-[10px] py-2 px-4 rounded-lg transition-colors cursor-pointer uppercase tracking-wider shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-pearl" />
                          <span>Approve Changes</span>
                        </button>
                        <button
                          onClick={() => handleApproveRejectUpdates(pgItem.id, "reject")}
                          disabled={submitLoading}
                          className="bg-white border border-beige/45 hover:bg-beige/10 text-midnight font-bold text-[10px] py-2 px-4 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                        >
                          Reject Changes
                        </button>
                      </div>
                    </div>

                    {/* Side by side comparison grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
                      {/* Left: Live listing */}
                      <div className="bg-white border border-beige/35 p-4 rounded-xl space-y-3">
                        <span className="text-[9px] font-bold text-midnight bg-beige/25 border border-beige/35 rounded px-2 py-0.5 uppercase tracking-wider">Live Listing Details</span>
                        <div className="space-y-2 pt-2 leading-relaxed">
                          <p><strong className="text-midnight font-bold">PG Name:</strong> {pgItem.name}</p>
                          <p><strong className="text-midnight font-bold">Address:</strong> {pgItem.address}</p>
                          <p><strong className="text-midnight font-bold">Proximity:</strong> {pgItem.distanceKm} KM</p>
                          <p><strong className="text-midnight font-bold">Reservation Fee:</strong> ₹{pgItem.reservationFee}</p>
                          <p><strong className="text-midnight font-bold">Description:</strong> {pgItem.description}</p>
                                        <div className="pt-2">
                            <strong className="text-midnight font-bold block mb-1">Amenities:</strong>
                            <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                              {currentAmenities.map((amenity: string) => (
                                <span key={amenity} className="bg-beige/10 border border-beige/35 rounded-md px-2 py-0.5">
                                  ✓ {amenity}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2">
                            <strong className="text-midnight font-bold block mb-1">Photos:</strong>
                            <div className="flex gap-2 overflow-x-auto py-1">
                              {currentImages.map((img: string, i: number) => (
                                <a key={img} href={img} target="_blank" rel="noreferrer" className="block shrink-0 border border-beige/30 rounded overflow-hidden">
                                  <img src={img} alt="Current" className="w-16 h-12 object-cover" />
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Pending Landlord Edits */}
                      <div className="bg-yellow-50/30 border border-yellow-250 p-4 rounded-xl space-y-3">
                        <span className="text-[9px] font-bold text-yellow-900 bg-yellow-50 border border-yellow-200 rounded px-2 py-0.5 uppercase tracking-wider">Proposed Landlord Edits</span>
                        <div className="space-y-2 pt-2 leading-relaxed text-yellow-955">
                          <p><strong className="font-bold">PG Name:</strong> <span className={pgItem.name !== pgItem.pendingName ? "text-amber-700 font-bold" : ""}>{pgItem.pendingName}</span></p>
                          <p><strong className="font-bold">Address:</strong> <span className={pgItem.address !== pgItem.pendingAddress ? "text-amber-700 font-bold" : ""}>{pgItem.pendingAddress}</span></p>
                          <p><strong className="font-bold">Proximity:</strong> <span className={pgItem.distanceKm !== pgItem.pendingDistanceKm ? "text-amber-700 font-bold" : ""}>{pgItem.pendingDistanceKm} KM</span></p>
                          <p><strong className="font-bold">Reservation Fee:</strong> <span className={pgItem.reservationFee !== pgItem.pendingReservationFee ? "text-amber-700 font-bold" : ""}>₹{pgItem.pendingReservationFee}</span></p>
                          <p><strong className="font-bold">Description:</strong> <span className={pgItem.description !== pgItem.pendingDescription ? "text-amber-700 font-bold" : ""}>{pgItem.pendingDescription}</span></p>
                          
                          <div className="pt-2">
                            <strong className="font-bold block mb-1">Amenities:</strong>
                            <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                              {pendingAmenities.map((amenity: string) => {
                                const isNew = !currentAmenities.includes(amenity);
                                return (
                                  <span key={amenity} className={`border rounded-md px-2 py-0.5 ${isNew ? "bg-amber-50 border-amber-300 text-amber-700 font-bold" : "bg-white border-beige/35"}`}>
                                    ✓ {amenity} {isNew && "(New)"}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <div className="pt-2">
                            <strong className="font-bold block mb-1">Photos:</strong>
                            <div className="flex gap-2 overflow-x-auto py-1">
                              {pendingImages.map((img: string, i: number) => (
                                <a key={img} href={img} target="_blank" rel="noreferrer" className="block shrink-0 border border-beige/30 rounded overflow-hidden">
                                  <img src={img} alt="Proposed" className="w-16 h-12 object-cover" />
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* OPERATIONS & ESCROW LEDGER MODAL */}
      {selectedPgDetail && (
        <div className="fixed inset-0 z-50 bg-midnight/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative border border-beige/40 my-8 text-midnight font-sans">
            <button
              onClick={() => setSelectedPgDetail(null)}
              className="absolute right-6 top-6 text-midnight/65 hover:text-midnight transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div>
              <span className="text-[10px] text-midnight/55 uppercase font-bold tracking-widest block">Financial Ledger</span>
              <h2 className="text-2xl font-sans font-bold text-midnight mt-1">{selectedPgDetail.name}</h2>
              <p className="text-xs text-midnight/60 mt-0.5">{selectedPgDetail.address}</p>
            </div>

            {/* Room Inventory */}
            <div className="space-y-2.5 pt-4">
              <h4 className="font-bold text-midnight/55 uppercase text-[9px] tracking-widest block">Room Inventory & Capacity</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {selectedPgDetail.rooms.map((room: any) => (
                  <div key={room.id} className="border border-beige/35 rounded-xl p-4 bg-beige/5 text-xs">
                    <p className="font-bold text-midnight">{room.sharingType} Sharing ({room.genderPreference})</p>
                    <p className="text-midnight font-extrabold mt-1">₹{room.priceMonthly} / month</p>
                    <p className="text-midnight/60 mt-1">Vacant Beds: <span className="font-bold text-midnight">{room.availableBeds}</span></p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ledger summary */}
            {(() => {
              const pgBookings = bookings.filter((b) => b.room.pg.id === selectedPgDetail.id);
              const approved = pgBookings.filter((b) => b.status === "Approved");
              const pendingVerification = pgBookings.filter((b) => b.status === "Pending");

              const today = new Date();
              const joined = approved.filter((b) => new Date(b.checkInDate) < today);
              const reserved = approved.filter((b) => new Date(b.checkInDate) >= today);

              const totalPaidByStudents = approved.length * (selectedPgDetail.reservationFee ?? 2200);
              const platformFees = approved.length * 200;
              const escrowReleased = joined.length * (selectedPgDetail.reservationFee ?? 2000);
              const escrowHeld = reserved.length * (selectedPgDetail.reservationFee ?? 2000);
              const pendingVerificationCash = pendingVerification.length * (selectedPgDetail.reservationFee ?? 2200);

              return (
                <div className="space-y-6 pt-4">
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 border-t border-beige/25 pt-4">
                    <div className="bg-beige/10 border border-beige/35 rounded-xl p-4">
                      <span className="text-[9px] text-midnight/50 font-bold block uppercase tracking-wider">Total Value</span>
                      <span className="text-lg font-black text-midnight block mt-1">₹{totalPaidByStudents}</span>
                    </div>
                    <div className="bg-beige/10 border border-beige/35 rounded-xl p-4">
                      <span className="text-[9px] text-midnight/50 font-bold block uppercase tracking-wider">Escrow Released</span>
                      <span className="text-lg font-black text-midnight block mt-1">₹{escrowReleased}</span>
                    </div>
                    <div className="bg-beige/10 border border-beige/35 rounded-xl p-4">
                      <span className="text-[9px] text-midnight/50 font-bold block uppercase tracking-wider">Escrow Held</span>
                      <span className="text-lg font-black text-midnight block mt-1">₹{escrowHeld}</span>
                    </div>
                    <div className="bg-beige/10 border border-beige/35 rounded-xl p-4">
                      <span className="text-[9px] text-midnight/50 font-bold block uppercase tracking-wider font-black">Net Profit</span>
                      <span className="text-lg font-black text-midnight block mt-1">₹{platformFees}</span>
                    </div>
                    <div className="bg-beige/10 border border-beige/35 rounded-xl p-4">
                      <span className="text-[9px] text-midnight/50 font-bold block uppercase tracking-wider">Awaiting UTR</span>
                      <span className="text-lg font-black text-midnight block mt-1">₹{pendingVerificationCash}</span>
                    </div>
                  </div>

                  {/* Student Reservations Directory */}
                  <div className="border-t border-beige/25 pt-4 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="font-bold text-midnight/50 uppercase text-[9px] tracking-widest">Student Reservations Directory</h4>
                        <p className="text-[10px] text-midnight/55">Verify check-ins and ledger updates</p>
                      </div>

                      {/* Controls */}
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Search name or phone..."
                          className="bg-beige/10 border border-beige/40 rounded-xl p-2 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight w-full sm:w-48 font-semibold"
                          value={guestSearchQuery}
                          onChange={(e) => setGuestSearchQuery(e.target.value)}
                        />
                        <select
                          className="bg-beige/10 border border-beige/40 rounded-xl p-2 text-xs text-midnight focus:outline-none cursor-pointer font-semibold"
                          value={guestStatusFilter}
                          onChange={(e) => setGuestStatusFilter(e.target.value)}
                        >
                          <option value="ALL">All States</option>
                          <option value="Joined">Checked-In</option>
                          <option value="Reserved">Escrow Held</option>
                          <option value="Pending">Awaiting Verify</option>
                          <option value="Pending_Payment">Awaiting Pay</option>
                        </select>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border border-beige/35 rounded-2xl overflow-hidden bg-white max-h-96 overflow-y-auto">
                      <div className="overflow-x-auto">
                        {(() => {
                          const filtered = pgBookings.filter((b) => {
                            const matchesQuery =
                              b.studentName.toLowerCase().includes(guestSearchQuery.toLowerCase()) ||
                              b.studentPhone.includes(guestSearchQuery) ||
                              (b.utr && b.utr.toLowerCase().includes(guestSearchQuery.toLowerCase()));

                            if (!matchesQuery) return false;

                            if (guestStatusFilter === "ALL") return true;
                            if (guestStatusFilter === "Joined") return b.status === "Approved" && new Date(b.checkInDate) < today;
                            if (guestStatusFilter === "Reserved") return b.status === "Approved" && new Date(b.checkInDate) >= today;
                            if (guestStatusFilter === "Pending") return b.status === "Pending";
                            if (guestStatusFilter === "Pending_Payment") return b.status === "Pending_Payment";
                            return true;
                          });

                          if (filtered.length === 0) {
                            return (
                              <p className="text-midnight/55 text-xs italic text-center py-8">
                                No matching guest records found.
                              </p>
                            );
                          }

                          return (
                            <table className="w-full text-left text-xs border-collapse min-w-[650px] font-sans">
                              <thead>
                                <tr className="bg-beige/10 border-b border-beige/35 text-[9px] uppercase text-midnight/55 font-bold sticky top-0 z-10">
                                  <th className="p-3">Student Guest</th>
                                  <th className="p-3">Sharing</th>
                                  <th className="p-3">Check-in Date</th>
                                  <th className="p-3">Payment Info</th>
                                  <th className="p-3">Status</th>
                                  <th className="p-3 text-right">Operations Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-beige/20">
                                {filtered.map((b) => {
                                  const isJoined = b.status === "Approved" && new Date(b.checkInDate) < today;
                                  const isReserved = b.status === "Approved" && new Date(b.checkInDate) >= today;
                                  const isPendingVer = b.status === "Pending";
                                  const isAwaitingPay = b.status === "Pending_Payment";

                                  return (
                                    <tr key={b.id} className="hover:bg-beige/5 transition-colors">
                                      <td className="p-3">
                                        <p className="font-bold text-midnight">{b.studentName}</p>
                                        <p className="text-[10px] text-midnight/55 font-mono select-all">{b.studentPhone}</p>
                                      </td>
                                      <td className="p-3 text-midnight/70">
                                        <span className="font-semibold">{b.room.sharingType} Sharing</span>
                                      </td>
                                      <td className="p-3 text-midnight/70">
                                        {new Date(b.checkInDate).toLocaleDateString()}
                                      </td>
                                      <td className="p-3 text-midnight/70">
                                        <p className="font-bold text-midnight">₹{b.amountPaid}</p>
                                        <p className="text-[9px] text-midnight/55 font-mono select-all">UTR: {b.utr || "N/A"}</p>
                                      </td>
                                      <td className="p-3">
                                        <span
                                          className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                                            isJoined
                                              ? "bg-white text-midnight border-beige/65"
                                              : isReserved
                                              ? "bg-white text-midnight border-beige/65"
                                              : isPendingVer
                                              ? "bg-white text-midnight border-beige/65 animate-pulse"
                                              : isAwaitingPay
                                              ? "bg-white text-midnight border-beige/65"
                                              : "bg-red-50 text-red-800 border-red-200"
                                          }`}
                                        >
                                          {isJoined ? "Checked-In" : isReserved ? "Escrowed" : isPendingVer ? "Pending UTR" : isAwaitingPay ? "Awaiting Pay" : b.status}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right">
                                        {isPendingVer ? (
                                          <div className="flex gap-1 justify-end">
                                            <button
                                              onClick={() => handleBookingVerification(b.id, "Approved")}
                                              className="bg-midnight hover:bg-midnight-light text-pearl font-bold text-[9px] py-1.5 px-3 rounded shadow-xs cursor-pointer transition-colors uppercase tracking-wider"
                                            >
                                              Approve
                                            </button>
                                            <button
                                              onClick={() => handleBookingVerification(b.id, "Rejected")}
                                              className="bg-white border border-beige/45 hover:bg-beige/10 text-midnight font-bold text-[9px] py-1.5 px-3 rounded cursor-pointer transition-colors uppercase tracking-wider"
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="text-[10px] text-midnight/40 italic">No action needed</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-4 border-t border-beige/25">
                    <button
                      onClick={() => setSelectedPgDetail(null)}
                      className="bg-midnight hover:bg-midnight-light text-pearl font-bold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Close Ledger View
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* CRUD MODALS: ADD NEW HOSTEL PG */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-midnight/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative space-y-5 border border-beige/40 my-8 text-midnight font-sans">
            <button onClick={() => setShowAddModal(false)} className="absolute right-6 top-6 text-midnight/65 hover:text-midnight transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-sans font-bold text-midnight border-b border-beige/25 pb-3">Register New PG Hostel</h2>

            <form onSubmit={handleCreatePg} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase">Hostel/PG Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Balaji Premium Boys Hostel"
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                    value={pgName}
                    onChange={(e) => setPgName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase">Gate Distance (KM)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                    value={pgDistance}
                    onChange={(e) => setPgDistance(e.target.value)}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase">Booking Advance (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="2000"
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold font-mono"
                    value={pgReservationFee}
                    onChange={(e) => setPgReservationFee(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/70 uppercase">Hostel Address / Landmark</label>
                <input
                  type="text"
                  required
                  placeholder="Near Gate 2, RGMCET Campus outskirts"
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={pgAddress}
                  onChange={(e) => setPgAddress(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/70 uppercase">Amenities (Comma separated)</label>
                <input
                  type="text"
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={pgAmenities}
                  onChange={(e) => setPgAmenities(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase">Link Target College</label>
                  <select
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none cursor-pointer font-semibold"
                    value={pgCollegeId}
                    onChange={(e) => setPgCollegeId(e.target.value)}
                  >
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase">Link Landlord / Owner</label>
                  <select
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none cursor-pointer font-semibold"
                    value={pgOwnerId}
                    onChange={(e) => setPgOwnerId(e.target.value)}
                  >
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>{o.name} ({o.phone})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/70 uppercase">Cover Image URL</label>
                <input
                  type="text"
                  placeholder="https://unsplash.com/..."
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={pgImageUrl}
                  onChange={(e) => setPgImageUrl(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-midnight hover:bg-midnight-light text-pearl font-bold py-4 rounded-xl text-xs mt-4 transition-colors cursor-pointer text-center uppercase tracking-wider"
              >
                {submitLoading ? "Publishing..." : "Confirm & Publish PG"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CRUD MODALS: EDIT PG DETAILS */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-midnight/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative space-y-5 border border-beige/40 my-8 text-midnight font-sans">
            <button onClick={() => setShowEditModal(null)} className="absolute right-6 top-6 text-midnight/65 hover:text-midnight transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-sans font-bold text-midnight border-b border-beige/25 pb-3">Edit PG Hostel Details</h2>

            <form onSubmit={handleUpdatePg} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase">PG Hostel Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                    value={pgName}
                    onChange={(e) => setPgName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase">Gate Distance (KM)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                    value={pgDistance}
                    onChange={(e) => setPgDistance(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase">Booking Advance (₹)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold font-mono"
                    value={pgReservationFee}
                    onChange={(e) => setPgReservationFee(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/70 uppercase">Hostel Address</label>
                <input
                  type="text"
                  required
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={pgAddress}
                  onChange={(e) => setPgAddress(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/70 uppercase">PG Description</label>
                <textarea
                  rows={2}
                  required
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={pgDescription}
                  onChange={(e) => setPgDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/70 uppercase">Amenities (Comma separated)</label>
                <input
                  type="text"
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={pgAmenities}
                  onChange={(e) => setPgAmenities(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase">College Link</label>
                  <select
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none cursor-pointer font-semibold"
                    value={pgCollegeId}
                    onChange={(e) => setPgCollegeId(e.target.value)}
                  >
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase">Landlord Link</label>
                  <select
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none cursor-pointer font-semibold"
                    value={pgOwnerId}
                    onChange={(e) => setPgOwnerId(e.target.value)}
                  >
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>{o.name} ({o.phone})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase">Cover Image URL</label>
                  <input
                    type="text"
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                    value={pgImageUrl}
                    onChange={(e) => setPgImageUrl(e.target.value)}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase">Gallery Images</label>
                  <input
                    type="text"
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                    value={pgImages}
                    onChange={(e) => setPgImages(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-midnight hover:bg-midnight-light text-pearl font-bold py-4 rounded-xl text-xs mt-4 transition-colors cursor-pointer text-center uppercase tracking-wider"
              >
                {submitLoading ? "Saving changes..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CRUD MODALS: APPROVE AMBASSADOR SUBMISSION */}
      {showApproveLeadModal && (
        <div className="fixed inset-0 z-50 bg-midnight/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative space-y-5 border border-beige/40 my-8 text-midnight font-sans">
            <button onClick={() => setShowApproveLeadModal(null)} className="absolute right-6 top-6 text-midnight/65 hover:text-midnight transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-sans font-bold text-midnight border-b border-beige/25 pb-3">Approve & Register PG Listing</h2>
            
            <p className="text-xs text-midnight/60 leading-relaxed font-sans">
              Approve ambassador submission form for <strong className="font-bold text-midnight">{showApproveLeadModal.hostelName}</strong>. Select the target college and landlord to import it live:
            </p>

            <form onSubmit={handleApproveLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase">Select Target College</label>
                  <select
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none cursor-pointer font-semibold"
                    value={pgCollegeId}
                    onChange={(e) => setPgCollegeId(e.target.value)}
                  >
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase">Assign Landlord Account</label>
                  <select
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none cursor-pointer font-semibold"
                    value={pgOwnerId}
                    onChange={(e) => setPgOwnerId(e.target.value)}
                  >
                    <option value="CREATE_NEW">🆕 Register New ({showApproveLeadModal.ownerName})</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>{o.name} ({o.phone})</option>
                    ))}
                  </select>
                  <span className="text-[9px] text-midnight/55 mt-1 block">
                    If registering new landlord, default password will be <strong className="font-mono text-midnight font-bold">password123</strong>
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/70 uppercase">Gate Proximity Distance (KM)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={pgDistance}
                  onChange={(e) => setPgDistance(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-midnight hover:bg-midnight-light text-pearl font-bold py-4 rounded-xl text-xs mt-4 transition-colors cursor-pointer text-center uppercase tracking-wider"
              >
                {submitLoading ? "Publishing Listing..." : "Confirm & Import PG Live"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
