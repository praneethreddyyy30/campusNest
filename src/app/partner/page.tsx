"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Building, 
  MapPin, 
  User, 
  Phone, 
  Wifi, 
  Coffee, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Compass, 
  Home, 
  Info,
  DollarSign
} from "lucide-react";

export default function PartnerRegistration() {
  const [hostelName, setHostelName] = useState("");
  const [address, setAddress] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [distanceKm, setDistanceKm] = useState("0.5");
  const [description, setDescription] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [customRooms, setCustomRooms] = useState<{ sharingType: string; priceMonthly: string; availableBeds: string }[]>([
    { sharingType: "Double", priceMonthly: "5000", availableBeds: "4" },
    { sharingType: "Triple", priceMonthly: "4200", availableBeds: "6" }
  ]);

  const handleAddCustomRoom = () => {
    setCustomRooms([...customRooms, { sharingType: "", priceMonthly: "", availableBeds: "" }]);
  };

  const handleRemoveCustomRoom = (idx: number) => {
    setCustomRooms(customRooms.filter((_, i) => i !== idx));
  };

  const handleUpdateCustomRoom = (idx: number, field: "sharingType" | "priceMonthly" | "availableBeds", value: string) => {
    const updated = [...customRooms];
    updated[idx] = { ...updated[idx], [field]: value };
    setCustomRooms(updated);
  };

  // Amenities checklist
  const [wifi, setWifi] = useState(true);
  const [meals, setMeals] = useState(true);
  const [laundry, setLaundry] = useState(false);
  const [cctv, setCctv] = useState(false);
  const [ac, setAc] = useState(false);
  const [backup, setBackup] = useState(false);
  const [roWater, setRoWater] = useState(true);
  const [security, setSecurity] = useState(false);

  // Custom/extra amenities dynamic list
  const [customAmenities, setCustomAmenities] = useState<string[]>([""]);

  const handleAddCustomAmenity = () => {
    setCustomAmenities([...customAmenities, ""]);
  };

  const handleRemoveCustomAmenity = (idx: number) => {
    setCustomAmenities(customAmenities.filter((_, i) => i !== idx));
  };

  const handleUpdateCustomAmenity = (idx: number, value: string) => {
    const updated = [...customAmenities];
    updated[idx] = value;
    setCustomAmenities(updated);
  };

  // Dynamic Photo URLs list
  const [photos, setPhotos] = useState<{ url: string; label: string }[]>([
    { url: "", label: "Main Cover" },
    { url: "", label: "Washroom / Bathroom View" },
    { url: "", label: "Bed / Room View" },
    { url: "", label: "Dining / Canteen View" },
    { url: "", label: "Study Space / Desk View" },
  ]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");



  const handleAddPhoto = () => {
    setPhotos([...photos, { url: "", label: "" }]);
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const handleUpdatePhoto = (idx: number, field: "url" | "label", value: string) => {
    const updated = [...photos];
    updated[idx][field] = value;
    setPhotos(updated);
  };

  const handleMovePhoto = (idx: number, direction: "up" | "down") => {
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === photos.length - 1) return;
    const updated = [...photos];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setPhotos(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validRooms = customRooms.filter(r => r.sharingType.trim() !== "");
    if (validRooms.length === 0) {
      setError("Please add at least one Room Type (e.g. Single, Double, etc.).");
      setLoading(false);
      return;
    }

    for (const r of validRooms) {
      const price = parseFloat(r.priceMonthly);
      const beds = parseInt(r.availableBeds);
      if (isNaN(price) || price <= 0) {
        setError(`Please enter a valid monthly rent for "${r.sharingType}" room.`);
        setLoading(false);
        return;
      }
      if (isNaN(beds) || beds <= 0) {
        setError(`Please enter a valid number of available beds for "${r.sharingType}" room.`);
        setLoading(false);
        return;
      }
    }

    const prices = validRooms.map(r => parseFloat(r.priceMonthly));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const calculatedPriceRange = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`;

    const nonImg = photos.filter(p => p.url.trim() !== "");
    if (nonImg.length === 0) {
      setError("Please provide at least one photo URL.");
      setLoading(false);
      return;
    }

    const phoneDigits = ownerPhone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      setError("Please enter a valid 10-digit Indian phone number (starting with 6-9, no spaces or special symbols) for the owner.");
      setLoading(false);
      return;
    }

    // Compose amenities list
    const amenitiesArr: string[] = [];
    if (wifi) amenitiesArr.push("WiFi");
    if (meals) amenitiesArr.push("Meals");
    if (laundry) amenitiesArr.push("Laundry");
    if (cctv) amenitiesArr.push("CCTV");
    if (ac) amenitiesArr.push("AC");
    if (backup) amenitiesArr.push("PowerBackup");
    if (roWater) amenitiesArr.push("RO Water");
    if (security) amenitiesArr.push("Security");

    const customs = customAmenities
      .map(a => a.trim())
      .filter(a => a.length > 0);
    if (customs.length > 0) {
      amenitiesArr.push(...customs);
    }
    const amenitiesStr = amenitiesArr.join(", ");

    // Compose images gallery list
    const imagesArr = photos.map(p => p.url.trim()).filter(Boolean);
    const coverImg = imagesArr[0] || "";
    const imagesStr = imagesArr.join(",");

    try {
      const res = await fetch("/api/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostelName,
          address,
          collegeName,
          distanceKm: parseFloat(distanceKm) || 0.5,
          description,
          locationUrl,
          ownerName,
          ownerPhone,
          sharingTypes: JSON.stringify(validRooms),
          priceRange: calculatedPriceRange,
          amenities: amenitiesStr,
          imageUrl: coverImg,
          images: imagesStr,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Submission failed. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to platform server. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-12 px-4 bg-pearl font-sans text-midnight">
      
      {/* 1. Header Banner */}
      <div className="bg-midnight rounded-t-3xl p-8 text-pearl text-center border border-midnight-light/50">
        <span className="text-[9px] font-extrabold uppercase tracking-wider bg-pearl/15 text-pearl py-1.5 px-4 rounded-full">
          Ambassadors & Landlords
        </span>
        <h1 className="text-3xl font-sans font-bold mt-4 text-pearl">CampusNest Ambassador Portal</h1>
        <p className="text-xs text-cream/70 mt-2 max-w-lg mx-auto leading-relaxed font-sans">
          Submit minor hostel details, coordinates, and photos. Super admin reviews submissions directly and deploys them to the live map with a single click.
        </p>
      </div>

      {/* 2. Content Form Body */}
      <div className="bg-white border-x border-b border-beige/40 rounded-b-3xl p-6 sm:p-10 shadow-sm">
        {success ? (
          <div className="text-center py-10 space-y-6">
            <div className="w-16 h-16 bg-beige/30 text-midnight rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-sans font-bold text-midnight">Hostel Registered</h2>
              <p className="text-xs sm:text-sm text-midnight/60 max-w-sm mx-auto leading-relaxed">
                Your detailed submission for <strong className="font-bold text-midnight">{hostelName}</strong> has been registered. It will go live once verified by the platform operator.
              </p>
            </div>
            <div className="pt-4 flex gap-3 justify-center">
              <Link
                href="/"
                className="bg-midnight hover:bg-midnight-light text-pearl font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-xs cursor-pointer uppercase tracking-wider"
              >
                Go to Homepage
              </Link>
              <button
                onClick={() => {
                  setSuccess(false);
                  setHostelName("");
                  setAddress("");
                  setCollegeName("");
                  setDistanceKm("0.5");
                  setDescription("");
                  setLocationUrl("");
                  setOwnerName("");
                  setOwnerPhone("");
                  setCustomRooms([
                    { sharingType: "Double", priceMonthly: "5000", availableBeds: "4" },
                    { sharingType: "Triple", priceMonthly: "4200", availableBeds: "6" }
                  ]);
                  setCustomAmenities([""]);
                  setPhotos([
                    { url: "", label: "Main Cover" },
                    { url: "", label: "Washroom / Bathroom View" },
                    { url: "", label: "Bed / Room View" },
                    { url: "", label: "Dining / Canteen View" },
                    { url: "", label: "Study Space / Desk View" },
                  ]);
                }}
                className="bg-white border border-beige/45 hover:bg-beige/10 text-midnight font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-xs cursor-pointer uppercase tracking-wider"
              >
                Submit New Form
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Hostel Basic Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-midnight/70 uppercase tracking-widest border-b border-beige/25 pb-2">1. Basic Hostel Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">Hostel/PG Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Raja Reddy Boys Hostel"
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                    value={hostelName}
                    onChange={(e) => setHostelName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">Target Proximity College</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RGMCET campus outskirts"
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">Distance to Gate (in KM)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 0.3"
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">Maps Coordinates Link</label>
                  <input
                    type="url"
                    required
                    placeholder="e.g. https://maps.google.com/?q=..."
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                    value={locationUrl}
                    onChange={(e) => setLocationUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">Full Address / Detailed Landmark</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Opp. RGMCET Gate, Beside Hanuman Mandir"
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">Detailed Description (curfew, key rules)</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Telugu food menu, power backup is on from 6 PM to 10 PM. No outside guests allowed past 9 PM."
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Section 2: Landlord & Rent Details */}
            <div className="space-y-4 border-t border-beige/25 pt-6">
              <h3 className="text-xs font-bold text-midnight/70 uppercase tracking-widest border-b border-beige/25 pb-2">2. Landlord & Rent Pricing</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">Landlord Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Reddy"
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">Owner Contact Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-beige/15">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">
                    Room Configurations & Pricing
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCustomRoom}
                    className="text-[10px] font-bold text-midnight hover:text-midnight/80 bg-beige/35 border border-beige/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-semibold"
                  >
                    + Add Room Category
                  </button>
                </div>

                <div className="space-y-3">
                  {customRooms.map((room, idx) => (
                    <div key={idx} className="flex gap-3 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="block text-[9px] font-bold text-midnight/50 uppercase tracking-wider">
                          Room Sharing Type
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Single, Double, Deluxe"
                          className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                          value={room.sharingType}
                          onChange={(e) => handleUpdateCustomRoom(idx, "sharingType", e.target.value)}
                        />
                      </div>

                      <div className="w-28 sm:w-36 space-y-1">
                        <label className="block text-[9px] font-bold text-midnight/50 uppercase tracking-wider">
                          Monthly Rent (₹)
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 5000"
                          className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                          value={room.priceMonthly}
                          onChange={(e) => handleUpdateCustomRoom(idx, "priceMonthly", e.target.value)}
                        />
                      </div>

                      <div className="w-24 sm:w-28 space-y-1">
                        <label className="block text-[9px] font-bold text-midnight/50 uppercase tracking-wider">
                          Available Beds
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 4"
                          className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                          value={room.availableBeds}
                          onChange={(e) => handleUpdateCustomRoom(idx, "availableBeds", e.target.value)}
                        />
                      </div>

                      {customRooms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomRoom(idx)}
                          className="h-11 w-11 border border-red-200 hover:bg-red-55 text-red-750 flex items-center justify-center rounded-xl cursor-pointer transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3: Amenities checklist */}
            <div className="space-y-4 border-t border-beige/25 pt-6">
              <h3 className="text-xs font-bold text-midnight/70 uppercase tracking-widest border-b border-beige/25 pb-2">3. Amenities Offered</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none font-semibold text-midnight">
                  <input type="checkbox" checked={wifi} onChange={(e) => setWifi(e.target.checked)} className="rounded border-beige/45 text-midnight focus:ring-midnight h-4 w-4 cursor-pointer" />
                  <span>Wi-Fi Enabled</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none font-semibold text-midnight">
                  <input type="checkbox" checked={meals} onChange={(e) => setMeals(e.target.checked)} className="rounded border-beige/45 text-midnight focus:ring-midnight h-4 w-4 cursor-pointer" />
                  <span>Meals Included</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none font-semibold text-midnight">
                  <input type="checkbox" checked={laundry} onChange={(e) => setLaundry(e.target.checked)} className="rounded border-beige/45 text-midnight focus:ring-midnight h-4 w-4 cursor-pointer" />
                  <span>Washing Machine</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none font-semibold text-midnight">
                  <input type="checkbox" checked={cctv} onChange={(e) => setCctv(e.target.checked)} className="rounded border-beige/45 text-midnight focus:ring-midnight h-4 w-4 cursor-pointer" />
                  <span>CCTV Security</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none font-semibold text-midnight">
                  <input type="checkbox" checked={ac} onChange={(e) => setAc(e.target.checked)} className="rounded border-beige/45 text-midnight focus:ring-midnight h-4 w-4 cursor-pointer" />
                  <span>Air Conditioning</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none font-semibold text-midnight">
                  <input type="checkbox" checked={backup} onChange={(e) => setBackup(e.target.checked)} className="rounded border-beige/45 text-midnight focus:ring-midnight h-4 w-4 cursor-pointer" />
                  <span>Power Backup</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none font-semibold text-midnight">
                  <input type="checkbox" checked={roWater} onChange={(e) => setRoWater(e.target.checked)} className="rounded border-beige/45 text-midnight focus:ring-midnight h-4 w-4 cursor-pointer" />
                  <span>RO Water Purifier</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none font-semibold text-midnight">
                  <input type="checkbox" checked={security} onChange={(e) => setSecurity(e.target.checked)} className="rounded border-beige/45 text-midnight focus:ring-midnight h-4 w-4 cursor-pointer" />
                  <span>Security Guard</span>
                </label>
              </div>

              <div className="space-y-3 pt-2 font-sans">
                <div className="flex justify-between items-center border-b border-beige/25 pb-1">
                  <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">Extra / Custom Amenities (Dynamic)</label>
                  <button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    className="text-[9px] text-midnight hover:underline font-extrabold uppercase tracking-wider cursor-pointer"
                  >
                    + Add Custom Amenity
                  </button>
                </div>
                <p className="text-[9px] text-midnight/50">
                  Click "+ Add Custom Amenity" to specify unique offerings like a DJ Outview, gym access, or private balcony.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {customAmenities.map((amenity, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="e.g. DJ System, Geyser, Gym"
                        className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                        value={amenity}
                        onChange={(e) => handleUpdateCustomAmenity(idx, e.target.value)}
                      />
                      {customAmenities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomAmenity(idx)}
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

            {/* Section 4: Dynamic Image URLs */}
            <div className="space-y-4 border-t border-beige/25 pt-6 font-sans">
              <div className="flex justify-between items-center border-b border-beige/25 pb-2">
                <h3 className="text-xs font-bold text-midnight/70 uppercase tracking-widest">4. Hostel Photo Gallery URLs</h3>
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="text-[10px] text-midnight hover:underline font-extrabold uppercase tracking-wider cursor-pointer"
                >
                  + Add Photo URL
                </button>
              </div>
              <p className="text-[10px] text-midnight/50 leading-relaxed flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-midnight/40 shrink-0" />
                <span>Reorder photos using Move Up/Down. The first photo will be the Main Cover. Specify labels to highlight special rooms (e.g. DJ outview, Balcony).</span>
              </p>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {photos.map((photo, idx) => (
                  <div key={idx} className="bg-beige/5 border border-beige/35 rounded-2xl p-4 space-y-3 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-midnight/60 uppercase tracking-wider">
                        {idx === 0 ? "Photo #1 (Cover Photo)" : `Photo #${idx + 1}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMovePhoto(idx, "up")}
                          className={`text-[9px] font-extrabold px-2 py-1 rounded border border-beige/45 bg-white hover:bg-beige/10 text-midnight ${idx === 0 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          Move Up
                        </button>
                        <button
                          type="button"
                          disabled={idx === photos.length - 1}
                          onClick={() => handleMovePhoto(idx, "down")}
                          className={`text-[9px] font-extrabold px-2 py-1 rounded border border-beige/45 bg-white hover:bg-beige/10 text-midnight ${idx === photos.length - 1 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          Move Down
                        </button>
                        {photos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="text-[9px] font-extrabold px-2 py-1 rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-midnight/60 uppercase tracking-wider">Image Label / View</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Washroom view, Balcony, DJ outview"
                          className="w-full bg-white border border-beige/40 rounded-xl p-2.5 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                          value={photo.label}
                          onChange={(e) => handleUpdatePhoto(idx, "label", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-midnight/60 uppercase tracking-wider">Image URL</label>
                        <input
                          type="url"
                          required
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full bg-white border border-beige/40 rounded-xl p-2.5 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-mono font-semibold"
                          value={photo.url}
                          onChange={(e) => handleUpdatePhoto(idx, "url", e.target.value)}
                        />
                      </div>
                    </div>

                    {photo.url.trim() !== "" && (
                      <div className="h-16 w-24 rounded-lg overflow-hidden border border-beige/35 bg-white flex items-center justify-center">
                        <img
                          src={photo.url}
                          alt="Thumbnail preview"
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
              disabled={loading}
              className="w-full bg-midnight hover:bg-midnight-light text-pearl font-bold py-4 rounded-xl text-xs mt-6 transition-all shadow-xs cursor-pointer text-center uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" />
                  <span>Submitting Coordinates & Details...</span>
                </>
              ) : (
                <span>Submit Form & Verify Coordinates</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
