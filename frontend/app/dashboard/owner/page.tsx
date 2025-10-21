"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";


export default function OwnerDashboardPage({ owner }: { owner: any }) {
  console.log("Owner data:", owner);

        const { data: session } = useSession();
        const [email, setEmail] = useState("");
        const [status, setStatus] = useState<null | string>(null);
        const [invites, setInvites] = useState([]);
        const [buildingName, setBuildingName] = useState("");
        const [apartmentLabel, setApartmentLabel] = useState("");
        const [creating, setCreating] = useState(false);
const createApartment = async () => {
  if (!buildingName || !apartmentLabel) {
    alert("Please provide both fields");
    return;
  }

  setCreating(true);
  try {
    const res = await fetch("/api/apartments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buildingName, apartmentLabel }),
    });
    const data = await res.json();

    if (data.success) {
      alert("Apartment added successfully!");
      setBuildingName(data.buildingName);
      setApartmentLabel(data.apartmentLabel);
      // Re-fetch apartment list
      fetchApartments();
    } else {
      alert(data.error || "Error adding apartment");
    }
  } finally {
    setCreating(false);
  }
};

  const fetchApartments = async () => {
    try {
      const res = await fetch("/api/apartments");
      const data = await res.json();
      setApartmentLabel(data.apartments || []);
    } catch (error) {
      console.error("Failed to fetch apartments", error);
    }
  };
        useEffect(() => {
        const fetchInvites = async () => {
            const res = await fetch("/api/invite");
            console.log("Fetching invites...");
            console.log(res);
            const data = await res.json();
            setInvites(data);
        };
        fetchInvites();
        }, []);

    if (!session?.user)
    return <p className="text-red-500">You are not logged in.</p>;

    const handleInvite = async () => {
    setStatus("Sending...");
    try {
        const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        });

        if (!res.ok) throw new Error("Failed to send invite");

        const data = await res.json();
        setStatus(`✅ Invite sent to ${data.email}`);
        setEmail("");
    } catch (error: any) {
        setStatus("❌ Error sending invite");
    }
    };

  return (
    
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Welcome, {session.user.name || "Owner"}!</h2>

      <div className="mb-6">
        <p><strong>Email:</strong> {session.user.email}</p>
        {session.user.image && (
          <img
            src={session.user.image}
            alt="Profile"
            className="w-16 h-16 rounded-full mt-2"
          />
        )}
      </div>

      {owner?.buildings?.length ? (
        owner.buildings.map((building: any) => (
          <div key={building.id} className="p-4 border rounded-lg mb-4">
            <h2 className="text-xl font-semibold">{building.name}</h2>

            {building.apartments.map((apt: any) => (
              <div key={apt.id} className="ml-4 mt-2">
                <h3 className="text-lg font-medium">Apartment #{apt.id}</h3>
                <table className="ml-4 mt-1 border-collapse border">
                  <thead>
                    <tr>
                      <th className="border p-2">Tenant Name</th>
                      <th className="border p-2">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apt.tenants.length > 0 ? (
                      apt.tenants.map((t: any) => (
                        <tr key={t.id}>
                          <td className="border p-2">{t.user.name}</td>
                          <td className="border p-2">{t.user.email}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="border p-2" colSpan={2}>
                          No tenants yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ))
      ) : (
        <p>No buildings found.</p>
      )}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Add Apartment</h2>
        <input
          className="border rounded p-2 w-full mb-2"
          placeholder="Building Name"
          value={buildingName}
          onChange={(e) => setBuildingName(e.target.value)}
        />
        <input
          className="border rounded p-2 w-full mb-2"
          placeholder="Apartment Label / Number"
          value={apartmentLabel}
          onChange={(e) => setApartmentLabel(e.target.value)}
        />
        <button
          onClick={createApartment}
          disabled={creating}
          className="bg-green-600 text-white rounded px-4 py-2"
        >
          {creating ? "Adding..." : "Add Apartment"}
        </button>
      </div>

      <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">Send Tenant Invite</h2>
      {/* <div className="flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Tenant Email"
          className="border p-2 rounded w-72"
        />
        <button
          onClick={handleInvite}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send Invite
        </button>
      </div> */}
    <Link href="/dashboard/owner/invite" className="text-blue-600 underline">
      Manage Invites
    </Link>

      {status && <p className="mt-2 text-sm">{status}</p>}
     </div>
    </div>
   // TODO: Add UI Component to show pending invites
  );
}
