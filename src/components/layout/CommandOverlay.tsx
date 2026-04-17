"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCommandListener } from "@/hooks/useSocket";
import { stages } from "@/lib/workshop-data";
import type { AdminCommand } from "@/lib/types";

export default function CommandOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isPresenter = pathname.startsWith("/presenter");
  const isAccess = pathname === "/access";

  const [navLabel, setNavLabel] = useState<string | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCommand = useCallback(
    (cmd: AdminCommand) => {
      if (isAdmin || isPresenter || isAccess) return;

      switch (cmd.type) {
        case "navigate": {
          setNavLabel(cmd.label);
          navTimerRef.current = setTimeout(() => {
            router.push(cmd.route);
            setTimeout(() => setNavLabel(null), 400);
          }, 1200);
          break;
        }
        case "playVideo": {
          const stage = stages.find((s) => s.id === cmd.stageId);
          if (stage?.videoUrl) {
            setVideoSrc(stage.videoUrl);
          }
          break;
        }
        case "stopVideo": {
          setVideoSrc(null);
          break;
        }
      }
    },
    [isAdmin, isPresenter, isAccess, router]
  );

  useCommandListener(handleCommand);

  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (videoSrc && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [videoSrc]);

  const dismissVideo = useCallback(() => setVideoSrc(null), []);

  return (
    <>
      <AnimatePresence>
        {navLabel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-white/80 backdrop-blur-xl"
            style={{ WebkitBackdropFilter: "blur(20px)" }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="text-center px-8"
            >
              <div className="text-5xl mb-4">🎯</div>
              <p className="text-lg font-bold text-gray-900 mb-2 font-display">
                {navLabel}
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-black/[0.04] px-5 py-2 mt-2">
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-sm text-gray-500">Redirecting...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {videoSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[210] flex items-center justify-center bg-black"
          >
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-contain"
              controls
              autoPlay
              playsInline
              onEnded={dismissVideo}
            />
            <button
              onClick={dismissVideo}
              className="absolute top-4 right-4 rounded-full bg-black/40 backdrop-blur-md px-4 py-2 text-sm font-medium text-white hover:bg-black/60 transition-all z-10"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
