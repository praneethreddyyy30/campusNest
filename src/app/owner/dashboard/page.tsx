"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  const openEditRoomModal = (room: Room) => {
    setEditRoomRent(room.priceMonthly.toString());
    setEditRoomBeds(room.availableBeds.toString());
    
    // Parse images comma-separated string
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
        // Refresh bookings and rooms inventory
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
        // Update local state instantly
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
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 text-sm font-medium">Loading Owner Dashboard...</p>
      </div>
    );
  }

  const totalBedsLeft = rooms.reduce((sum, r) => sum + r.availableBeds, 0);
  const approvedBookings = bookings.filter(b => b.status === "Approved");
  const pendingBookings = bookings.filter(b => b.status === "Pending");
  const totalRevenue = approvedBookings.length * 2000; // ₹2000 per booking advance

  const pgName = rooms.length > 0 ? rooms[0].pg.name : "Your Hostel PG";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Welcome header */}
      <div className="bg-white border rounded-xl p-6 shadow-sm flex justify-between items-center flex-wrap gap-4">
        <div>
          <span className="text-xs text-indigo-600 font-extrabold uppercase tracking-wider">
            Owner Panel • {pgName}
          </span>
          <h1 className="text-2xl font-black text-gray-900">Welcome, {ownerName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Managing vacancies and booking requests for <strong className="text-indigo-600 font-extrabold">{pgName}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="bg-white border hover:bg-gray-50 text-gray-700 font-extrabold text-xs py-2 px-4 rounded cursor-pointer transition-colors"
          >
            ⚙️ Edit Profile
          </button>
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

      {/* Analytics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-gray-400">Vacant Beds Left</span>
          <p className="text-2xl font-black text-indigo-600">{totalBedsLeft}</p>
          <span className="text-[10px] text-gray-400 block font-medium">Beds currently live on portal</span>
        </div>
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-gray-400">Confirmed Guests</span>
          <p className="text-2xl font-black text-green-600">{approvedBookings.length}</p>
          <span className="text-[10px] text-gray-400 block font-medium">Approved student reservations</span>
        </div>
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-gray-400">Pending Actions</span>
          <p className="text-2xl font-black text-amber-600">{pendingBookings.length}</p>
          <span className="text-[10px] text-gray-400 block font-medium">Bookings waiting for approval</span>
        </div>
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-gray-400">Escrow Cash Balance</span>
          <p className="text-2xl font-black text-gray-900">₹{totalRevenue}</p>
          <span className="text-[10px] text-gray-400 block font-medium">Escrow rent advance balance</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bookings column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-gray-900 border-b pb-2">
              Recent Booking Requests
            </h2>

            {bookings.length === 0 ? (
              <p className="text-gray-500 text-sm italic py-4">No bookings received yet.</p>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {bookings.map((booking) => {
                  const isPending = booking.status === "Pending";
                  const isApproved = booking.status === "Approved";

                  return (
                    <div
                      key={booking.id}
                      className="border rounded-lg p-4 bg-gray-50/50 space-y-3 text-sm hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <p className="font-extrabold text-gray-800">{booking.studentName}</p>
                          <p className="text-xs text-gray-500">Phone: {booking.studentPhone}</p>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                            isPending
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : isApproved
                              ? "bg-green-50 text-green-800 border-green-200"
                              : booking.status === "No-Show"
                              ? "bg-slate-50 text-slate-600 border-slate-200"
                              : "bg-red-50 text-red-800 border-red-200"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-white border p-3 rounded">
                        <div>
                          <span className="font-semibold text-gray-400">Reserved Room:</span>
                          <p className="font-bold text-gray-700">{booking.room.sharingType} Sharing</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-400">Check-in Date:</span>
                          <p className="font-bold text-gray-700">
                            {new Date(booking.checkInDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="col-span-2 pt-1 border-t mt-1">
                          <span className="font-semibold text-gray-400">UTR / Ref Number:</span>
                          <p className="font-bold text-indigo-600 font-mono select-all">
                            {booking.utr}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleBookingStatus(booking.id, "Approved")}
                              className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs py-1.5 px-3 rounded shadow-sm transition-colors cursor-pointer"
                            >
                              Accept Booking
                            </button>
                            <button
                              onClick={() => handleBookingStatus(booking.id, "Rejected")}
                              className="bg-white border hover:bg-red-50 border-gray-300 hover:border-red-300 text-gray-700 hover:text-red-700 font-semibold text-xs py-1.5 px-3 rounded transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {isApproved && (
                          <button
                            onClick={() => handleBookingStatus(booking.id, "No-Show")}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-xs py-1.5 px-3 rounded transition-colors cursor-pointer"
                          >
                            Flag No-Show (Forfeit Advance)
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

        {/* Room Inventory Column */}
        <div className="space-y-6">
          <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-gray-900 border-b pb-2">
              Manage Room Vacancies
            </h2>
            <p className="text-xs text-gray-500 leading-normal">
              Manage vacancy counters for each room category. The counter will decrease automatically when you accept bookings.
            </p>

            <div className="space-y-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="border rounded-lg p-4 bg-gray-50/50 flex items-center justify-between gap-4 text-sm"
                >
                  <div>
                    <p className="font-extrabold text-gray-800">
                      {room.sharingType} Sharing ({room.genderPreference})
                    </p>
                    <p className="text-xs text-gray-400">Rent: ₹{room.priceMonthly}/mo</p>
                  </div>

                  {/* Bed counter widget & Edit button */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-3 bg-white border rounded-lg p-1.5 shadow-sm">
                      <button
                        onClick={() => handleUpdateBeds(room.id, room.availableBeds - 1)}
                        disabled={room.availableBeds <= 0}
                        className={`h-7 w-7 rounded flex items-center justify-center font-bold text-gray-700 border hover:bg-gray-50 cursor-pointer ${
                          room.availableBeds <= 0 ? "opacity-30 cursor-not-allowed" : ""
                        }`}
                      >
                        -
                      </button>
                      <span className="font-extrabold text-gray-900 w-6 text-center select-none">
                        {room.availableBeds}
                      </span>
                      <button
                        onClick={() => handleUpdateBeds(room.id, room.availableBeds + 1)}
                        className="h-7 w-7 rounded flex items-center justify-center font-bold text-gray-700 border hover:bg-gray-50 cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => openEditRoomModal(room)}
                      className="h-9 w-9 border rounded-lg hover:bg-gray-50 text-gray-650 flex items-center justify-center cursor-pointer transition-colors shadow-sm bg-white"
                      title="Edit Room details & images"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-gray-100 text-xs text-gray-900">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-sm text-gray-900">Update Profile Settings</h3>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setEditPassword("");
                  setEditConfirmPassword("");
                }}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Registered Name</label>
                <input
                  type="text"
                  required
                  className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none font-semibold text-xs"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  required
                  className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none font-semibold text-xs"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
                <span className="text-[9px] text-gray-400 mt-1 block">
                  Must be a valid 10-digit Indian mobile number.
                </span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Booking Advance (₹)</label>
                <input
                  type="number"
                  required
                  className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none font-semibold text-xs font-mono"
                  value={editReservationFee}
                  onChange={(e) => setEditReservationFee(e.target.value)}
                />
                <span className="text-[9px] text-gray-400 mt-1 block">
                  Token reservation advance held in Escrow vault.
                </span>
              </div>

              <div className="border-t pt-3">
                <span className="font-bold text-[10px] text-indigo-600 uppercase tracking-wider block mb-2">
                  Change Password (Optional)
                </span>
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current"
                      className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none text-xs"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none text-xs"
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={settingsLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-lg text-xs mt-6 transition-colors cursor-pointer shadow"
              >
                {settingsLoading ? "Saving Settings..." : "Save Profile Settings"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROOM MODAL */}
      {showEditRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-gray-100 text-xs text-gray-900">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-sm text-gray-950">
                Edit {showEditRoomModal.sharingType} Sharing Room Details
              </h3>
              <button
                onClick={() => setShowEditRoomModal(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoomDetails} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Monthly Room Rent (₹/mo)</label>
                <input
                  type="number"
                  required
                  className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none font-semibold text-xs font-mono"
                  value={editRoomRent}
                  onChange={(e) => setEditRoomRent(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Beds Available</label>
                <input
                  type="number"
                  required
                  className="w-full border bg-gray-50 p-2.5 rounded text-gray-900 focus:outline-none font-semibold text-xs font-mono"
                  value={editRoomBeds}
                  onChange={(e) => setEditRoomBeds(e.target.value)}
                />
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-bold text-gray-700">Room Setup Images</label>
                  <button
                    type="button"
                    onClick={handleAddImageField}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold cursor-pointer"
                  >
                    ➕ Add Image URL
                  </button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {editRoomImages.map((url, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="url"
                        required
                        placeholder="https://images.unsplash.com/photo-..."
                        className="flex-grow border bg-gray-50 p-2 rounded text-gray-900 focus:outline-none text-xs"
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
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-[9px] text-gray-400 mt-1 block leading-normal">
                  Provide multiple images to showcase different angles (bathroom, study desks, ventilation, entry).
                </span>
              </div>

              {/* Multiple Image Preview Grid */}
              {editRoomImages.filter(Boolean).length > 0 && (
                <div className="grid grid-cols-3 gap-2 border rounded-lg p-2 bg-gray-50 max-h-24 overflow-y-auto">
                  {editRoomImages.filter(Boolean).map((url, idx) => (
                    <div key={idx} className="h-16 rounded overflow-hidden relative border bg-white flex items-center justify-center">
                      <img
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=100&q=50";
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={roomSaving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-lg text-xs mt-6 transition-colors cursor-pointer shadow"
              >
                {roomSaving ? "Saving Room Details..." : "Save Room Details"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
