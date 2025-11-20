"use client";
import { useEffect, useState } from "react";

export default function PaymentHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch("/api/payments/history")
      .then((res) => res.json())
      .then(setHistory);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Payment History</h1>

      {history.map((p: any) => (
        <div key={p.id} className="p-3 border rounded">
          ₹{p.amount} — {new Date(p.createdAt).toDateString()}
        </div>
      ))}
    </div>
  );
}
