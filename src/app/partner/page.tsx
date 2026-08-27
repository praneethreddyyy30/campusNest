"use client";

import { useState } from "react";
import Link from "next/link";

export default function PartnerRegistration() {
  const [hostelName, setHostelName] = useState("");
  const [address, setAddress] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [distanceKm, setDistanceKm] = useState("0.5");
  const [description, setDescription] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [sharingTypes, setSharingTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState("");

  // Amenities checklist
  const [wifi, setWifi] = useState(true);
  const [meals, setMeals] = useState(true);
  const [laundry, setLaundry] = useState(false);
  const [cctv, setCctv] = useState(false);
  const [ac, setAc] = useState(false);
  const [backup, setBackup] = useState(false);
  const [roWater, setRoWater] = useState(true);
  const [security, setSecurity] = useState(false);

  // Labeled Image fields
  const [coverImg, setCoverImg] = useState("");
  const [washroomImg, setWashroomImg] = useState("");
  const [roomImg, setRoomImg] = useState("");
  const [messImg, setMessImg] = useState("");
  const [studyImg, setStudyImg] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleCheckboxChange = (type: string) => {
    setSharingTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (sharingTypes.length === 0) {
      setError("Please select at least one Room Sharing Type.");
      setLoading(false);
      return;
    }

    if (!coverImg) {
      setError("Please provide at least a Cover Image URL.");
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
    const amenitiesStr = amenitiesArr.join(", ");

    // Compose images gallery list
    const imagesArr = [coverImg, washroomImg, roomImg, messImg, studyImg].filter(Boolean);
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
          sharingTypes: sharingTypes.join(", "),
          priceRange,
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
    <div className="max-w-3xl mx-auto my-12 px-4 text-gray-900">
      {/* Banner */}
      <div className="bg-indigo-600 rounded-t-2xl p-6 text-white text-center shadow">
        <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-800 text-indigo-100 py-1 px-3 rounded-full">
          Ambassadors & Landlords
        </span>
        <h1 className="text-2xl font-black mt-3">CampusNest Ambassador Form</h1>
        <p className="text-xs text-indigo-100 mt-1 max-w-lg mx-auto leading-relaxed">
          Submit minor hostel details, coordinates, and photos. Super admin reviews submissions directly and deploys them to the live map with a single click.
        </p>
      </div>

      <div className="bg-white border-x border-b rounded-b-2xl p-6 md:p-8 shadow-md">
        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl font-black mx-auto">
              ✓
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">Hostel Registered with Admin!</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
              Your detailed submission form for <strong className="text-gray-700 font-bold">{hostelName}</strong> has been registered. Once verified by the platform operator, it will go live instantly.
            </p>
            <div className="pt-4 flex gap-3 justify-center">
              <Link
                href="/"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-6 rounded-md shadow-sm transition-colors cursor-pointer"
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
                  setSharingTypes([]);
                  setPriceRange("");
                  setCoverImg("");
                  setWashroomImg("");
                  setRoomImg("");
                  setMessImg("");
                  setStudyImg("");
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs py-2.5 px-6 rounded-md border transition-colors cursor-pointer"
              >
                Submit New Form
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md text-xs font-semibold border border-red-200">
                {error}
              </div>
            )}

            {/* Section 1: Hostel Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-indigo-600 border-b pb-1 uppercase tracking-wider">1. Basic Hostel Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Hostel/PG Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Raja Reddy Boys Hostel"
                    className="w-full bg-gray-50 border rounded-md p-3 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={hostelName}
                    onChange={(e) => setHostelName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Proximity College</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RGMCET campus gate outskirts"
                    className="w-full bg-gray-50 border rounded-md p-3 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Distance to Gate (in KM)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 0.3"
                    className="w-full bg-gray-50 border rounded-md p-3 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Google Maps Coordinates Link</label>
                  <input
                    type="url"
                    required
                    placeholder="e.g. https://maps.google.com/?q=..."
                    className="w-full bg-gray-50 border rounded-md p-3 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={locationUrl}
                    onChange={(e) => setLocationUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Address / Detailed Landmark</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Opp. RGMCET Sanjeeva Nagar Gate, Beside Hanuman Mandir"
                  className="w-full bg-gray-50 border rounded-md p-3 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Detailed Description (curfew, key rules)</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Strictly Telugu food menu, power backup is on from 6 PM to 10 PM. No outside guests allowed past 9 PM."
                  className="w-full bg-gray-50 border rounded-md p-3 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Section 2: Landlord & Rent Details */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-extrabold text-indigo-600 border-b pb-1 uppercase tracking-wider">2. Landlord & Rent Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Landlord / Owner Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Reddy"
                    className="w-full bg-gray-50 border rounded-md p-3 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Owner Contact Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    className="w-full bg-gray-50 border rounded-md p-3 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Available Sharing Categories</label>
                  <div className="flex gap-4">
                    {["Single", "Double", "Triple"].map((type) => (
                      <label key={type} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                          checked={sharingTypes.includes(type)}
                          onChange={() => handleCheckboxChange(type)}
                        />
                        <span>{type} sharing</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Monthly Rent Price Range</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹4200 - ₹5000"
                    className="w-full bg-gray-50 border rounded-md p-3 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Amenities checklist */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-extrabold text-indigo-600 border-b pb-1 uppercase tracking-wider">3. Amenities Offered</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={wifi} onChange={(e) => setWifi(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer" />
                  <span>Wi-Fi Enabled</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={meals} onChange={(e) => setMeals(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer" />
                  <span>Meals Included</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={laundry} onChange={(e) => setLaundry(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer" />
                  <span>Washing Machine</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={cctv} onChange={(e) => setCctv(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer" />
                  <span>CCTV Camera</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={ac} onChange={(e) => setAc(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer" />
                  <span>Air Conditioning</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={backup} onChange={(e) => setBackup(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer" />
                  <span>Power Backup</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={roWater} onChange={(e) => setRoWater(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer" />
                  <span>Purified RO Water</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={security} onChange={(e) => setSecurity(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer" />
                  <span>Security Guard</span>
                </label>
              </div>
            </div>

            {/* Section 4: Labeled Image URLs */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-extrabold text-indigo-600 border-b pb-1 uppercase tracking-wider">4. Hostel Photo Gallery URLs</h3>
              <p className="text-[10px] text-gray-500 leading-normal">
                Please paste public image URLs (e.g. from Unsplash, Imgur, or cloud storage) so the super admin can visually verify washroom cleanliness and room details.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Main Cover Photo URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-gray-50 border rounded-md p-3 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={coverImg}
                    onChange={(e) => setCoverImg(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Washroom / Bathroom View URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-gray-50 border rounded-md p-3 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={washroomImg}
                    onChange={(e) => setWashroomImg(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Bed / Room View URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-gray-50 border rounded-md p-2.5 text-[11px] text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={roomImg}
                    onChange={(e) => setRoomImg(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Dining / Canteen View URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-gray-50 border rounded-md p-2.5 text-[11px] text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={messImg}
                    onChange={(e) => setMessImg(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Study Space / Desk View URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-gray-50 border rounded-md p-2.5 text-[11px] text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={studyImg}
                    onChange={(e) => setStudyImg(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-lg text-xs mt-6 transition-colors shadow cursor-pointer text-center"
            >
              {loading ? "Submitting Detailed Ambassador Form..." : "Submit Form & Verify Coordinates"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
