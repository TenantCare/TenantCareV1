"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type Toast = { id: string; type: "success" | "error" | "info"; title?: string; message: string };

const ToastContext = createContext<{
    notify: (t: Toast) => void;
    success: (msg: string, title?: string) => void;
    error: (msg: string, title?: string) => void;
    info: (msg: string, title?: string) => void;
} | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const remove = useCallback((id: string) => {
        setToasts((s) => s.filter((t) => t.id !== id));
    }, []);

    const notify = useCallback((t: Toast) => {
        setToasts((s) => [t, ...s]);
        // auto remove
        setTimeout(() => remove(t.id), 4500);
    }, [remove]);

    const success = useCallback((message: string, title?: string) => notify({ id: String(Date.now() + Math.random()), type: "success", title, message }), [notify]);
    const error = useCallback((message: string, title?: string) => notify({ id: String(Date.now() + Math.random()), type: "error", title, message }), [notify]);
    const info = useCallback((message: string, title?: string) => notify({ id: String(Date.now() + Math.random()), type: "info", title, message }), [notify]);

    return (
        <ToastContext.Provider value={{ notify, success, error, info }}>
            {children}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`max-w-sm w-full shadow-lg rounded-lg p-3 text-sm flex items-start gap-3 border ${t.type === "success" ? "bg-green-50 border-green-200" : t.type === "error" ? "bg-red-50 border-red-200" : "bg-white border-gray-200"
                            }`}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            {t.type === "success" ? (
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 13.5L4.5 10l1-1L8 11.5 14.5 5l1 1L8 13.5z" fill="#059669" /></svg>
                            ) : t.type === "error" ? (
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 1.667A8.333 8.333 0 1010 18.333 8.333 8.333 0 0010 1.667zm0 12.5a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm0-6.25a.833.833 0 01.833.833v3.333A.833.833 0 0110 12.5a.833.833 0 01-.833-.833V8.75A.833.833 0 0110 7.917z" fill="#DC2626" /></svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm.833 11.667h-1.667v-1.667h1.667v1.667zm0-3.334h-1.667V5.833h1.667v4.5z" fill="#374151" /></svg>
                            )}
                        </div>
                        <div className="flex-1">
                            {t.title && <div className="font-semibold text-sm text-gray-800">{t.title}</div>}
                            <div className="text-gray-700">{t.message}</div>
                        </div>
                        <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600 ml-2">×</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within a ToastProvider");
    return ctx;
};

export default ToastProvider;
