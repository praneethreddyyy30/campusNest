"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  // Approve Lead / Ambassador form submission and automatically register
  const handleApproveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showApproveLeadModal) return;
    setSubmitLoading(true);

    try {
      // Step 1: Create the PG using CRUD API
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
        }),
      });

      if (res.ok) {
        // Step 2: Update PgFormSubmission status to Approved
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
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 text-sm font-medium">Loading Operations Console...</p>
      </div>
    );
  }

  const totalBedsLive = pgs.reduce((sum, pg) => {
    return sum + pg.rooms.reduce((rSum: number, r: any) => rSum + r.availableBeds, 0);
  }, 0);
  const totalApproved = bookings.filter(b => b.status === "Approved").length;
  const totalQueriesPending = queries.filter(q => q.status === "Pending").length;
  const totalLeadsPending = leads.filter(l => l.status === "Pending").length;
  const totalEscrowHeld = totalApproved * 2000;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-gray-900">
      {/* Page Header */}
      <div className="bg-white border rounded-xl p-6 shadow-sm flex justify-between items-center flex-wrap gap-4">
        <div>
          <span className="text-xs text-indigo-600 font-extrabold uppercase tracking-wider">
            Super Admin Console
          </span>
          <h1 className="text-2xl font-black text-gray-900">CampusNest Operations Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor registered properties, manage escrow advances, process ambassador forms, and moderate student Q&As.
          </p>
        </div>
        <div>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
              router.refresh();
            }}
            className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-extrabold text-xs py-2 px-4 rounded border border-red-200 cursor-pointer transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`py-3 px-5 text-sm font-extrabold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📁 PG Hostels Directory ({pgs.length})
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`py-3 px-5 text-sm font-extrabold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "transactions"
              ? "border-indigo-600 text-indigo-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          💸 Verify Transactions ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab("queries")}
          className={`py-3 px-5 text-sm font-extrabold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "queries"
              ? "border-indigo-600 text-indigo-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          💬 Moderation Q&A ({totalQueriesPending} Pending)
        </button>
        <button
          onClick={() => setActiveTab("leads")}
          className={`py-3 px-5 text-sm font-extrabold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "leads"
              ? "border-indigo-600 text-indigo-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📋 Ambassador Submissions ({totalLeadsPending} Pending)
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Analytics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Hostels</span>
              <p className="text-2xl font-black text-indigo-600">{pgs.length}</p>
              <span className="text-[10px] text-gray-400 block font-medium">Live on CampusNest</span>
            </div>
            <div className="bg-white border rounded-xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Live Vacancies</span>
              <p className="text-2xl font-black text-green-600">{totalBedsLive}</p>
              <span className="text-[10px] text-gray-400 block font-medium">Beds ready to reserve</span>
            </div>
            <div className="bg-white border rounded-xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Escrow Volume</span>
              <p className="text-2xl font-black text-indigo-600">₹{totalEscrowHeld}</p>
              <span className="text-[10px] text-gray-400 block font-medium">₹2,000 per approved student</span>
            </div>
            <div className="bg-white border rounded-xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Traffic views</span>
              <p className="text-2xl font-black text-gray-900">{pgs.reduce((sum, p) => sum + (p.viewCount || 0), 0)}</p>
              <span className="text-[10px] text-gray-400 block font-medium">Hostel details page clicks</span>
            </div>
          </div>

          {/* Hostels Directory List */}
          <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
              <h2 className="text-lg font-extrabold text-gray-900">Registered PG Directory & Landlords</h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 px-4 rounded shadow cursor-pointer transition-colors"
              >
                + Register New Hostel PG
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pgs.map((pgItem) => {
                const hostelBeds = pgItem.rooms.reduce((sum: number, r: any) => sum + r.availableBeds, 0);
                return (
                  <div key={pgItem.id} className="border rounded-lg overflow-hidden flex flex-col justify-between hover:border-indigo-400 transition-colors bg-gray-50/30">
                    <div className="p-5 space-y-3 flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-extrabold text-gray-900 text-base">{pgItem.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{pgItem.address}</p>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-green-50 text-green-800 border-green-200">
                          {pgItem.viewCount || 0} Views
                        </span>
                      </div>

                      {/* Landlord Contact */}
                      <div className="bg-white border rounded p-3 text-xs space-y-1 text-gray-600">
                        <span className="font-extrabold text-gray-400 uppercase tracking-wider block text-[9px]">Landlord Contact</span>
                        <p>Name: <strong className="text-gray-700 font-bold">{pgItem.owner.name}</strong></p>
                        <p>Phone: <strong className="text-indigo-600 font-bold select-all">{pgItem.owner.phone}</strong></p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500">
                        <div>
                          <span className="text-gray-400 block">Nearby College:</span>
                          <span className="font-bold text-gray-700">{pgItem.college.name.split(" (")[0]}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Proximity:</span>
                          <span className="font-bold text-gray-700">{pgItem.distanceKm} KM from gate</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer options */}
                    <div className="bg-gray-100 border-t p-3 flex justify-between items-center text-xs flex-wrap gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedPgDetail(pgItem)}
                          className="bg-white border border-gray-300 hover:border-indigo-300 text-indigo-600 hover:bg-indigo-50 font-bold text-[10px] py-1 px-2.5 rounded transition-colors cursor-pointer"
                        >
                          Operations & Escrow
                        </button>
                        <button
                          onClick={() => openEditModal(pgItem)}
                          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-[10px] py-1 px-2.5 rounded transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePg(pgItem.id)}
                          className="bg-white border border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 font-bold text-[10px] py-1 px-2.5 rounded transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                      <span className="bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded text-[10px]">
                        {hostelBeds} Vacant Beds
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
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4 max-w-4xl mx-auto">
          <h2 className="text-lg font-extrabold text-gray-900 border-b pb-2">Verify Payments (UPI Escrow)</h2>
          <p className="text-xs text-gray-500 leading-normal">
            Transactions made via checkout gateway show as Approved automatically. Monitor manually submitted Ref IDs/UTR numbers and verify details.
          </p>

          {bookings.length === 0 ? (
            <p className="text-gray-500 text-sm italic py-4">No reservations created on platform.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map((booking) => {
                const isPending = booking.status === "Pending";
                const isApproved = booking.status === "Approved";
                const isPendingPayment = booking.status === "Pending_Payment";

                return (
                  <div
                    key={booking.id}
                    className="border rounded-lg p-4 bg-gray-50/50 space-y-3 text-sm hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <p className="font-extrabold text-gray-800 uppercase">CN-{booking.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">Student: {booking.studentName} ({booking.studentPhone})</p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          isPendingPayment
                            ? "bg-purple-50 text-purple-800 border-purple-200 animate-pulse"
                            : isPending
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : isApproved
                            ? "bg-green-50 text-green-800 border-green-200"
                            : booking.status === "No-Show"
                            ? "bg-slate-50 text-slate-600 border-slate-200"
                            : "bg-red-50 text-red-800 border-red-200"
                        }`}
                      >
                        {booking.status === "Pending_Payment" ? "Awaiting Payment" : booking.status}
                      </span>
                    </div>

                    <div className="bg-white border p-3 rounded space-y-1 text-xs text-gray-600">
                      <p>
                        <span className="text-gray-400">Target PG:</span>{" "}
                        <span className="font-bold text-gray-700">{booking.room.pg.name}</span>
                      </p>
                      <p>
                        <span className="text-gray-400">Room type:</span>{" "}
                        <span className="font-bold text-gray-700">{booking.room.sharingType} Sharing</span>
                      </p>
                      <p>
                        <span className="text-gray-400">Check-in:</span>{" "}
                        <span className="font-bold text-gray-700">
                          {new Date(booking.checkInDate).toLocaleDateString()}
                        </span>
                      </p>
                      <p className="pt-1 border-t mt-1 flex justify-between">
                        <span>UTR Ref: <strong className="font-mono text-indigo-600 font-extrabold select-all">{booking.utr}</strong></span>
                        <span className="font-black text-green-700">₹{booking.amountPaid}</span>
                      </p>
                    </div>

                    {/* Verification utilities */}
                    {isPending && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBookingVerification(booking.id, "Approved")}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs py-1.5 px-3 rounded shadow-sm transition-colors cursor-pointer"
                        >
                          Approve Payment & Alert Landlord
                        </button>
                        <button
                          onClick={() => handleBookingVerification(booking.id, "Rejected")}
                          className="bg-white border border-gray-300 text-gray-700 hover:bg-red-50 font-semibold text-xs py-1.5 px-3 rounded transition-colors cursor-pointer"
                        >
                          Reject / Refund
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
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4 max-w-3xl mx-auto">
          <h2 className="text-lg font-extrabold text-gray-900 border-b pb-2">Moderate Student Queries</h2>
          <p className="text-xs text-gray-500 leading-normal">
            Read questions posted by students. Contact the respective PG owner, verify the details, and submit answers on their behalf.
          </p>

          {queries.length === 0 ? (
            <p className="text-gray-500 text-sm italic py-4">No student queries received.</p>
          ) : (
            <div className="space-y-4 pr-1">
              {queries.map((q) => (
                <div
                  key={q.id}
                  className="border rounded-lg p-4 bg-gray-50/50 space-y-2 text-sm hover:border-indigo-200 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold">
                        Target PG: {q.pg.name}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        q.status === "Answered"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-gray-400 text-xs font-medium">
                      Student: <strong className="text-gray-700 font-bold">{q.studentName}</strong> ({q.studentPhone})
                    </p>
                    <p className="font-semibold text-gray-800 italic">" {q.question} "</p>
                  </div>

                  {q.status === "Answered" ? (
                    <div className="bg-white border p-3 rounded text-xs text-gray-600">
                      <span className="font-bold text-green-700">Answered: </span>
                      {q.answer}
                    </div>
                  ) : answeringId === q.id ? (
                    <form onSubmit={(e) => handleAnswerSubmit(e, q.id)} className="space-y-2 pt-2">
                      <textarea
                        required
                        placeholder="Write the official answer verified with the landlord..."
                        rows={2}
                        className="w-full bg-white border rounded p-2 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={adminAnswer}
                        onChange={(e) => setAdminAnswer(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={submitLoading}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-1.5 px-3 rounded shadow-sm cursor-pointer"
                        >
                          Submit Answer
                        </button>
                        <button
                          type="button"
                          onClick={() => setAnsweringId("")}
                          className="bg-gray-150 hover:bg-gray-200 text-gray-700 font-semibold text-xs py-1.5 px-3 rounded cursor-pointer"
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
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-1.5 px-3 rounded shadow-sm transition-colors mt-2 cursor-pointer"
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
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4 max-w-4xl mx-auto">
          <h2 className="text-lg font-extrabold text-gray-900 border-b pb-2">Ambassador Hostel Submission Forms</h2>
          <p className="text-xs text-gray-500 leading-normal">
            Verify new hostels and boarding options submitted by your college ambassadors. Link them to a landlord user and publish them instantly!
          </p>

          {leads.length === 0 ? (
            <p className="text-gray-500 text-sm italic py-4">No ambassador submissions received yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {leads.map((lead) => {
                const isPending = lead.status === "Pending";
                const isApproved = lead.status === "Approved";
                const leadAmenities = lead.amenities ? lead.amenities.split(", ") : [];
                const leadImages = lead.images ? lead.images.split(",") : [];

                return (
                  <div key={lead.id} className="border rounded-lg p-5 bg-gray-50/50 space-y-4 text-sm hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <h3 className="font-extrabold text-gray-800 text-base">{lead.hostelName}</h3>
                        <p className="text-xs text-gray-400">{lead.address}</p>
                        {lead.locationUrl && (
                          <a
                            href={lead.locationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:underline inline-block mt-1 font-bold"
                          >
                            📍 View Coordinates / GPS Map Location
                          </a>
                        )}
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        isPending
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : isApproved
                          ? "bg-green-50 text-green-800 border-green-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}>
                        {lead.status}
                      </span>
                    </div>

                    {/* Detailed info */}
                    <div className="bg-white border p-3 rounded text-xs text-gray-600 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <span className="text-gray-400 block font-semibold">Proximity College:</span>
                          <span className="font-bold text-gray-700">{lead.collegeName}</span>
                          <span className="text-gray-400 block mt-1 font-semibold">Distance to Gate:</span>
                          <span className="font-bold text-gray-700">{lead.distanceKm || "0.5"} KM</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-semibold">Landlord Details:</span>
                          <span className="font-bold text-gray-700">{lead.ownerName}</span>
                          <span className="text-[10px] text-gray-400 block mt-1 font-semibold">Phone:</span>
                          <span className="font-bold text-indigo-600 select-all font-mono">{lead.ownerPhone}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-400 block font-semibold">Rent & Sharing Specs:</span>
                          <span className="font-bold text-gray-700">{lead.priceRange} ({lead.sharingTypes} sharing)</span>
                          <span className="text-gray-400 block mt-1 font-semibold">Ambassador Notes:</span>
                          <p className="text-[11px] text-gray-500 italic mt-0.5 leading-relaxed">"{lead.description}"</p>
                        </div>
                      </div>

                      {/* Amenities checklist tags */}
                      {leadAmenities.length > 0 && (
                        <div className="pt-2 border-t mt-2">
                          <span className="text-gray-400 block font-semibold text-[10px] mb-1 uppercase tracking-wider">Amenities Verified by Ambassador:</span>
                          <div className="flex flex-wrap gap-1">
                            {leadAmenities.map((amenity) => (
                              <span key={amenity} className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded py-0.5 px-2 text-[10px] font-bold">
                                ✓ {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Photos List Preview */}
                      {leadImages.length > 0 && (
                        <div className="pt-2 border-t mt-2">
                          <span className="text-gray-400 block font-semibold text-[10px] mb-1 uppercase tracking-wider">Submitted Photos (Click to enlarge):</span>
                          <div className="flex gap-2 overflow-x-auto py-1">
                            {leadImages.map((imgUrl, index) => {
                              const labels = ["Cover Image", "Bathroom", "Bed Room", "Mess Dining", "Study Desk"];
                              return (
                                <div key={imgUrl} className="flex-shrink-0 text-center space-y-1">
                                  <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="block relative group border rounded overflow-hidden shadow-sm hover:border-indigo-400">
                                    <img
                                      src={imgUrl}
                                      alt={labels[index] || `Photo ${index + 1}`}
                                      className="w-20 h-16 object-cover bg-gray-100 group-hover:scale-105 transition-transform"
                                    />
                                  </a>
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block">
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
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => openApproveLeadModal(lead)}
                          className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs py-1.5 px-4 rounded shadow-sm transition-colors cursor-pointer"
                        >
                          Approve & Publish Live
                        </button>
                        <button
                          onClick={() => handleRejectLead(lead.id)}
                          className="bg-white border border-gray-300 hover:bg-red-50 hover:border-red-300 text-gray-700 hover:text-red-700 font-semibold text-xs py-1.5 px-4 rounded transition-colors cursor-pointer"
                        >
                          Reject Submission
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

      {/* OPERATIONS & ESCROW ANALYTICS OVERLAY */}
      {selectedPgDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-6 relative border border-gray-150 my-8">
            <button
              onClick={() => setSelectedPgDetail(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
            >
              ✕
            </button>

            <div>
              <span className="text-xs text-indigo-600 font-extrabold uppercase tracking-wider block">Hostel Financial Ledger</span>
              <h2 className="text-xl font-black text-gray-900">{selectedPgDetail.name}</h2>
              <p className="text-xs text-gray-500">{selectedPgDetail.address}</p>
              {selectedPgDetail.locationUrl && (
                <a
                  href={selectedPgDetail.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:underline inline-block mt-1 font-semibold"
                >
                  📍 View Location on Google Maps
                </a>
              )}
            </div>

            {/* Room Inventory */}
            <div>
              <h4 className="font-extrabold text-xs text-gray-500 uppercase tracking-wide mb-2">Room Inventory & Capacity</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {selectedPgDetail.rooms.map((room: any) => (
                  <div key={room.id} className="border rounded-lg p-3 bg-gray-50 text-xs">
                    <p className="font-bold text-gray-800">{room.sharingType} Sharing ({room.genderPreference})</p>
                    <p className="text-indigo-600 font-extrabold mt-1">₹{room.priceMonthly} / month</p>
                    <p className="text-gray-500 mt-0.5">Vacant Beds: <span className="font-bold text-gray-700">{room.availableBeds}</span></p>
                  </div>
                ))}
              </div>
            </div>

            {/* Compute Escrow Metrics for PG */}
            {(() => {
              const pgBookings = bookings.filter((b) => b.room.pg.id === selectedPgDetail.id);
              const approved = pgBookings.filter((b) => b.status === "Approved");
              const pendingPayment = pgBookings.filter((b) => b.status === "Pending_Payment");
              const pendingVerification = pgBookings.filter((b) => b.status === "Pending");

              // Determine joined (check-in date passed today) vs escrowed (check-in date is in future)
              const today = new Date();
              const joined = approved.filter((b) => new Date(b.checkInDate) < today);
              const reserved = approved.filter((b) => new Date(b.checkInDate) >= today);

              const totalPaidByStudents = approved.length * 2200;
              const platformFees = approved.length * 200;
              const escrowReleased = joined.length * 2000;
              const escrowHeld = reserved.length * 2000;
              const pendingVerificationCash = pendingVerification.length * 2200;

              return (
                <div className="space-y-6">
                  {/* Ledger summary */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 border-t pt-4">
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3">
                      <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Total Booking Value</span>
                      <span className="text-base font-black text-indigo-700">₹{totalPaidByStudents}</span>
                    </div>
                    <div className="bg-green-50/50 border border-green-100 rounded-lg p-3">
                      <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Escrow Released</span>
                      <span className="text-base font-black text-green-700">₹{escrowReleased}</span>
                    </div>
                    <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3">
                      <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Escrow Held (Due)</span>
                      <span className="text-base font-black text-amber-700">₹{escrowHeld}</span>
                    </div>
                    <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-3">
                      <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider font-black">Platform Net Profit</span>
                      <span className="text-base font-black text-purple-700">₹{platformFees}</span>
                    </div>
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
                      <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Awaiting Verification</span>
                      <span className="text-base font-black text-amber-600">₹{pendingVerificationCash}</span>
                    </div>
                  </div>

                  {/* Unified Live Guest Ledger with Search & Status Filters */}
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider">Student Reservations Directory</h4>
                        <p className="text-[10px] text-gray-400">View and manage all registered guests in one consolidated list.</p>
                      </div>

                      {/* Search & Filter Controls */}
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Search guest name or phone..."
                          className="bg-gray-50 border border-gray-300 rounded p-1.5 text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:outline-none w-full sm:w-48 font-medium"
                          value={guestSearchQuery}
                          onChange={(e) => setGuestSearchQuery(e.target.value)}
                        />
                        <select
                          className="bg-gray-50 border border-gray-300 rounded p-1.5 text-xs text-gray-950 focus:outline-none cursor-pointer font-medium"
                          value={guestStatusFilter}
                          onChange={(e) => setGuestStatusFilter(e.target.value)}
                        >
                          <option value="ALL">All Guest States</option>
                          <option value="Joined">Checked-In Guests</option>
                          <option value="Reserved">Escrowed Reservations</option>
                          <option value="Pending">Awaiting Verification</option>
                          <option value="Pending_Payment">Awaiting Payment</option>
                        </select>
                      </div>
                    </div>

                    {/* Guest Ledger Table */}
                    <div className="border rounded-lg overflow-hidden bg-white max-h-96 overflow-y-auto shadow-inner">
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
                              <p className="text-gray-400 text-xs italic text-center py-8">
                                No matching student registrations found.
                              </p>
                            );
                          }

                          return (
                            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                              <thead>
                                <tr className="bg-gray-50 border-b text-[10px] uppercase text-gray-400 font-extrabold sticky top-0 z-10">
                                  <th className="p-3">Student Guest</th>
                                  <th className="p-3">Sharing</th>
                                  <th className="p-3">Check-in Date</th>
                                  <th className="p-3">Payment Info</th>
                                  <th className="p-3">Status</th>
                                  <th className="p-3 text-right">Operations Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {filtered.map((b) => {
                                  const isJoined = b.status === "Approved" && new Date(b.checkInDate) < today;
                                  const isReserved = b.status === "Approved" && new Date(b.checkInDate) >= today;
                                  const isPendingVer = b.status === "Pending";
                                  const isAwaitingPay = b.status === "Pending_Payment";

                                  return (
                                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                                      <td className="p-3">
                                        <p className="font-extrabold text-gray-900">{b.studentName}</p>
                                        <p className="text-[10px] text-gray-500 font-mono select-all">{b.studentPhone}</p>
                                      </td>
                                      <td className="p-3 text-gray-700">
                                        <span className="font-bold">{b.room.sharingType} Sharing</span>
                                      </td>
                                      <td className="p-3 text-gray-600 font-medium">
                                        {new Date(b.checkInDate).toLocaleDateString()}
                                      </td>
                                      <td className="p-3">
                                        <p className="font-bold text-green-700">₹{b.amountPaid}</p>
                                        <p className="text-[9px] text-gray-400 font-mono select-all">UTR: {b.utr || "N/A"}</p>
                                      </td>
                                      <td className="p-3">
                                        <span
                                          className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                            isJoined
                                              ? "bg-green-50 text-green-800 border-green-200"
                                              : isReserved
                                              ? "bg-amber-50 text-amber-800 border-amber-200"
                                              : isPendingVer
                                              ? "bg-orange-50 text-orange-800 border-orange-200 animate-pulse"
                                              : isAwaitingPay
                                              ? "bg-purple-50 text-purple-800 border-purple-200"
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
                                              className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-[9px] py-1 px-2 rounded shadow cursor-pointer transition-colors"
                                            >
                                              Approve
                                            </button>
                                            <button
                                              onClick={() => handleBookingVerification(b.id, "Rejected")}
                                              className="bg-white border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-[9px] py-1 px-2 rounded cursor-pointer transition-colors"
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="text-[10px] text-gray-400 italic">No action needed</span>
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

                  <div className="text-center pt-4 border-t">
                    <button
                      onClick={() => setSelectedPgDetail(null)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-6 rounded-md transition-colors cursor-pointer shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl relative space-y-4 border my-8">
            <button onClick={() => setShowAddModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">✕</button>
            <h2 className="text-xl font-black text-gray-900">Register New PG Hostel</h2>

            <form onSubmit={handleCreatePg} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Hostel/PG Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Balaji Premium Boys Hostel"
                    className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none"
                    value={pgName}
                    onChange={(e) => setPgName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Gate Distance (KM)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none"
                    value={pgDistance}
                    onChange={(e) => setPgDistance(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Booking Advance (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="2000"
                    className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none"
                    value={pgReservationFee}
                    onChange={(e) => setPgReservationFee(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Hostel Address / Landmark</label>
                <input
                  type="text"
                  required
                  placeholder="Near Gate 2, RGMCET Campus outskirts"
                  className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none"
                  value={pgAddress}
                  onChange={(e) => setPgAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Amenities (Comma separated)</label>
                <input
                  type="text"
                  className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none"
                  value={pgAmenities}
                  onChange={(e) => setPgAmenities(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Link Target Proximity College</label>
                  <select
                    className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none cursor-pointer"
                    value={pgCollegeId}
                    onChange={(e) => setPgCollegeId(e.target.value)}
                  >
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Link Landlord / PG Owner</label>
                  <select
                    className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none cursor-pointer"
                    value={pgOwnerId}
                    onChange={(e) => setPgOwnerId(e.target.value)}
                  >
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>{o.name} ({o.phone})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Cover Image URL</label>
                <input
                  type="text"
                  placeholder="https://unsplash.com/..."
                  className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none"
                  value={pgImageUrl}
                  onChange={(e) => setPgImageUrl(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded shadow cursor-pointer text-center text-xs mt-2"
              >
                {submitLoading ? "Publishing..." : "Confirm & Publish PG"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CRUD MODALS: EDIT PG DETAILS */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl relative space-y-4 border my-8">
            <button onClick={() => setShowEditModal(null)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">✕</button>
            <h2 className="text-xl font-black text-gray-900">Edit PG Hostel Details</h2>

            <form onSubmit={handleUpdatePg} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">PG Hostel Name</label>
                  <input
                    type="text"
                    required
                    className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none"
                    value={pgName}
                    onChange={(e) => setPgName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Gate Distance (KM)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none"
                    value={pgDistance}
                    onChange={(e) => setPgDistance(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Booking Advance (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="2000"
                    className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none"
                    value={pgReservationFee}
                    onChange={(e) => setPgReservationFee(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Hostel Address</label>
                <input
                  type="text"
                  required
                  className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none"
                  value={pgAddress}
                  onChange={(e) => setPgAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">PG Description</label>
                <textarea
                  rows={2}
                  required
                  className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none"
                  value={pgDescription}
                  onChange={(e) => setPgDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Amenities (Comma separated)</label>
                <input
                  type="text"
                  className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none"
                  value={pgAmenities}
                  onChange={(e) => setPgAmenities(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">College Link</label>
                  <select
                    className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none cursor-pointer"
                    value={pgCollegeId}
                    onChange={(e) => setPgCollegeId(e.target.value)}
                  >
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Landlord Link</label>
                  <select
                    className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none cursor-pointer"
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
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none"
                    value={pgImageUrl}
                    onChange={(e) => setPgImageUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Gallery Image URLs (Comma-separated)</label>
                  <input
                    type="text"
                    className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none"
                    value={pgImages}
                    onChange={(e) => setPgImages(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded shadow cursor-pointer text-center text-xs mt-2"
              >
                {submitLoading ? "Saving changes..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CRUD MODALS: APPROVE AMBASSADOR SUBMISSION */}
      {showApproveLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl relative space-y-4 border my-8">
            <button onClick={() => setShowApproveLeadModal(null)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">✕</button>
            <h2 className="text-xl font-black text-gray-900">Approve & Register PG Listing</h2>
            <p className="text-xs text-gray-500 leading-normal">
              Approve submission form for <strong className="text-gray-700">{showApproveLeadModal.hostelName}</strong>. Select the landlord account and target college below to make it live:
            </p>

            <form onSubmit={handleApproveLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Select Campus / College</label>
                  <select
                    className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none cursor-pointer"
                    value={pgCollegeId}
                    onChange={(e) => setPgCollegeId(e.target.value)}
                  >
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Select Landlord User Link</label>
                  <select
                    className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none cursor-pointer font-semibold"
                    value={pgOwnerId}
                    onChange={(e) => setPgOwnerId(e.target.value)}
                  >
                    <option value="CREATE_NEW">🆕 Register New Account ({showApproveLeadModal.ownerName})</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>{o.name} ({o.phone})</option>
                    ))}
                  </select>
                  <span className="text-[9px] text-gray-400 mt-1 block leading-normal">
                    If registering new, default login password will be <strong className="text-indigo-600 font-bold font-mono">password123</strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Gate Proximity Distance (KM)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none"
                  value={pgDistance}
                  onChange={(e) => setPgDistance(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold py-3 rounded shadow cursor-pointer text-center text-xs mt-2"
              >
                {submitLoading ? "Publishing Listing..." : "Confirm & Import live PG"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
