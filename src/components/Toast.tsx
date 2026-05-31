"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

interface ToastProps {
  message: string;
  onDone: () => void;
}

export function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 300); }, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300
      ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
      <div className="flex items-center gap-2 bg-stone-800 text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium whitespace-nowrap">
        <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
        {message}
      </div>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const show = (msg: string) => setToast(msg);
  const clear = () => setToast(null);
  return { toast, show, clear };
}
