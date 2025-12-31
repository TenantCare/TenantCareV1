"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/app/components/ToastProvider";


export default function OwnerDashboardPage({ owner }: { owner: any }) {
  console.log("Owner data:", owner);

  const { data: session } = useSession();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | string>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [buildingName, setBuildingName] = useState("");
  const [apartmentLabel, setApartmentLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [apartments, setApartments] = useState<any[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<any | null>(null);
  const [apartmentTenants, setApartmentTenants] = useState<any[]>([]);
  const [apartmentLeases, setApartmentLeases] = useState<any[]>([]);
  const [rentInputs, setRentInputs] = useState<Record<string, number>>({});
  const [showModal, setShowModal] = useState(false);
  const [attachmentsByTenant, setAttachmentsByTenant] = useState<Record<string, any[]>>({});
  const [showAttachmentsFor, setShowAttachmentsFor] = useState<any | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyData, setHistoryData] = useState<any[]>([]);


  const createApartment = async () => {
    if (!buildingName || !apartmentLabel) {
      toast.error("Please provide both fields");
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
        toast.success("Apartment added successfully!");
        setBuildingName(data.buildingName);
        setApartmentLabel(data.apartmentLabel);
        // Re-fetch apartment list
        // fetchApartments();
      } else {
        toast.error(data.error || "Error adding apartment");
      }
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden"; // prevent scrolling
    } else {
      document.body.style.overflow = "auto"; // restore scrolling
    }
    return () => {
      document.body.style.overflow = "auto"; // cleanup
    };
  }, [showModal]);

  useEffect(() => {
    // Prefer the server-provided `owner` prop (owner -> buildings -> apartments).
    // This prevents listing apartments that don't belong to the logged-in owner
    // which caused the 403 when trying to fetch history for another owner's apartment.
    try {
      if (owner?.buildings && Array.isArray(owner.buildings)) {
        const ownerApts: any[] = [];
        owner.buildings.forEach((b: any) => {
          (b.apartments || []).forEach((a: any) => {
            ownerApts.push({ ...a, building: { name: b.name, id: b.id } });
          });
        });
        setApartments(ownerApts);
        return;
      }
    } catch (err) {
      console.error("Error processing owner prop for apartments", err);
    }

    // fallback: fetch all (keeps previous behavior if owner prop isn't available)
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
  }, [owner]);
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
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {session.user.name || "Owner"}!</h2>

        <div className="mb-6">
          <p><strong>Email:</strong> {session.user.email}</p>
          {session.user.image && (
            <div className="w-16 h-16 rounded-full mt-2 overflow-hidden">
              <Image
                src={session.user.image}
                alt="Profile"
                width={64}
                height={64}
                className="object-cover"
              />
            </div>
          )}
        </div>

        {apartments.length === 0 ? (
          <p className="text-yellow-600 mb-4">You have no apartments listed. Please add an apartment to get started.</p>
        ) : (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Your Apartments</h2>
            <div className="grid gap-3">
              {apartments.map((apt: any) => (
                <motion.div
                  key={apt.id}
                  whileHover={{ scale: 1.01 }}
                  className="p-3 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer"
                  onClick={async () => {
                    setSelectedApartment(apt);
                    // fetch tenants for this apartment
                    try {
                      const [tenRes, leaseRes] = await Promise.all([
                        fetch(`/api/apartments/${apt.id}/tenants`),
                        fetch(`/api/leases`),
                      ]);
                      const tenantsJson = await tenRes.json();
                      const leasesJson = await leaseRes.json();
                      setApartmentTenants(Array.isArray(tenantsJson) ? tenantsJson : []);
                      // leasesJson might be array of leases; filter for this apartment
                      const leasesFor = Array.isArray(leasesJson)
                        ? leasesJson.filter((l: any) => l.apartment?.id === apt.id || l.apartmentId === apt.id)
                        : [];
                      setApartmentLeases(leasesFor);
                      // prefill rent inputs from leases
                      const inputs: Record<string, number> = {};
                      leasesFor.forEach((l: any) => {
                        if (l.tenantId) inputs[l.tenantId] = l.rentAmount;
                      });
                      setRentInputs(inputs);
                    } catch (err) {
                      console.error(err);
                      setApartmentTenants([]);
                      setApartmentLeases([]);
                    }
                  }}
                >
                  <div>
                    <div className="text-sm text-gray-500">{apt.building?.name ?? "Unknown"}</div>
                    <div className="font-medium">{apt.label}</div>
                  </div>
                  <div className="text-xs text-gray-400">ID: {apt.id.slice(0, 6)}</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white rounded px-4 py-2"
        >
          + Add Apartment
        </button>


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
          <motion.div whileHover={{ scale: 1.02 }} className="inline-block">
            <Link href="/dashboard/owner/invite" className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded hover:shadow">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m0 0l4-4m-4 4l4 4" />
              </svg>
              Manage Invites
            </Link>
          </motion.div>

          {status && <p className="mt-2 text-sm">{status}</p>}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 2 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              key="modal"
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-white rounded-lg shadow-lg p-6 w-96 relative"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>

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
                onClick={async () => {
                  await createApartment();
                  setShowModal(false);
                }}
                disabled={creating}
                className="bg-green-600 text-white rounded px-4 py-2 w-full"
              >
                {creating ? "Adding..." : "Add Apartment"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            key="history-backdrop"
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Transaction History</h3>
                  <p className="text-sm text-gray-500">Apartment · {selectedApartment?.label}</p>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="text-gray-500">✕</button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-auto">
                {historyData.length === 0 ? (
                  <p className="text-sm text-gray-500">No transactions found.</p>
                ) : (
                  historyData.map((p: any) => (
                    <div key={p.id} className="border rounded p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{p.tenant?.user?.name ?? 'Tenant'}</div>
                          <div className="text-sm text-gray-500">{p.tenant?.user?.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{p.amount}</div>
                          <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                      {(p.attachments || []).length > 0 && (
                        <div className="mt-2 flex gap-3 flex-wrap">
                          {p.attachments.map((a: any) => (
                            <div key={a.id} className="w-40">
                              {a.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={a.url} alt={a.fileName} className="w-full h-24 object-cover rounded" />
                              ) : (
                                <a href={a.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600">{a.fileName}</a>
                              )}
                              <div className="text-xs text-gray-500">{a.method} {a.reference ? `· ${a.reference}` : ""}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAttachmentsFor && (
          <motion.div
            key="attachments-backdrop"
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Uploads · {showAttachmentsFor.user?.name}</h3>
                  <p className="text-sm text-gray-500">{showAttachmentsFor.user?.email}</p>
                </div>
                <button onClick={() => setShowAttachmentsFor(null)} className="text-gray-500">✕</button>
              </div>

              <div className="space-y-4">
                {(attachmentsByTenant[showAttachmentsFor.id] || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No payments/uploads found for this tenant.</p>
                ) : (
                  (attachmentsByTenant[showAttachmentsFor.id] || []).map((p: any) => (
                    <div key={p.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">Payment: {p.id}</div>
                          <div className="text-sm text-gray-500">Amount: ₹{p.amount} · {new Date(p.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {(p.attachments || []).map((a: any) => (
                          <div key={a.id} className="w-40">
                            {a.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                              // image preview
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={a.url} alt={a.fileName} className="w-full h-24 object-cover rounded" />
                            ) : (
                              <a href={a.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600">{a.fileName}</a>
                            )}
                            <div className="text-xs text-gray-500">{a.method} {a.reference ? `· ${a.reference}` : ""}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedApartment && (
          <motion.div
            key="apt-backdrop"
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedApartment.label}</h3>
                  <p className="text-sm text-gray-500">{selectedApartment.building?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    title="Transaction history"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/payments/history?apartmentId=${selectedApartment.id}`);
                        if (!res.ok) throw new Error("Failed to fetch history");
                        const json = await res.json();
                        setHistoryData(Array.isArray(json) ? json : []);
                        setShowHistoryModal(true);
                      } catch (err) {
                        console.error(err);
                        setHistoryData([]);
                        toast.error('Failed to load transaction history');
                      }
                    }}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    {/* expects file at /public/transaction-history.png */}
                    <img src="/icons/transaction-history.png" alt="history" className="w-6 h-6" />
                  </button>
                  <button onClick={() => setSelectedApartment(null)} className="text-gray-500">✕</button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Tenants</h4>
                {apartmentTenants.length === 0 ? (
                  <p className="text-sm text-gray-500">No tenants assigned to this apartment.</p>
                ) : (
                  <div className="space-y-3">
                    {apartmentTenants.map((t) => {
                      const lease = apartmentLeases.find((l: any) => l.tenantId === t.id);
                      return (
                        <div key={t.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium">{t.user?.name || "Unnamed"}</div>
                            <div className="text-sm text-gray-500">{t.user?.email}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-gray-500">Rent:</div>
                            <input
                              type="number"
                              value={rentInputs[t.id] ?? lease?.rentAmount ?? ""}
                              onChange={(e) => setRentInputs({ ...rentInputs, [t.id]: Number(e.target.value) })}
                              className="w-28 border rounded p-1"
                            />
                            <button
                              onClick={async () => {
                                const rent = Number(rentInputs[t.id] ?? lease?.rentAmount ?? 0);
                                if (!rent) return toast.error("Enter a valid rent amount");
                                try {
                                  const res = await fetch("/api/leases", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ tenantId: t.id, apartmentId: selectedApartment.id, rentAmount: rent, dueDay: 1 }),
                                  });
                                  if (!res.ok) throw new Error("Failed");
                                  // refresh leases
                                  const leasesRes = await fetch("/api/leases");
                                  const leasesJson = await leasesRes.json();
                                  const leasesFor = Array.isArray(leasesJson)
                                    ? leasesJson.filter((l: any) => l.apartment?.id === selectedApartment.id || l.apartmentId === selectedApartment.id)
                                    : [];
                                  setApartmentLeases(leasesFor);
                                  toast.success("Lease saved");
                                } catch (err) {
                                  console.error(err);
                                  toast.error("Failed to save lease");
                                }
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={async () => {
                                // Mark as Paid: create confirmed payment for this tenant
                                try {
                                  const payRes = await fetch("/api/payments", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ tenantId: t.id, amount: rentInputs[t.id] ?? lease?.rentAmount ?? 0, confirmed: true }),
                                  });
                                  const payJson = await payRes.json();
                                  if (payJson?.success) {
                                    toast.success("Marked as paid!");
                                  } else {
                                    toast.error("Failed to mark as paid");
                                  }
                                } catch (err) {
                                  console.error(err);
                                  toast.error("Failed to mark as paid");
                                }
                              }}
                              className="bg-green-600 text-white px-3 py-1 rounded"
                            >
                              Mark as Paid
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/payments/tenant/${t.id}`);
                                  if (!res.ok) throw new Error('Failed to fetch payments');
                                  const payments = await res.json();
                                  setAttachmentsByTenant((s) => ({ ...s, [t.id]: payments }));
                                  setShowAttachmentsFor(t);
                                } catch (err) {
                                  console.error(err);
                                  toast.error('Failed to load uploads');
                                }
                              }}
                              className="bg-gray-100 text-gray-700 px-3 py-1 rounded"
                            >
                              Uploads
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* TODO: Add UI Component to show pending invites */}
    </>
  );
}
