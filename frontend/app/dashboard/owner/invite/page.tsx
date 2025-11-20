"use client";
import { useState, useEffect } from "react";

export default function InvitePage() {
  const [email, setEmail] = useState("");
  const [apartmentId, setApartmentId] = useState("");
  const [apartments, setApartments] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  // Fetch apartments
  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const res = await fetch("/api/apartments");
        const data = await res.json();
        setApartments(data.apartments || []);
      } catch (error) {
        console.error("Failed to fetch apartments", error);
      }
    };
    fetchApartments();
  }, []);

  // Fetch pending invites
  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const res = await fetch("/api/invite");
        const data = await res.json();
        console.log("Response and data:", res, data);
        // API returns an array of invites directly. Support both shapes.
        const invitesArray = Array.isArray(data) ? data : data.invites || [];
        setInvites(invitesArray);
        console.log("Fetched invites:", invitesArray);
      } catch (error) {
        console.error("Failed to fetch invites", error);
      }
    };
    fetchInvites();
  }, []);

  const sendInvite = async () => {
    if (!email || !apartmentId) {
      alert("Please enter tenant email and select an apartment");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, apartmentId, role: "TENANT" }),
      });
      const data = await res.json().catch(() => null);
      console.log("Invite response data:", data, "status:", res.status);

      if (!res.ok) {
        // Prefer server-provided message, fallback to status text
        const errMsg = data?.error || `Server responded with ${res.status}`;
        alert(errMsg);
        return;
      }

      // On success: use returned inviteLink if provided and refresh invites
      if (data?.inviteLink) {
        setInviteLink(data.inviteLink);
      }

      const refreshed = await fetch("/api/invite").then((r) => r.json());
      const refreshedArray = Array.isArray(refreshed) ? refreshed : refreshed.invites || [];
      setInvites(refreshedArray);
    } catch (err) {
      console.error("Error sending invite:", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Invite a Tenant</h1>

      <input
        type="email"
        className="border rounded p-2 w-full mb-3"
        placeholder="Tenant Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <select
        className="border rounded p-2 w-full mb-3"
        value={apartmentId}
        onChange={(e) => setApartmentId(e.target.value)}
      >
        <option value="">Select Apartment</option>
        {apartments.map((apt: any) => (
          <option key={apt.id} value={apt.id}>
            {apt.building?.name ?? "Unknown"} – {apt.label}
          </option>
        ))}
      </select>

      <button
        onClick={sendInvite}
        disabled={loading}
        className="bg-blue-600 text-white rounded px-4 py-2"
      >
        {loading ? "Sending..." : "Send Invite"}
      </button>

      {inviteLink && (
        <div className="mt-4">
          <p className="text-green-600 font-medium">Invite created!</p>
          <p className="text-sm break-all">{inviteLink}</p>
        </div>
      )}

      {/* Show pending invites */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Pending Invites</h2>
        {invites.length === 0 ? (
          <p>No pending invites.</p>
        ) : (
          <table className="w-full border border-gray-300 rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Apartment</th>
                <th className="border p-2 text-left">Building</th>
                <th className="border p-2 text-left">Created At</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv: any) => {
                const apt = apartments.find((a: any) => a.id === inv.apartmentId) || inv.apartment;
                const apartmentLabel = apt?.label || inv.apartmentId || "-";
                // building may be nested on the apartment object
                const buildingName = apt?.building?.name || "-";

                return (
                  <tr key={inv.id}>
                    <td className="border p-2">{inv.email}</td>
                    <td className="border p-2">{apartmentLabel}</td>
                    <td className="border p-2">{buildingName}</td>
                    <td className="border p-2">{new Date(inv.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
