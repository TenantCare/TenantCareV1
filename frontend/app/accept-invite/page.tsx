"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const acceptInvite = async () => {
    setLoading(true);
    const res = await fetch("/api/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setStatus("Invite accepted! Redirecting...");
      setTimeout(() => router.push("/tenant"), 2000);
    } else {
      setStatus(data.error || "Invalid or expired invite.");
    }
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-xl font-semibold mb-3">Accept Invitation</h1>
      {status ? (
        <p className="text-gray-700">{status}</p>
      ) : (
        <>
          <p className="mb-4">You’ve been invited! Click below to accept.</p>
          <button
            onClick={acceptInvite}
            disabled={loading}
            className="bg-green-600 text-white rounded px-4 py-2"
          >
            {loading ? "Accepting..." : "Accept Invite"}
          </button>
        </>
      )}
    </div>
  );
}
