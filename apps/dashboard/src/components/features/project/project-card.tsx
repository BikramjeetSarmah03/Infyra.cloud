import { EllipsisVerticalIcon, GitBranchIcon, StarIcon } from "lucide-react";
import { FaGithub } from "react-icons/fa";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@tanstack/react-router";

export default function ProjectCard() {
  const git = true;

  return (
    <Link
      to="/$project"
      params={{
        project: "1212",
      }}
      className="space-y-6 bg-muted p-4 border hover:border-primary/50 rounded-md text-sm transition-all duration-300 cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="bg-sidebar/40 border rounded-full size-10" />

          <div>
            <h1 className="hover:underline">Inventory Management System</h1>

            <h2 className="text-muted-foreground text-xs hover:underline">
              ims.infyra.cloud
            </h2>
          </div>
        </div>

        <ProjectDropdown />
      </div>

      {git ? (
        <div className="space-y-2">
          <Badge
            variant={"outline"}
            className="-ml-1 hover:underline cursor-pointer"
          >
            <FaGithub />
            BikramjeetSarmah03/infyra...
          </Badge>

          <p className="text-xs hover:underline cursor-pointer">new commit</p>

          <p className="flex gap-1 text-muted-foreground text-xs">
            <Tooltip>
              <TooltipTrigger className="cursor-pointer">
                <span>Aug 20 on</span>
              </TooltipTrigger>
              <TooltipContent
                align="start"
                className="space-y-2 bg-sidebar pt-3 border w-72"
                arrowClassName="bg-sidebar fill-sidebar mt-2 border-b shadow-lg"
              >
                <p className="text-muted-foreground">
                  16 hours, 50 minutes, 23 seconds ago
                </p>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <h2 className="bg-muted p-1 text-[10px]">UTC</h2>
                    <h1>Sept 10, 2025</h1>
                  </div>

                  <h3 className="text-[10px] text-muted-foreground">
                    07:17:42 PM
                  </h3>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <h2 className="bg-muted p-1 text-[10px]">GMT +5:30</h2>
                    <h1>Sept 10, 2025</h1>
                  </div>

                  <h3 className="text-[10px] text-muted-foreground">
                    07:17:42 PM
                  </h3>
                </div>
              </TooltipContent>
            </Tooltip>
            <GitBranchIcon size={14} />
            <span>main</span>
          </p>
        </div>
      ) : (
        <div>
          <h1 className="text-blue-400">Connect Git Repository</h1>
          <p className="text-muted-foreground text-xs">5th Sept 2025</p>
        </div>
      )}
    </Link>
  );
}

function ProjectDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer">
        <EllipsisVerticalIcon className="rotate-90" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="space-y-2 shadow px-2 py-3 w-48"
        align="end"
      >
        <DropdownMenuItem className="flex justify-between items-center">
          <span>Add Favorite</span>

          <StarIcon />
        </DropdownMenuItem>
        <DropdownMenuItem>View Logs</DropdownMenuItem>
        <DropdownMenuItem>Manage Domains</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
