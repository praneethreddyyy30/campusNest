"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Building, 
  Users, 
  Clock, 
  Wallet, 
  Settings, 
  LogOut, 
  Plus, 
  Minus, 
  Edit, 
  X, 
  Check, 
  Trash2, 
  Loader2,
  Phone,
  Calendar,
  Lock,
  FileText
} from "lucide-react";

interface PG {
  name: string;
}

interface Room {
  id: string;
  sharingType: string;
  priceMonthly: number;
  availableBeds: number;
  genderPreference: string;
  imageUrl?: string;
  images?: string;
  pg: PG;
}

interface Booking {
  id: string;
  studentName: string;
  studentPhone: string;
  amountPaid: number;
  status: string;
  checkInDate: string;
  utr: string;
  room: {
    sharingType: string;
    pg: { name: string };
  };
}

export default function OwnerDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState("");
  const router = useRouter();

  // Settings profile hooks
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [editReservationFee, setEditReservationFee] = useState("2000");
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Edit Room modal hooks
  const [showEditRoomModal, setShowEditRoomModal] = useState<Room | null>(null);
  const [editRoomRent, setEditRoomRent] = useState("");
  const [editRoomBeds, setEditRoomBeds] = useState("");
  const [editRoomImages, setEditRoomImages] = useState<string[]>([""]);
  const [roomSaving, setRoomSaving] = useState(false);

  // Edit PG details hooks
  const [pg, setPg] = useState<any | null>(null);
  const [showEditPgModal, setShowEditPgModal] = useState(false);
  const [editPgName, setEditPgName] = useState("");
  const [editPgAddress, setEditPgAddress] = useState("");
  const [editPgDescription, setEditPgDescription] = useState("");
  const [editPgDistance, setEditPgDistance] = useState("");
  const [editPgReservationFee, setEditPgReservationFee] = useState("");
  
  // PG amenities checklist states
  const [editPgWifi, setEditPgWifi] = useState(false);
  const [editPgMeals, setEditPgMeals] = useState(false);
  const [editPgLaundry, setEditPgLaundry] = useState(false);
  const [editPgCctv, setEditPgCctv] = useState(false);
  const [editPgAc, setEditPgAc] = useState(false);
  const [editPgBackup, setEditPgBackup] = useState(false);
  const [editPgRoWater, setEditPgRoWater] = useState(false);
  const [editPgSecurity, setEditPgSecurity] = useState(false);
  const [editPgCustomAmenities, setEditPgCustomAmenities] = useState<string[]>([""]);

  const handleAddEditPgCustomAmenity = () => {
    setEditPgCustomAmenities([...editPgCustomAmenities, ""]);
  };

  const handleRemoveEditPgCustomAmenity = (idx: number) => {
    setEditPgCustomAmenities(editPgCustomAmenities.filter((_, i) => i !== idx));
  };

  const handleUpdateEditPgCustomAmenity = (idx: number, value: string) => {
    const updated = [...editPgCustomAmenities];
    updated[idx] = value;
    setEditPgCustomAmenities(updated);
  };

  // PG Photos
  const [editPgPhotos, setEditPgPhotos] = useState<{ url: string; label: string }[]>([]);
  const [pgSaving, setPgSaving] = useState(false);

  const openEditRoomModal = (room: Room) => {
    setEditRoomRent(room.priceMonthly.toString());
    setEditRoomBeds(room.availableBeds.toString());
    
    let parsedImages = [""];
    if (room.images) {
      parsedImages = room.images.split(",").map(img => img.trim()).filter(Boolean);
    } else if (room.imageUrl) {
      parsedImages = [room.imageUrl];
    }
    
    setEditRoomImages(parsedImages.length > 0 ? parsedImages : [""]);
    setShowEditRoomModal(room);
  };

  const handleAddImageField = () => {
    setEditRoomImages([...editRoomImages, ""]);
  };

  const handleUpdateImageField = (idx: number, value: string) => {
    const updated = [...editRoomImages];
    updated[idx] = value;
    setEditRoomImages(updated);
  };

  const handleRemoveImageField = (idx: number) => {
    const updated = editRoomImages.filter((_, i) => i !== idx);
    setEditRoomImages(updated.length > 0 ? updated : [""]);
  };

  const openEditPgModal = () => {
    if (!pg) return;
    setEditPgName(pg.name);
    setEditPgAddress(pg.address);
    setEditPgDescription(pg.description);
    setEditPgDistance(pg.distanceKm.toString());
    setEditPgReservationFee(pg.reservationFee.toString());

    // Parse amenities
    const amenitiesArr = pg.amenities.split(",").map((a: string) => a.trim());
    setEditPgWifi(amenitiesArr.includes("WiFi"));
    setEditPgMeals(amenitiesArr.includes("Meals"));
    setEditPgLaundry(amenitiesArr.includes("Laundry"));
    setEditPgCctv(amenitiesArr.includes("CCTV"));
    setEditPgAc(amenitiesArr.includes("AC"));
    setEditPgBackup(amenitiesArr.includes("PowerBackup"));
    setEditPgRoWater(amenitiesArr.includes("RO Water"));
    setEditPgSecurity(amenitiesArr.includes("Security"));

    // Filter custom amenities
    const standardList = ["WiFi", "Meals", "Laundry", "CCTV", "AC", "PowerBackup", "RO Water", "Security"];
    const customs = amenitiesArr.filter((a: string) => !standardList.includes(a));
    setEditPgCustomAmenities(customs.length > 0 ? customs : [""]);

    // Parse photos
    let parsedPhotos: { url: string; label: string }[] = [];
    const targetImages = pg.pendingImages || pg.images;
    const targetImageUrl = pg.pendingImageUrl || pg.imageUrl;

    if (targetImages) {
      const urls = targetImages.split(",").map((url: string) => url.trim()).filter(Boolean);
      parsedPhotos = urls.map((url: string, idx: number) => {
        if (idx === 0) return { url, label: "Main Cover" };
        if (url === targetImageUrl) return { url, label: "Main Cover" };
        return { url, label: `Photo #${idx + 1}` };
      });
    } else if (targetImageUrl) {
      parsedPhotos = [{ url: targetImageUrl, label: "Main Cover" }];
    }
    
    if (parsedPhotos.length === 0) {
      parsedPhotos = [
        { url: "", label: "Main Cover" },
        { url: "", label: "Washroom / Bathroom View" },
        { url: "", label: "Bed / Room View" },
        { url: "", label: "Dining / Canteen View" },
        { url: "", label: "Study Space / Desk View" }
      ];
    }
    
    // If hasPendingUpdates is true, show pending fields in inputs
    if (pg.hasPendingUpdates) {
      setEditPgName(pg.pendingName || pg.name);
      setEditPgAddress(pg.pendingAddress || pg.address);
      setEditPgDescription(pg.pendingDescription || pg.description);
      setEditPgDistance((pg.pendingDistanceKm ?? pg.distanceKm).toString());
      setEditPgReservationFee((pg.pendingReservationFee ?? pg.reservationFee).toString());

      const pendingAmenitiesArr = (pg.pendingAmenities || "").split(",").map((a: string) => a.trim());
      if (pg.pendingAmenities) {
        setEditPgWifi(pendingAmenitiesArr.includes("WiFi"));
        setEditPgMeals(pendingAmenitiesArr.includes("Meals"));
        setEditPgLaundry(pendingAmenitiesArr.includes("Laundry"));
        setEditPgCctv(pendingAmenitiesArr.includes("CCTV"));
        setEditPgAc(pendingAmenitiesArr.includes("AC"));
        setEditPgBackup(pendingAmenitiesArr.includes("PowerBackup"));
        setEditPgRoWater(pendingAmenitiesArr.includes("RO Water"));
        setEditPgSecurity(pendingAmenitiesArr.includes("Security"));

        const customsPending = pendingAmenitiesArr.filter((a: string) => !standardList.includes(a));
        setEditPgCustomAmenities(customsPending.length > 0 ? customsPending : [""]);
      }
    }

    setEditPgPhotos(parsedPhotos);
    setShowEditPgModal(true);
  };

  const handleAddPgPhoto = () => {
    setEditPgPhotos([...editPgPhotos, { url: "", label: "" }]);
  };

  const handleRemovePgPhoto = (idx: number) => {
    setEditPgPhotos(editPgPhotos.filter((_, i) => i !== idx));
  };

  const handleUpdatePgPhoto = (idx: number, field: "url" | "label", value: string) => {
    const updated = [...editPgPhotos];
    updated[idx][field] = value;
    setEditPgPhotos(updated);
  };

  const handleMovePgPhoto = (idx: number, direction: "up" | "down") => {
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === editPgPhotos.length - 1) return;
    const updated = [...editPgPhotos];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setEditPgPhotos(updated);
  };

  const handleSavePgDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pg) return;

    const nonImg = editPgPhotos.filter(p => p.url.trim() !== "");
    if (nonImg.length === 0) {
      alert("Please provide at least one photo URL.");
      return;
    }

    setPgSaving(true);
    try {
      const amenitiesArr: string[] = [];
      if (editPgWifi) amenitiesArr.push("WiFi");
      if (editPgMeals) amenitiesArr.push("Meals");
      if (editPgLaundry) amenitiesArr.push("Laundry");
      if (editPgCctv) amenitiesArr.push("CCTV");
      if (editPgAc) amenitiesArr.push("AC");
      if (editPgBackup) amenitiesArr.push("PowerBackup");
      if (editPgRoWater) amenitiesArr.push("RO Water");
      if (editPgSecurity) amenitiesArr.push("Security");

      const customs = editPgCustomAmenities
        .map(a => a.trim())
        .filter(a => a.length > 0);
      if (customs.length > 0) {
        amenitiesArr.push(...customs);
      }
      const amenitiesStr = amenitiesArr.join(", ");

      const imagesArr = editPgPhotos.map(p => p.url.trim()).filter(Boolean);
      const coverUrl = imagesArr[0] || "";
      const imagesStr = imagesArr.join(",");

      const res = await fetch("/api/owner/pg", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editPgName,
          address: editPgAddress,
          description: editPgDescription,
          distanceKm: editPgDistance,
          amenities: amenitiesStr,
          imageUrl: coverUrl,
          images: imagesStr,
          reservationFee: editPgReservationFee,
        }),
      });

      if (res.ok) {
        alert("Proposed updates submitted to Admin for approval successfully!");
        setShowEditPgModal(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit updates.");
      }
    } catch (err) {
      alert("Connection timeout. PG details could not be updated.");
    } finally {
      setPgSaving(false);
    }
  };

  const fetchData = async () => {
    try {
      // 1. Verify session
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok || !sessionData.user || sessionData.user.role !== "owner") {
        router.push("/login");
        return;
      }
      setOwnerName(sessionData.user.name);
      setEditName(sessionData.user.name);
      setEditPhone(sessionData.user.phone);

      // 2. Fetch rooms
      const roomsRes = await fetch("/api/owner/rooms");
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData);
        if (roomsData.length > 0) {
          setEditReservationFee((roomsData[0]?.pg?.reservationFee ?? 2000).toString());
        }
      }

      // 3. Fetch bookings
      const bookingsRes = await fetch("/api/bookings");
      if (bookingsRes.ok) {
        setBookings(await bookingsRes.json());
      }

      // 4. Fetch PG details
      const pgRes = await fetch("/api/owner/pg");
      if (pgRes.ok) {
        const pgData = await pgRes.json();
        setPg(pgData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editPassword && editPassword !== editConfirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    setSettingsLoading(true);
    try {
      const res = await fetch("/api/owner/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          password: editPassword || undefined,
          reservationFee: editReservationFee,
        }),
      });

      if (res.ok) {
        alert("Profile details updated successfully!");
        setShowSettingsModal(false);
        setEditPassword("");
        setEditConfirmPassword("");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update profile settings.");
      }
    } catch (err) {
      alert("Connection timeout. Profile could not be updated.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveRoomDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditRoomModal) return;

    setRoomSaving(true);
    try {
      const res = await fetch("/api/owner/rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: showEditRoomModal.id,
          availableBeds: editRoomBeds,
          priceMonthly: editRoomRent,
          images: editRoomImages,
        }),
      });

      if (res.ok) {
        alert("Room details saved successfully!");
        setShowEditRoomModal(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update room details.");
      }
    } catch (err) {
      alert("Connection timeout. Room details could not be updated.");
    } finally {
      setRoomSaving(false);
    }
  };

  const handleBookingStatus = async (bookingId: string, status: string) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBeds = async (roomId: string, newCount: number) => {
    if (newCount < 0) return;
    try {
      const res = await fetch("/api/owner/rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, availableBeds: newCount }),
      });

      if (res.ok) {
        setRooms((prevRooms) =>
          prevRooms.map((room) =>
            room.id === roomId ? { ...room, availableBeds: newCount } : room
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-pearl min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-midnight/60" />
        <p className="text-xs text-midnight/60 font-semibold tracking-wide">Loading Owner Dashboard...</p>
      </div>
    );
  }

  const totalBedsLeft = rooms.reduce((sum, r) => sum + r.availableBeds, 0);
  const visibleBookings = bookings.filter(b => b.status !== "Pending_Payment" && b.status !== "Payment_Submitted");
  const approvedBookings = visibleBookings.filter(b => b.status === "Approved");
  const pendingBookings = visibleBookings.filter(b => b.status === "Pending");
  const totalRevenue = approvedBookings.length * parseFloat(editReservationFee);

  const pgName = rooms.length > 0 ? rooms[0].pg.name : "Your Hostel PG";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-pearl font-sans text-midnight">
      
      {/* 1. Welcome Header */}
      <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <span className="text-[10px] text-midnight/55 uppercase font-bold tracking-widest block">
            Owner Panel • {pgName}
          </span>
          <h1 className="text-3xl font-sans font-bold text-midnight mt-0.5">Welcome, {ownerName}</h1>
          <p className="text-xs text-midnight/60 font-sans mt-0.5">
            Managing vacancies and reservations for <strong className="font-bold text-midnight">{pgName}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={openEditPgModal}
            className="inline-flex items-center justify-center bg-white border border-beige/45 hover:bg-beige/10 text-midnight font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-xs cursor-pointer uppercase tracking-wider gap-1.5"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Edit PG Details</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center justify-center bg-white border border-beige/45 hover:bg-beige/10 text-midnight font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-xs cursor-pointer uppercase tracking-wider gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Profile Settings</span>
          </button>
          
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

      {pg?.hasPendingUpdates && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-6 py-4 rounded-3xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <span>⚠️ Proposed updates for your PG details are currently pending Super Admin approval. The public page will continue to show your original listing until approved.</span>
        </div>
      )}

      {/* 2. Summary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-beige/40 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-midnight/40">
            <span className="text-[9px] font-bold uppercase tracking-wider">Vacant Beds</span>
            <Building className="w-4 h-4 shrink-0" />
          </div>
          <p className="text-3xl font-sans font-bold text-midnight">{totalBedsLeft}</p>
          <span className="text-[9px] text-midnight/50 font-semibold block">Available on platform</span>
        </div>

        <div className="bg-white border border-beige/40 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-midnight/40">
            <span className="text-[9px] font-bold uppercase tracking-wider">Guests</span>
            <Users className="w-4 h-4 shrink-0" />
          </div>
          <p className="text-3xl font-sans font-bold text-midnight">{approvedBookings.length}</p>
          <span className="text-[9px] text-midnight/50 font-semibold block">Confirmed check-ins</span>
        </div>

        <div className="bg-white border border-beige/40 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-midnight/40">
            <span className="text-[9px] font-bold uppercase tracking-wider">Pending Tasks</span>
            <Clock className="w-4 h-4 shrink-0" />
          </div>
          <p className="text-3xl font-sans font-bold text-midnight">{pendingBookings.length}</p>
          <span className="text-[9px] text-midnight/50 font-semibold block">Awaiting approval</span>
        </div>

        <div className="bg-white border border-beige/40 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-midnight/40">
            <span className="text-[9px] font-bold uppercase tracking-wider">Escrow Balance</span>
            <Wallet className="w-4 h-4 shrink-0" />
          </div>
          <p className="text-3xl font-sans font-bold text-midnight">₹{totalRevenue}</p>
          <span className="text-[9px] text-midnight/50 font-semibold block">Token advances locked</span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Bookings Requests */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-beige/25 pb-3">
              <h2 className="text-xl font-sans font-bold text-midnight">Recent Booking Requests</h2>
              <p className="text-xs text-midnight/55 mt-0.5">Approve bookings to lock beds and credit advances to your account</p>
            </div>

            {visibleBookings.length === 0 ? (
              <p className="text-midnight/50 text-xs italic py-8 text-center font-sans">No reservation inquiries received yet.</p>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {visibleBookings.map((booking) => {
                  const isPending = booking.status === "Pending";
                  const isApproved = booking.status === "Approved";
                  const isNoShow = booking.status === "No-Show";

                  return (
                    <div
                      key={booking.id}
                      className="border border-beige/40 rounded-2xl p-5 bg-beige/5 space-y-4 text-xs sm:text-sm hover:border-midnight/35 transition-colors font-sans"
                    >
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div className="space-y-0.5">
                          <p className="font-bold text-midnight">{booking.studentName}</p>
                          <p className="text-[10px] text-midnight/55 font-semibold flex items-center gap-1">
                            <Phone className="w-3 h-3 text-midnight/40" />
                            <span>{booking.studentPhone}</span>
                          </p>
                        </div>
                        
                        <span
                          className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                            isPending
                              ? "bg-white text-midnight border-beige/65 animate-pulse"
                              : isApproved
                              ? "bg-white text-midnight border-beige/65"
                              : isNoShow
                              ? "bg-beige/10 text-midnight/40 border-beige/20"
                              : "bg-red-50 text-red-800 border-red-200"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs bg-white border border-beige/35 p-4 rounded-xl">
                        <div>
                          <span className="text-[9px] font-bold text-midnight/55 uppercase tracking-wide">Sharing Category</span>
                          <p className="font-bold text-midnight mt-0.5">{booking.room.sharingType} Sharing</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-midnight/55 uppercase tracking-wide">Expected Check-in</span>
                          <p className="font-bold text-midnight mt-0.5">
                            {new Date(booking.checkInDate).toLocaleDateString()}
                          </p>
                        </div>

                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleBookingStatus(booking.id, "Approved")}
                              className="bg-midnight hover:bg-midnight-light text-pearl font-bold text-[10px] py-2 px-4 rounded-lg transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-1 shadow-xs"
                            >
                              <Check className="w-3 h-3 text-pearl" />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => handleBookingStatus(booking.id, "Rejected")}
                              className="bg-white border border-beige/45 hover:bg-beige/10 text-midnight font-bold text-[10px] py-2 px-4 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {isApproved && (
                          <button
                            onClick={() => handleBookingStatus(booking.id, "No-Show")}
                            className="inline-flex items-center gap-1.5 bg-white border border-beige/45 hover:bg-beige/10 text-midnight font-bold text-[10px] py-2.5 px-4 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                          >
                            <Trash2 className="w-3 h-3 text-midnight/70" />
                            <span>Flag No-Show (Forfeit Escrow)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Room Inventory Management */}
        <div className="space-y-6">
          <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="border-b border-beige/25 pb-3">
              <h2 className="text-xl font-sans font-bold text-midnight">Manage Vacancies</h2>
              <p className="text-xs text-midnight/55 mt-0.5">Synchronize available bed counters on the map directory</p>
            </div>

            <div className="space-y-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="border border-beige/40 rounded-2xl p-4 bg-beige/5 flex items-center justify-between gap-4 text-xs sm:text-sm font-sans"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-midnight leading-tight">
                      {room.sharingType} Sharing ({room.genderPreference})
                    </p>
                    <p className="text-[10px] text-midnight/55 font-semibold">Rent: ₹{room.priceMonthly}/mo</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Vacant Counter */}
                    <div className="flex items-center space-x-3 bg-white border border-beige/35 rounded-xl p-1 shadow-xs">
                      <button
                        onClick={() => handleUpdateBeds(room.id, room.availableBeds - 1)}
                        disabled={room.availableBeds <= 0}
                        className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-midnight border border-beige/40 hover:bg-beige/10 cursor-pointer ${
                          room.availableBeds <= 0 ? "opacity-30 cursor-not-allowed" : ""
                        }`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-midnight w-6 text-center select-none">
                        {room.availableBeds}
                      </span>
                      <button
                        onClick={() => handleUpdateBeds(room.id, room.availableBeds + 1)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center font-bold text-midnight border border-beige/40 hover:bg-beige/10 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Edit Detail */}
                    <button
                      onClick={() => openEditRoomModal(room)}
                      className="h-9 w-9 border border-beige/40 rounded-xl hover:bg-beige/10 text-midnight flex items-center justify-center cursor-pointer transition-colors shadow-xs bg-white"
                      title="Edit details & photos"
                    >
                      <Edit className="w-4 h-4 text-midnight/70" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Profile Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-midnight/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-beige/40 text-xs text-midnight font-sans">
            <div className="flex justify-between items-center border-b border-beige/25 pb-3">
              <h3 className="font-sans font-bold text-sm text-midnight">Profile Settings</h3>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setEditPassword("");
                  setEditConfirmPassword("");
                }}
                className="text-midnight/65 hover:text-midnight cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/75 uppercase tracking-wide">Registered Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/75 uppercase tracking-wide">Mobile Phone Number</label>
                <input
                  type="tel"
                  required
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/75 uppercase tracking-wide">Escrow Advance Token (₹)</label>
                <input
                  type="number"
                  required
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold font-mono"
                  value={editReservationFee}
                  onChange={(e) => setEditReservationFee(e.target.value)}
                />
                <span className="text-[9px] text-midnight/55 block font-sans">
                  The advance reservation token held in escrow by the platform.
                </span>
              </div>

              <div className="border-t border-beige/25 pt-3 space-y-3">
                <span className="font-bold text-[9px] text-midnight/60 uppercase tracking-widest block">
                  Change Password (Optional)
                </span>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-midnight/75 uppercase tracking-wide">New Password</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current"
                      className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-midnight/75 uppercase tracking-wide">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight"
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={settingsLoading}
                className="w-full bg-midnight hover:bg-midnight-light text-pearl font-bold py-3.5 rounded-xl text-xs mt-6 transition-colors cursor-pointer uppercase tracking-wider shadow-xs"
              >
                {settingsLoading ? "Saving Settings..." : "Save Profile Settings"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditRoomModal && (
        <div className="fixed inset-0 z-50 bg-midnight/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-beige/40 text-xs text-midnight font-sans">
            <div className="flex justify-between items-center border-b border-beige/25 pb-3">
              <h3 className="font-sans font-bold text-sm text-midnight">
                Edit {showEditRoomModal.sharingType} Sharing Details
              </h3>
              <button
                onClick={() => setShowEditRoomModal(null)}
                className="text-midnight/65 hover:text-midnight cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoomDetails} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/75 uppercase tracking-wide">Monthly Room Rent (₹/mo)</label>
                <input
                  type="number"
                  required
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold font-mono"
                  value={editRoomRent}
                  onChange={(e) => setEditRoomRent(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/75 uppercase tracking-wide">Beds Available</label>
                <input
                  type="number"
                  required
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold font-mono"
                  value={editRoomBeds}
                  onChange={(e) => setEditRoomBeds(e.target.value)}
                />
              </div>

              <div className="space-y-3 border-t border-beige/25 pt-4">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-midnight/75 uppercase tracking-wide">Room Setup Images</label>
                  <button
                    type="button"
                    onClick={handleAddImageField}
                    className="text-[9px] text-midnight hover:underline font-extrabold cursor-pointer uppercase tracking-wider"
                  >
                    Add Image URL
                  </button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {editRoomImages.map((url, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="url"
                        required
                        placeholder="https://images.unsplash.com/photo-..."
                        className="flex-grow bg-beige/10 border border-beige/40 rounded-xl p-2.5 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight"
                        value={url}
                        onChange={(e) => handleUpdateImageField(idx, e.target.value)}
                      />
                      {editRoomImages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImageField(idx)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold p-2 cursor-pointer"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-[9px] text-midnight/50 block leading-normal">
                  Provide multiple images to showcase bed quality, study tables, and ventilation.
                </span>
              </div>

              {/* Image Preview Grid */}
              {editRoomImages.filter(Boolean).length > 0 && (
                <div className="grid grid-cols-3 gap-2 border border-beige/35 rounded-xl p-2 bg-beige/5 max-h-24 overflow-y-auto">
                  {editRoomImages.filter(Boolean).map((url, idx) => (
                    <div key={idx} className="h-14 rounded-lg overflow-hidden border border-beige/30 bg-white flex items-center justify-center">
                      <img
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/room-1.jpg";
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={roomSaving}
                className="w-full bg-midnight hover:bg-midnight-light text-pearl font-bold py-3.5 rounded-xl text-xs mt-6 transition-colors cursor-pointer uppercase tracking-wider shadow-xs"
              >
                {roomSaving ? "Saving Room Details..." : "Save Room Details"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit PG Details Modal */}
      {showEditPgModal && pg && (
        <div className="fixed inset-0 z-50 bg-midnight/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-beige/40 text-xs text-midnight font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-beige/25 pb-3">
              <h3 className="font-sans font-bold text-sm text-midnight">
                Edit PG Hostel Details
              </h3>
              <button
                onClick={() => setShowEditPgModal(false)}
                className="text-midnight/65 hover:text-midnight cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pg.hasPendingUpdates && (
              <div className="bg-yellow-50 border border-yellow-250 text-yellow-955 p-3.5 rounded-xl text-[11px] font-semibold leading-relaxed">
                ⚠️ You currently have proposed changes pending Super Admin approval. Submitting this form will update your pending request.
              </div>
            )}

            <form onSubmit={handleSavePgDetails} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/75 uppercase tracking-wide">PG Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                    value={editPgName}
                    onChange={(e) => setEditPgName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/75 uppercase tracking-wide">Proximity Distance (in KM)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold font-mono"
                    value={editPgDistance}
                    onChange={(e) => setEditPgDistance(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/75 uppercase tracking-wide">Detailed Address</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                    value={editPgAddress}
                    onChange={(e) => setEditPgAddress(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/75 uppercase tracking-wide">Escrow Advance Token (₹)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold font-mono"
                    value={editPgReservationFee}
                    onChange={(e) => setEditPgReservationFee(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/75 uppercase tracking-wide">Detailed Description (Rules, Curfew, Food Menu)</label>
                <textarea
                  rows={3}
                  required
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={editPgDescription}
                  onChange={(e) => setEditPgDescription(e.target.value)}
                />
              </div>

              {/* PG Amenities Checklist */}
              <div className="space-y-3 border-t border-beige/25 pt-4">
                <label className="block text-[10px] font-bold text-midnight/75 uppercase tracking-wide font-semibold">Amenities Offered</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-midnight cursor-pointer select-none">
                    <input type="checkbox" checked={editPgWifi} onChange={(e) => setEditPgWifi(e.target.checked)} className="rounded border-beige/45 text-midnight focus:ring-midnight h-4 w-4 cursor-pointer" />
                    <span>WiFi Enabled</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-midnight cursor-pointer select-none">
                    <input type="checkbox" checked={editPgMeals} onChange={(e) => setEditPgMeals(e.target.checked)} className="rounded border-beige/45 text-midnight focus:ring-midnight h-4 w-4 cursor-pointer" />
                    <span>Meals Included</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-midnight cursor-pointer select-none">
                    <input type="checkbox" checked={editPgLaundry} onChange={(e) => setEditPgLaundry(e.target.checked)} className="rounded border-beige/45 text-midnight focus:ring-midnight h-4 w-4 cursor-pointer" />
                    <span>Washing Machine</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-midnight cursor-pointer select-none">
                    <input type="checkbox" checked={editPgCctv} onChange={(e) => setEditPgCctv(e.target.checked)} className="rounded border-beige/45 text-midnight focus:ring-midnight h-4 w-4 cursor-pointer" />
                    <span>CCTV Security</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-midnight cursor-pointer select-none">
                    <input type="checkbox" checked={editPgAc} onChange={(e) => setEditPgAc(e.target.checked)} className="rounded border-beige/45 text-midnight focus:ring-midnight h-4 w-4 cursor-pointer" />
                    <span>Air Conditioning</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-midnight cursor-pointer select-none">
                    <input type="checkbox" checked={editPgBackup} onChange={(e) => setEditPgBackup(e.target.checked)} className="rounded border-beige/45 text-midnight focus:ring-midnight h-4 w-4 cursor-pointer" />
                    <span>Power Backup</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-midnight cursor-pointer select-none">
                    <input type="checkbox" checked={editPgRoWater} onChange={(e) => setEditPgRoWater(e.target.checked)} className="rounded border-beige/45 text-midnight focus:ring-midnight h-4 w-4 cursor-pointer" />
                    <span>RO Water Purifier</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-midnight cursor-pointer select-none">
                    <input type="checkbox" checked={editPgSecurity} onChange={(e) => setEditPgSecurity(e.target.checked)} className="rounded border-beige/45 text-midnight focus:ring-midnight h-4 w-4 cursor-pointer" />
                    <span>Security Guard</span>
                  </label>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center border-b border-beige/25 pb-1">
                    <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider font-semibold">Extra / Custom Amenities (Dynamic)</label>
                    <button
                      type="button"
                      onClick={handleAddEditPgCustomAmenity}
                      className="text-[9px] text-midnight hover:underline font-extrabold uppercase tracking-wider cursor-pointer"
                    >
                      + Add Custom Amenity
                    </button>
                  </div>
                  <p className="text-[9px] text-midnight/50">
                    Specify unique hostel features like private balconies, DJ equipment, geysers, or study spaces.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {editPgCustomAmenities.map((amenity, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="e.g. DJ System, Geyser, Gym"
                          className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                          value={amenity}
                          onChange={(e) => handleUpdateEditPgCustomAmenity(idx, e.target.value)}
                        />
                        {editPgCustomAmenities.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditPgCustomAmenity(idx)}
                            className="text-[10px] font-bold px-2.5 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-750 cursor-pointer transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Photo URLs list */}
              <div className="space-y-3 border-t border-beige/25 pt-4">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-midnight/75 uppercase tracking-wide font-semibold">Hostel Photo Gallery URLs</label>
                  <button
                    type="button"
                    onClick={handleAddPgPhoto}
                    className="text-[9px] text-midnight hover:underline font-extrabold cursor-pointer uppercase tracking-wider"
                  >
                    Add Photo URL
                  </button>
                </div>
                <p className="text-[9px] text-midnight/50 leading-normal">
                  The first photo URL will be the cover image. Rearrange using Move Up/Down. Specify labels to highlight key details (e.g. DJ outview).
                </p>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {editPgPhotos.map((photo, idx) => (
                    <div key={idx} className="bg-beige/5 border border-beige/35 rounded-2xl p-4 space-y-3 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-midnight/60 uppercase tracking-wider">
                          {idx === 0 ? "Photo #1 (Cover)" : `Photo #${idx + 1}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMovePgPhoto(idx, "up")}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded border border-beige/45 bg-white hover:bg-beige/10 text-midnight ${idx === 0 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            Move Up
                          </button>
                          <button
                            type="button"
                            disabled={idx === editPgPhotos.length - 1}
                            onClick={() => handleMovePgPhoto(idx, "down")}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded border border-beige/45 bg-white hover:bg-beige/10 text-midnight ${idx === editPgPhotos.length - 1 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            Move Down
                          </button>
                          {editPgPhotos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePgPhoto(idx)}
                              className="text-[9px] font-bold px-2 py-0.5 rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Image label (e.g. Washroom view)"
                          className="bg-white border border-beige/40 rounded-xl p-2 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                          value={photo.label}
                          onChange={(e) => handleUpdatePgPhoto(idx, "label", e.target.value)}
                        />
                        <input
                          type="url"
                          required
                          placeholder="https://images.unsplash.com/photo-..."
                          className="bg-white border border-beige/40 rounded-xl p-2 text-xs font-mono text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                          value={photo.url}
                          onChange={(e) => handleUpdatePgPhoto(idx, "url", e.target.value)}
                        />
                      </div>

                      {photo.url.trim() !== "" && (
                        <div className="h-14 w-20 rounded-lg overflow-hidden border border-beige/35 bg-white flex items-center justify-center">
                          <img
                            src={photo.url}
                            alt="Preview"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/room-1.jpg";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={pgSaving}
                className="w-full bg-midnight hover:bg-midnight-light text-pearl font-bold py-3.5 rounded-xl text-xs mt-6 transition-colors cursor-pointer uppercase tracking-wider shadow-xs"
              >
                {pgSaving ? "Submitting Updates..." : "Submit Updates for Admin Approval"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
