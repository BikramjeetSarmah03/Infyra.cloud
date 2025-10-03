"use client";

import { cn } from "@/lib/utils";
import createGlobe from "cobe";
import { useEffect, useRef } from "react";

export default function FeaturesSectionDemo() {
  const features = [
    {
      title: "Deploy anywhere in seconds",
      description:
        "Choose AWS, GCP, Cloudflare, or our own platform. With one-click deploy, your apps go live globally in seconds.",
      skeleton: <SkeletonOne />,
      className:
        "col-span-1 lg:col-span-4 border-b lg:border-r dark:border-neutral-800",
    },
    {
      title: "Instant GitHub Integration",
      description:
        "Connect your repo, push code, and watch it go live. No configs, no headaches — just smooth workflows.",
      skeleton: <SkeletonTwo />,
      className: "border-b col-span-1 lg:col-span-2 dark:border-neutral-800",
    },
    {
      title: "Built for developers, not billing",
      description:
        "Generous free tier, predictable pricing, and zero hidden costs. Focus on building — not calculating cloud bills.",
      skeleton: <SkeletonThree />,
      className:
        "col-span-1 border-b md:border-b-0 lg:col-span-3 lg:border-r dark:border-neutral-800",
    },
    {
      title: "Edge-powered performance",
      description:
        "Ultra-low latency with edge deployments. Your users experience lightning-fast load times, no matter where they are.",
      skeleton: <SkeletonFour />,
      className: "col-span-1 lg:col-span-3 border-b lg:border-none",
    },
  ];

  return (
    <div className="z-20 relative mx-auto py-10 lg:py-40 max-w-7xl">
      <div className="px-8">
        <h4 className="mx-auto max-w-5xl font-medium text-black dark:text-white text-3xl lg:text-5xl text-center lg:leading-tight tracking-tight">
          Packed with thousands of features
        </h4>

        <p className="mx-auto my-4 max-w-2xl font-normal text-neutral-500 dark:text-neutral-300 text-sm lg:text-base text-center">
          From Image generation to video generation, Everything AI has APIs for
          literally everything. It can even create this website copy for you.
        </p>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-6 mt-12 xl:border dark:border-neutral-800 rounded-md">
          {features.map((feature) => (
            <FeatureCard key={feature.title} className={feature.className}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="w-full h-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("relative p-4 sm:p-8 overflow-hidden", className)}>
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="mx-auto max-w-5xl text-black dark:text-white text-xl md:text-2xl text-left md:leading-snug tracking-tight">
      {children}
    </p>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p
      className={cn(
        "mx-auto max-w-4xl text-sm md:text-base text-left",
        "text-neutral-500 text-center font-normal dark:text-neutral-300",
        "text-left max-w-sm mx-0 md:text-sm my-2"
      )}
    >
      {children}
    </p>
  );
};

export const SkeletonOne = () => {
  return (
    <div className="relative flex gap-10 px-2 py-8 h-full">
      <div className="group bg-white dark:bg-neutral-900 shadow-2xl mx-auto p-5 w-full h-full">
        <div className="flex flex-col flex-1 space-y-2 w-full h-20">
          {/* TODO */}
          <img
            src="/assets/deploy.png"
            alt="header"
            className="rounded-sm w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="bottom-0 z-40 absolute inset-x-0 bg-gradient-to-t from-white dark:from-black via-white dark:via-black to-transparent w-full h-60 pointer-events-none" />
      <div className="top-0 z-40 absolute inset-x-0 bg-gradient-to-b from-white dark:from-black via-transparent to-transparent w-full h-60 pointer-events-none" />
    </div>
  );
};

export const SkeletonTwo = () => {
  return (
    <a
      href="https://www.youtube.com/watch?v=RPa3_AD1_Vs"
      target="__blank"
      className="group/image relative flex gap-10 h-full"
    >
      <div className="group bg-transparent dark:bg-transparent mx-auto w-full h-full">
        <div className="relative flex flex-col flex-1 space-y-2 w-full h-40">
          <img
            src="/assets/github.jpeg"
            alt="header"
            width={800}
            height={800}
            className="rounded-sm w-full h-full object-center object-cover aspect-square transition-all duration-200"
          />
        </div>
      </div>
    </a>
  );
};

export const SkeletonThree = () => {
  return (
    <div className="relative flex flex-col items-start gap-10 p-8 md:h-[32rem] overflow-hidden">
      <div className="flex flex-row">
        <img
          src={"/assets/developer.png"}
          alt="bali images"
          width="500"
          height="500"
          className="rounded-lg size-full object-cover"
        />
      </div>

      <div className="left-0 z-[100] absolute inset-y-0 bg-gradient-to-r from-white dark:from-black to-transparent w-20 h-full pointer-events-none" />
      <div className="right-0 z-[100] absolute inset-y-0 bg-gradient-to-l from-white dark:from-black to-transparent w-20 h-full pointer-events-none" />
    </div>
  );
};

export const SkeletonFour = () => {
  return (
    <div className="relative flex flex-col items-center bg-transparent dark:bg-transparent mt-10 h-60 md:h-60">
      <Globe className="-right-10 md:-right-10 -bottom-80 md:-bottom-72 absolute" />
    </div>
  );
};

export const Globe = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        // longitude latitude
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 },
      ],
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.
        state.phi = phi;
        phi += 0.01;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 600, height: 600, maxWidth: "100%", aspectRatio: 1 }}
      className={className}
    />
  );
};
