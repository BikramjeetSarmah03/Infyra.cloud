import { Separator } from "@radix-ui/react-separator";
import { BellIcon } from "lucide-react";

import QuickDeploy from "@/components/features/deploy/quick-deploy";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { HeaderBreadcrumb } from "./header-breadcrumb";

export function Header() {
  return (
    <header className="top-0 z-[100] sticky flex justify-between items-center gap-2 bg-[#1a1a1f] py-3 pr-4 border-b shrink-0">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-4"
        />

        <HeaderBreadcrumb />
      </div>

      <div className="flex items-center gap-4">
        <div>
          <BellIcon />
        </div>

        <QuickDeploy />
      </div>
    </header>
  );
}
