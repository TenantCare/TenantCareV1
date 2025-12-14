"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

const StatCard = ({
  title,
  value,
  gradient,
}: {
  title: string;
  value: number | string;
  gradient: string;
}) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`p-6 rounded-xl shadow-sm bg-gradient-to-br ${gradient} border border-gray-200`}
  >
    <p className="text-sm text-gray-600">{title}</p>
    <p className="text-3xl font-extrabold mt-2">
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </p>
  </motion.div>
);

export default function TenantDashboardPage() {
  const { data: session } = useSession();
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<string>("NETBANK");
  const [uploadReference, setUploadReference] = useState<string>("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/tenant");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading)
    return (
      <div className="text-center mt-20 animate-pulse text-gray-600 text-lg">
        Loading dashboard…
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="bg-white rounded-2xl shadow-lg p-8 max-w-6xl mx-auto"
    >
      <h1 className="text-3xl font-semibold mb-8">
        Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        👋
      </h1>

      {/* User Profile */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45 }}
        className="flex items-center gap-5 mb-10"
      >
        <div className="w-20 h-20 rounded-full overflow-hidden shadow ring-2 ring-gray-200">
          {session?.user?.image ? (
            <Image src={session.user.image} alt="Profile" width={80} height={80} />
          ) : (
            <div className="w-full h-full bg-gray-300" />
          )}
        </div>
        <div>
          <p className="text-xl font-semibold">{session?.user?.name}</p>
          <p className="text-gray-500">{session?.user?.email}</p>
          {data?.building && data?.apartment && (
            <p className="text-gray-600 text-sm mt-1">
              📍 {data.apartment}, {data.building}
            </p>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Leases" value={data?.activeLeases ?? 0} gradient="from-green-50 to-white" />
        <StatCard title="Payments Due" value={`₹${data?.paymentsDue ?? 0}`} gradient="from-blue-50 to-white" />
        <StatCard title="Pending Messages" value={data?.pendingMessages ?? 0} gradient="from-yellow-50 to-white" />
        <StatCard title="Support Tickets" value={data?.tickets ?? 0} gradient="from-purple-50 to-white" />
      </div>

      {/* RENT PAYMENT SECTION */}
      {data?.lease && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-12 p-6 border rounded-xl bg-gradient-to-br from-white to-green-50 shadow-sm"
        >
          <h2 className="text-2xl font-semibold mb-4">Your Rent</h2>

          <p className="text-gray-700">
            <span className="font-medium">Apartment:</span> {data.lease.apartment.label}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Monthly Rent:</span> ₹{data.lease.rentAmount}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Due Every:</span> {data.lease.dueDate}
          </p>

          {/* No Pay Rent Now button, only upload proof */}

          {/* Upload payment proof */}
          <div className="mt-4 border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">Upload payment proof (screenshot / cheque)</p>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
              className="mb-2"
            />
            <div className="flex gap-2 items-center">
              <select value={uploadMethod} onChange={(e) => setUploadMethod(e.target.value)} className="border rounded p-1">
                <option value="NETBANK">Netbanking</option>
                <option value="CHEQUE">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="OTHER">Other</option>
              </select>
              <input value={uploadReference} onChange={(e) => setUploadReference(e.target.value)} placeholder="Reference / Cheque no" className="border rounded p-1 flex-1" />
              <button
                onClick={async () => {
                  if (!selectedFile) return toast.error("Choose a file first");
                  setUploading(true);
                  try {
                    const toBase64 = (file: File) => new Promise<string>((res, rej) => {
                      const reader = new FileReader();
                      reader.onload = () => res((reader.result as string).split(',')[1]);
                      reader.onerror = rej;
                      reader.readAsDataURL(file);
                    });
                    const fileBase64 = await toBase64(selectedFile);

                    // Create an unconfirmed payment (confirmed: false) so it doesn't count towards due until owner approves
                    const payRes = await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: data.lease.rentAmount, confirmed: false }) });
                    const payJson = await payRes.json();
                    const paymentId = payJson?.payment?.id;
                    if (!paymentId) throw new Error("Failed to create payment");

                    const attachRes = await fetch(`/api/payments/${paymentId}/attachments`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ fileName: selectedFile.name, fileBase64, method: uploadMethod, reference: uploadReference }),
                    });
                    const attachJson = await attachRes.json();
                    if (attachJson?.success) {
                      toast.success("Upload successful. Awaiting owner approval.");
                      setSelectedFile(null);
                      setUploadReference("");
                    } else {
                      console.error(attachJson);
                      toast.error("Upload failed");
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error("Upload failed");
                  } finally {
                    setUploading(false);
                  }
                }}
                disabled={uploading}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                {uploading ? "Uploading..." : "Upload Proof"}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {!data?.lease && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 p-5 border rounded-xl bg-yellow-50 text-yellow-900 text-center"
        >
          No lease assigned yet. Contact building owner.
        </motion.div>
      )}


      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-10 text-gray-500 text-sm"
      >
        Tenant Dashboard · Last Synced Just Now
      </motion.div>
    </motion.div>
  );
}
