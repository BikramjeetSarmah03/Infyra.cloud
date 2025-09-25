"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useId } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Bricolage_Grotesque } from "next/font/google";

import { motion, AnimatePresence } from "motion/react";

import {
  ArrowRight,
  Sparkles,
  ServerIcon,
  RocketIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { Particles } from "@/components/ui/particles";
import { Spotlight } from "@/components/ui/spotlight";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const brico = Bricolage_Grotesque({
  subsets: ["latin"],
});

interface WaitlistPageProps {
  count?: number | null;
}

export default function WaitlistPage({ count }: WaitlistPageProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const [color, setColor] = useState("#ffffff");
  const emailInputId = useId();

  const users = Array.from({ length: 4 }, () => ({
    imgUrl: `https://avatar.iran.liara.run/public/${Math.floor(Math.random() * 88)}`,
  }));

  useEffect(() => {
    setColor(resolvedTheme === "dark" ? "#ffffff" : "#e60a64");
  }, [resolvedTheme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error, status } = await createClient()
        .from("waitlist")
        .insert([{ email }]);

      if (error) {
        if (error.code === "23505") {
          setError("You're already on the waitlist!");
        } else {
          setError("Error while joining waitlist");
        }
      } else if (status === 201 || data) {
        setSubmitted(true);
      }
    } catch {
      setError("Unexpected error while joining waitlist");
    }

    setIsSubmitting(false);
  };

  return (
    <main className="relative flex justify-center items-center w-full xl:h-screen min-h-screen overflow-hidden">
      <Spotlight />

      <Particles
        className="z-0 absolute inset-0"
        quantity={100}
        ease={80}
        refresh
        color={color}
      />

      <div className="z-[100] relative mx-auto px-4 py-16 max-w-2xl text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/15 to-primary/5 backdrop-blur-sm mb-8 px-4 py-2 border border-primary/10 rounded-full"
        >
          <Image
            src="/logo_dark.svg"
            alt="logo"
            className="spin"
            width={24}
            height={24}
          />
          <span className="font-medium text-sm">Infyra.cloud</span>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          >
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className={cn(
            "bg-clip-text bg-gradient-to-b from-foreground via-foreground/80 to-foreground/40 mb-4 font-bold text-transparent text-4xl sm:text-7xl cursor-crosshair",
            brico.className,
          )}
        >
          Join the{" "}
          <span className="bg-primary bg-clip-text dark:bg-gradient-to-b from-foreground via-rose-300 to-primary text-transparent">
            Waitlist
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-2 mb-12 text-muted-foreground sm:text-lg"
        >
          The next evolution of cloud is here with Infyra.
          <br className="hidden sm:block" /> Deploy apps, scale effortlessly,
          and go global — all from India’s own cloud platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="gap-6 grid grid-cols-2 sm:grid-cols-3 mb-12"
        >
          <div
            className={cn(
              "flex flex-col justify-center items-center bg-white/5 backdrop-blur-md p-4 border border-primary/10 rounded-xl",
              resolvedTheme === "dark" ? "glass" : "glass2",
            )}
          >
            <RocketIcon className="mb-2 w-5 h-5 text-primary" />
            <span className="font-bold text-xl">One-Click Deploy</span>
            <span className="text-muted-foreground text-xs">
              Launch apps in seconds
            </span>
          </div>

          <div
            className={cn(
              "flex flex-col justify-center items-center bg-white/5 backdrop-blur-md p-4 border border-primary/10 rounded-xl",
              resolvedTheme === "dark" ? "glass" : "glass2",
            )}
          >
            <ServerIcon className="mb-2 w-5 h-5 text-primary" />
            <span className="font-bold text-xl">Global Edge</span>
            <span className="text-muted-foreground text-xs">
              Speed, scale & reliability
            </span>
          </div>

          <div
            className={cn(
              "flex flex-col justify-center items-center bg-white/5 backdrop-blur-md p-4 border border-primary/10 rounded-xl",
              resolvedTheme === "dark" ? "glass" : "glass2",
            )}
          >
            <ShieldCheckIcon className="mb-2 w-5 h-5 text-primary" />
            <span className="font-bold text-xl">Built for India</span>
            <span className="text-muted-foreground text-xs">
              Local pricing, dev-first
            </span>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          onSubmit={handleSubmit}
          className="flex sm:flex-row flex-col gap-4 mx-auto"
        >
          <AnimatePresence mode="wait">
            {!submitted ? (
              <>
                <div className="relative flex-1">
                  <motion.input
                    key="email-input"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(e.target.value)
                    }
                    id={emailInputId}
                    required
                    className="bg-white/5 backdrop-blur-md px-6 py-4 border border-primary/20 focus:border-primary/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 w-full text-foreground placeholder:text-muted-foreground/70 transition-all"
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="sm:absolute bg-destructive/10 mt-2 px-4 py-1 border border-destructive/40 rounded-xl text-destructive text-sm"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || submitted}
                  className="group relative bg-gradient-to-b from-rose-500 to-rose-700 disabled:opacity-50 shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] px-8 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 overflow-hidden font-semibold text-primary-foreground active:scale-95 transition-all duration-300 disabled:cursor-not-allowed"
                >
                  <span className="z-10 relative flex justify-center items-center gap-2">
                    {isSubmitting ? "Joining..." : "Join Waitlist"}
                    <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-all duration-300" />
                  </span>
                  <span className="z-0 absolute inset-0 bg-gradient-to-r from-rose-500 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </>
            ) : (
              <motion.div
                key="thank-you-message"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6 }}
                className={cn(
                  "flex-1 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] backdrop-blur-md active:brightness-125 px-6 py-4 border border-primary/20 rounded-xl font-medium text-primary transition-all duration-300 cursor-pointer",
                  resolvedTheme === "dark" ? "glass" : "glass2",
                )}
              >
                <span className="flex justify-center items-center gap-2">
                  Thanks for joining!{" "}
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="flex justify-center items-center gap-1 mt-14"
        >
          <div className="flex -space-x-3">
            {/* {users.map((user, i) => ( */}
            {users
              ? users.map((user, i) => (
                  <motion.div
                    key={i.toString()}
                    initial={{ scale: 0, x: -10 }}
                    animate={{ scale: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1 + i * 0.2 }}
                    className="bg-gradient-to-r from-primary to-rose-500 p-[2px] border-2 border-background rounded-full size-10"
                  >
                    <div className="relative rounded-full overflow-hidden">
                      <Image
                        src={user.imgUrl}
                        alt="Avatar"
                        className="rounded-full hover:rotate-6 hover:scale-110 transition-all duration-300"
                        width={40}
                        height={40}
                      />
                    </div>
                  </motion.div>
                ))
              : null}
          </div>
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1.3 }}
            className="ml-2 text-muted-foreground"
          >
            <span className="font-semibold text-primary">
              {(count || 0) > 5 ? count : 5}+
            </span>{" "}
            already joined ✨
          </motion.span>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
      `}</style>
    </main>
  );
}
