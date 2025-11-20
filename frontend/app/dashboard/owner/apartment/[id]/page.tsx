"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ApartmentDetails({ params }: any) {
  const router = useRouter();
  const { id } = params;
  const [apartment, setApartment] = useState<any>(null);
  const [tenants, setTenants] = useState([]);
  const [showLeaseModal, setShowLeaseModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/apartments?id=${id}`);
      const data = await res.json();
      setApartment(data.apartment);
      setTenants(data.tenants);
    };
    load();
  }, [id]);

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-xl font-semibold">
          {apartment?.building?.name} — {apartment?.label}
        </h1>
      </motion.div>

      <div className="space-y-4">
        {tenants.length === 0 ? (
          <p>No tenant yet.</p>
        ) : (
          tenants.map((tenant: any) => (
            <motion.div
              key={tenant.id}
              whileHover={{ scale: 1.01 }}
              className="p-4 border rounded flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{tenant.email}</p>
                {tenant.lease ? (
                  <p className="text-sm text-green-600">
                    Lease Active — ₹{tenant.lease.rentAmount}/month, due {tenant.lease.dueDate}
                  </p>
                ) : (
                  <p className="text-sm text-yellow-600">No lease assigned</p>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedTenant(tenant);
                  setShowLeaseModal(true);
                }}
                className="px-3 py-2 rounded bg-blue-600 text-white"
              >
                {tenant.lease ? "Edit Lease" : "Assign Lease"}
              </button>
            </motion.div>
          ))
        )}
      </div>

      {showLeaseModal && (
        <LeaseModal
          tenant={selectedTenant}
          apartmentId={id}
          close={() => setShowLeaseModal(false)}
        />
      )}
    </div>
  );
}

function LeaseModal({ tenant, apartmentId, close }: any) {
  const [rent, setRent] = useState(tenant?.lease?.rentAmount || "");
  const [dueDate, setDueDate] = useState(tenant?.lease?.dueDate || "");

  const save = async () => {
    await fetch("/api/leases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: tenant.id,
        apartmentId,
        rentAmount: Number(rent),
        dueDate: Number(dueDate),
      }),
    });
    close();
    window.location.reload();
  };

  return (
    <motion.div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <motion.div className="bg-white rounded-lg p-6 space-y-4 w-80">
        <h2 className="text-lg font-semibold">Lease for {tenant.email}</h2>

        <input value={rent} onChange={(e) => setRent(e.target.value)} type="number"
               placeholder="Rent Amount (₹)" className="border p-2 rounded w-full" />
        <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="number"
               placeholder="Due Date (1–31)" className="border p-2 rounded w-full" />

        <button onClick={save} className="bg-green-600 w-full text-white p-2 rounded">
          Save
        </button>
        <button onClick={close} className="bg-gray-200 w-full p-2 rounded">
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}
