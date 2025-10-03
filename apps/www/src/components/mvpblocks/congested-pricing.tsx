"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";

// Define your plans
const plans: PricingPlan[] = [
  {
    name: "FREE",
    price: "0",
    yearlyPrice: "0",
    period: "per month",
    features: [
      "Up to 3 projects",
      "500,000 requests/month",
      "5 GB storage",
      "Basic analytics",
      "Shared compute",
      "Community support",
    ],
    description: "Perfect for hobby projects, students & personal apps.",
    buttonText: "Start Free",
    href: "/sign-up",
    isPopular: false,
  },
  {
    name: "PAY AS YOU GO",
    price: "799",
    yearlyPrice: "599", // no yearly discount, true usage-based
    period: "month",
    features: [
      "Unlimited projects",
      "10M requests included / month",
      "100 GB storage included",
      "Advanced analytics & monitoring",
      "Scale apps, DBs, storage",
      "Email & chat support",
      "Usage-based billing beyond limits",
    ],
    description:
      "Generous limits. Only pay when you actually grow. Ideal for indie devs & startups.",
    buttonText: "Get Started",
    href: "/sign-up",
    isPopular: true,
  },
  {
    name: "ENTERPRISE",
    price: "Custom",
    yearlyPrice: "Custom",
    period: "per contract",
    features: [
      "Everything in Pay-as-you-go",
      "Unlimited scale",
      "Dedicated infrastructure",
      "Private networking",
      "Custom SLAs & uptime guarantees",
      "Dedicated support engineer",
      "Custom billing & compliance",
    ],
    description:
      "Tailored solutions for large-scale businesses with compliance needs.",
    buttonText: "Contact Sales",
    href: "/contact",
    isPopular: false,
  },
];

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
}

export default function CongestedPricing() {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: [
          "hsl(var(--primary))",
          "hsl(var(--accent))",
          "hsl(var(--secondary))",
          "hsl(var(--muted))",
        ],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  return (
    <div className="mx-auto py-20 container">
      <div className="space-y-4 mb-12 text-center">
        <h2 className="font-bold text-4xl sm:text-5xl tracking-tight">
          Simple, transparent pricing for all.
        </h2>
        <p className="text-muted-foreground text-lg whitespace-pre-line">
          Choose the plan that works for you\nAll plans include access to our
          platform, lead generation tools, and dedicated support.
        </p>
      </div>

      <div className="flex justify-center mb-10">
        {/** biome-ignore lint/a11y/noLabelWithoutControl: <ok> */}
        <label className="inline-flex relative items-center cursor-pointer">
          <Label>
            <Switch
              ref={switchRef}
              checked={!isMonthly}
              onCheckedChange={handleToggle}
              className="relative"
            />
          </Label>
        </label>
        <span className="ml-2 font-semibold">
          Annual billing <span className="text-primary">(Save 20%)</span>
        </span>
      </div>

      <div className="gap-4 grid grid-cols-1 md:grid-cols-3 sm:2">
        {plans.map((plan, index) => {
          const isCustom = isNaN(
            Number(isMonthly ? plan.price : plan.yearlyPrice)
          );

          return (
            <motion.div
              key={index.toString()}
              initial={{ y: 50, opacity: 1 }}
              whileInView={
                isDesktop
                  ? {
                      y: plan.isPopular ? -20 : 0,
                      opacity: 1,
                      x: index === 2 ? -30 : index === 0 ? 30 : 0,
                      scale: index === 0 || index === 2 ? 0.94 : 1.0,
                    }
                  : {}
              }
              viewport={{ once: true }}
              transition={{
                duration: 1.6,
                type: "spring",
                stiffness: 100,
                damping: 30,
                delay: 0.4,
                opacity: { duration: 0.5 },
              }}
              className={cn(
                "relative lg:flex lg:flex-col lg:justify-center bg-background p-6 border-[1px] rounded-2xl text-center",
                plan.isPopular ? "border-primary border-2" : "border-border",
                "flex flex-col",
                !plan.isPopular && "mt-5",
                index === 0 || index === 2
                  ? "z-0 translate-x-0 translate-y-0 -translate-z-[50px] rotate-y-[10deg] transform"
                  : "z-10",
                index === 0 && "origin-right",
                index === 2 && "origin-left"
              )}
            >
              {plan.isPopular && (
                <div className="top-0 right-0 absolute flex items-center bg-primary px-2 py-0.5 rounded-tr-xl rounded-bl-xl">
                  <Star className="fill-current w-4 h-4 text-primary-foreground" />
                  <span className="ml-1 font-sans font-semibold text-primary-foreground">
                    Popular
                  </span>
                </div>
              )}

              <div className="flex flex-col flex-1">
                {/* Plan Name */}
                <p className="font-semibold text-muted-foreground text-base">
                  {plan.name}
                </p>

                {/* Price Section */}
                <div className="flex justify-center items-center gap-x-2 mt-6">
                  {isCustom ? (
                    <span className="font-bold text-foreground text-3xl tracking-tight">
                      Contact Us
                    </span>
                  ) : (
                    <>
                      <span className="font-bold text-foreground text-5xl tracking-tight">
                        <NumberFlow
                          value={
                            isMonthly
                              ? Number(plan.price)
                              : Number(plan.yearlyPrice)
                          }
                          format={{
                            style: "currency",
                            currency: "INR",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }}
                          transformTiming={{
                            duration: 500,
                            easing: "ease-out",
                          }}
                          willChange
                          className="font-variant-numeric: tabular-nums"
                        />
                      </span>
                      {plan.period !== "Next 3 months" && (
                        <span className="font-semibold text-muted-foreground text-sm leading-6 tracking-wide">
                          / {plan.period}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Billing Info */}
                {!isCustom && (
                  <p className="text-muted-foreground text-xs leading-5">
                    {isMonthly ? "billed monthly" : "billed annually"}
                  </p>
                )}

                {/* Features */}
                <ul className="flex flex-col gap-2 mt-5">
                  {plan.features.map((feature, idx) => (
                    <li key={idx.toString()} className="flex items-start gap-2">
                      <Check className="flex-shrink-0 mt-1 w-4 h-4 text-primary" />
                      <span className="text-left">{feature}</span>
                    </li>
                  ))}
                </ul>

                <hr className="my-4 w-full" />

                {/* CTA Button */}
                <Link
                  prefetch={false}
                  href={plan.href}
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                    }),
                    "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                    "hover:bg-primary hover:text-primary-foreground hover:ring-primary transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-offset-1",
                    plan.isPopular
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground"
                  )}
                >
                  {plan.buttonText}
                </Link>

                {/* Description */}
                <p className="mt-6 text-muted-foreground text-xs leading-5">
                  {plan.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
