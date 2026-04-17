"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket-client";

export default function ResetOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;

    const socket = getSocket();
    const onReset = () => {
      setVisible(true);
      setCountdown(3);
    };
    socket.on("admin:allReset", onReset);
    return () => { socket.off("admin:allReset", onReset); };
  }, [isAdmin]);

  useEffect(() => {
    if (!visible) return;

    if (countdown <= 0) {
      setVisible(false);
      router.push("/");
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [visible, countdown, router]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-white/85 backdrop-blur-xl"
          style={{ WebkitBackdropFilter: "blur(20px)" }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="text-center px-8"
          >
            <div className="text-6xl mb-4">🔄</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 font-display tracking-tight">
              Workshop reset
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Facilitator cleared all data — returning home...
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-black/[0.04] px-5 py-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm text-gray-600 font-mono">{countdown}s</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
