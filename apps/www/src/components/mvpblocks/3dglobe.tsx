"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";

export default function Globe3D() {
  return (
    <section
      className="relative bg-[#0a0613] pt-32 md:pt-20 pb-10 md:pb-16 w-full overflow-hidden font-light text-white antialiased"
      style={{
        background: "linear-gradient(135deg, #220101 0%, #080202 100%)",
      }}
    >
      <div
        className="top-0 right-0 absolute w-1/2 h-1/2"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, rgba(155, 135, 245, 0.15) 0%, rgba(13, 10, 25, 0) 60%)",
        }}
      />
      <div
        className="top-0 left-0 absolute w-1/2 h-1/2 -scale-x-100"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, rgba(155, 135, 245, 0.15) 0%, rgba(13, 10, 25, 0) 60%)",
        }}
      />

      <div className="z-10 relative mx-auto px-4 md:px-6 max-w-2xl md:max-w-4xl lg:max-w-7xl text-center container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-block mb-6 px-3 py-1 border border-[#ff2157]/30 rounded-full text-[#ff2157] text-xs">
            NEXT GENERATION OF CLOUD DEPLOYMENT
          </span>
          <h1 className="mx-auto mb-6 max-w-4xl font-light text-4xl md:text-5xl lg:text-7xl">
            Deploy Faster with{" "}
            <span className="text-[#ff2157]">Multi-Cloud Freedom</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-white/60 text-lg md:text-xl">
            Infyra.cloud brings simplicity to AWS, GCP, and beyond — manage
            apps, databases, and storage from one unified dashboard. One-click
            deploys, Git integration, and enterprise-grade scaling without the
            complexity.
          </p>

          <div className="flex sm:flex-row flex-col justify-center items-center gap-4 mb-10 sm:mb-0">
            <Link
              prefetch={false}
              href="/docs/get-started"
              className="relative bg-gradient-to-b group from-primary/10 to-primary/5 shadow-lg hover:shadow-[0_0_20px_rgba(155, px-8 py-4 border border-white/10 hover:border-[#ff2157]/30 rounded-full w-full sm:w-auto overflow-hidden text-white transition-all duration-300 neumorphic-button 135, 245, 0.5)] flex items-center gap-2"
            >
              Get Started Free
              <ArrowRightIcon
                size={18}
                className="group-hover:ml-2 transition-all duration-300"
              />
            </Link>
          </div>
        </motion.div>
        <motion.div
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        >
          <div className="relative flex w-full h-40 md:h-64 overflow-hidden">
            <Image
              src="/assets/earth.webp"
              alt="Earth"
              className="top-0 left-1/2 -z-10 absolute opacity-80 mx-auto px-4 -translate-x-1/2"
              width={1000}
              height={100}
            />
          </div>
          <div className="z-10 relative shadow-[0_0_50px_rgba(155,135,245,0.2)] mx-auto rounded-lg max-w-5xl overflow-hidden">
            <Image
              src="/assets/dashboard.jpeg"
              alt="Lunexa Dashboard"
              width={1920}
              height={1080}
              className="border border-white/10 rounded-lg w-full h-auto"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
