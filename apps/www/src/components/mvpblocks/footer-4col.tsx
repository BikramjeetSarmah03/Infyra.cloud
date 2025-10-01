import {
  Dribbble,
  Facebook,
  Github,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";
import Link from "next/link";

const data = {
  facebookLink: "https://facebook.com/infyra",
  instaLink: "https://instagram.com/infyra",
  twitterLink: "https://twitter.com/infyra",
  githubLink: "https://github.com/infyra",
  dribbbleLink: "https://dribbble.com/infyra",
  services: {
    deploy: "/deployments",
    storage: "/storage",
    database: "/databases",
    functions: "/functions",
  },
  about: {
    vision: "/our-vision",
    team: "/team",
    blog: "/blog",
    careers: "/careers",
  },
  help: {
    faqs: "/faqs",
    docs: "/docs",
    support: "/support",
  },
  contact: {
    email: "hello@infyra.cloud",
    phone: "+91 9876543210",
    address: "Guwahati, Assam India",
  },
  company: {
    name: "Infyra.cloud",
    description:
      "The India-first multi-cloud deployment platform. One dashboard, all clouds — faster, simpler, and more affordable for developers and enterprises.",
    logo: "/logo_dark.svg",
  },
};

const socialLinks = [
  { icon: Facebook, label: "Facebook", href: data.facebookLink },
  { icon: Instagram, label: "Instagram", href: data.instaLink },
  { icon: Twitter, label: "Twitter", href: data.twitterLink },
  { icon: Github, label: "GitHub", href: data.githubLink },
  { icon: Dribbble, label: "Dribbble", href: data.dribbbleLink },
];

const aboutLinks = [
  { text: "Our Vision", href: data.about.vision },
  { text: "Team", href: data.about.team },
  { text: "Blog", href: data.about.blog },
  { text: "Careers", href: data.about.careers },
];

const serviceLinks = [
  { text: "Deployments", href: data.services.deploy },
  { text: "Storage", href: data.services.storage },
  { text: "Databases", href: data.services.database },
  { text: "Functions", href: data.services.functions },
];

const helpfulLinks = [
  { text: "FAQs", href: data.help.faqs, hasIndicator: false },
  { text: "Docs", href: data.help.docs, hasIndicator: false },
  { text: "Support", href: data.help.support },
];

const contactInfo = [
  { icon: Mail, text: data.contact.email },
  { icon: Phone, text: data.contact.phone },
  { icon: MapPin, text: data.contact.address, isAddress: true },
];

export default function Footer4Col() {
  return (
    <footer className="place-self-end bg-secondary dark:bg-secondary/20 rounded-t-xl w-full">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-6 max-w-screen-xl">
        <div className="gap-8 grid grid-cols-1 lg:grid-cols-3">
          <div>
            <div className="flex justify-center sm:justify-start gap-2 text-primary">
              <img
                src={data.company.logo || "/placeholder.svg"}
                alt="logo"
                className="rounded-full w-8 h-8"
              />
              <span className="font-semibold text-2xl">
                {data.company.name}
              </span>
            </div>

            <p className="mt-6 sm:max-w-xs max-w-md text-foreground/50 sm:text-left text-center leading-relaxed">
              {data.company.description}
            </p>

            <ul className="flex justify-center sm:justify-start gap-6 md:gap-8 mt-8">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <Link
                    prefetch={false}
                    href={href}
                    className="text-primary hover:text-primary/80 transition"
                  >
                    <span className="sr-only">{label}</span>
                    <Icon className="size-6" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="gap-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:col-span-2">
            <div className="sm:text-left text-center">
              <p className="font-medium text-lg">About Us</p>
              <ul className="space-y-4 mt-8 text-sm">
                {aboutLinks.map(({ text, href }) => (
                  <li key={text}>
                    <a
                      className="text-secondary-foreground/70 transition"
                      href={href}
                    >
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sm:text-left text-center">
              <p className="font-medium text-lg">Our Services</p>
              <ul className="space-y-4 mt-8 text-sm">
                {serviceLinks.map(({ text, href }) => (
                  <li key={text}>
                    <a
                      className="text-secondary-foreground/70 transition"
                      href={href}
                    >
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sm:text-left text-center">
              <p className="font-medium text-lg">Helpful Links</p>
              <ul className="space-y-4 mt-8 text-sm">
                {helpfulLinks.map(({ text, href, hasIndicator }) => (
                  <li key={text}>
                    <a
                      href={href}
                      className={`${
                        hasIndicator
                          ? "group flex justify-center gap-1.5 sm:justify-start"
                          : "text-secondary-foreground/70 transition"
                      }`}
                    >
                      <span className="text-secondary-foreground/70 transition">
                        {text}
                      </span>
                      {hasIndicator && (
                        <span className="relative flex size-2">
                          <span className="inline-flex absolute bg-primary opacity-75 rounded-full w-full h-full animate-ping" />
                          <span className="inline-flex relative bg-primary rounded-full size-2" />
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sm:text-left text-center">
              <p className="font-medium text-lg">Contact Us</p>
              <ul className="space-y-4 mt-8 text-sm">
                {contactInfo.map(({ icon: Icon, text, isAddress }) => (
                  <li key={text}>
                    <a
                      className="flex justify-center sm:justify-start items-center gap-1.5"
                      href="/"
                    >
                      <Icon className="shadow-sm size-5 text-primary shrink-0" />
                      {isAddress ? (
                        <address className="flex-1 -mt-0.5 text-secondary-foreground/70 not-italic transition">
                          {text}
                        </address>
                      ) : (
                        <span className="flex-1 text-secondary-foreground/70 transition">
                          {text}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t">
          <div className="sm:flex sm:justify-between sm:text-left text-center">
            <p className="text-sm">
              <span className="block sm:inline">All rights reserved.</span>
            </p>

            <p className="sm:order-first mt-4 sm:mt-0 text-secondary-foreground/70 text-sm transition">
              &copy; 2025 {data.company.name}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
