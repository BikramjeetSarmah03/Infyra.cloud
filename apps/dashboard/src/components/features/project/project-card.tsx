import {
  AppWindowIcon,
  DatabaseIcon,
  EllipsisVerticalIcon,
  FolderIcon,
  GitBranchIcon,
  StarIcon,
} from "lucide-react";
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
      to="/projects/$project"
      params={{
        project: "1212",
      }}
      className="bg-muted border hover:border-primary/50 rounded-md divide-y text-sm transition-all duration-300 cursor-pointer"
    >
      <div className="flex justify-between items-start p-4">
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

      <div className="grid grid-cols-3 divide-x">
        <StatsCard title="Apps" />
        <StatsCard title="DB" />
        <StatsCard title="Buckets" />
      </div>

      {git ? (
        <GitConnected />
      ) : (
        <div className="p-4">
          <h1 className="text-blue-400">Connect Git Repository</h1>
          <p className="text-muted-foreground text-xs">5th Sept 2025</p>
        </div>
      )}
    </Link>
  );
}

function GitConnected() {
  return (
    <div className="space-y-2 p-4">
      <Badge
        variant={"outline"}
        className="-ml-1 hover:underline cursor-pointer"
      >
        <FaGithub />
        BikramjeetSarmah03/infyra...
      </Badge>

      <div className="flex items-center gap-2">
        <p className="text-xs hover:underline cursor-pointer">new commit</p>

        <p className="flex gap-1 text-muted-foreground text-xs">
          <Tooltip>
            <TooltipTrigger className="cursor-pointer">
              <span>Aug 20 on</span>
            </TooltipTrigger>
            <TooltipContent
              align="start"
              className="space-y-2 bg-sidebar pt-3 border w-72"
              arrowClassName="bg-sidebar fill-sidebar mt-2  shadow-lg"
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
    </div>
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

function StatsCard({ title }: { title: string }) {
  const value = Math.floor(Math.random() * 3);

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <h1 className="font-medium">{title} :</h1>

      <Tooltip>
        <TooltipTrigger className="cursor-pointer">
          <h3 className="font-semibold text-primary text-base">{value}</h3>
        </TooltipTrigger>
        <TooltipContent
          align="start"
          className="bg-sidebar p-0 pb-0 border divide-y w-72"
          arrowClassName="bg-sidebar fill-sidebar ml-0.5 shadow-lg"
        >
          {value === 0 ? (
            <div className="flex flex-col justify-center items-center gap-2 px-4 py-6 text-center">
              <div className="bg-muted p-3 rounded-full">
                {title === "App" ? (
                  <AppWindowIcon className="w-5 h-5 text-muted-foreground" />
                ) : title === "Database" ? (
                  <DatabaseIcon className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <FolderIcon className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              <p className="font-medium text-muted-foreground text-sm">
                No {title} created yet
              </p>
              <p className="text-muted-foreground/70 text-xs">
                Click “+ New {title}” to get started.
              </p>
            </div>
          ) : (
            Array.from({ length: value }).map((_, i) => {
              let type: "app" | "bucket" | "db";

              if (i % 3 === 1) type = "bucket";
              else if (i % 2 === 0) type = "app";
              else type = "db";

              return (
                <AppsCreatedCard
                  key={i.toString()}
                  type={type}
                  name={`${type}-${i + 1}`}
                  status={i % 2 === 0 ? "running" : "paused"}
                />
              );
            })
          )}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

import { Database, AppWindow, FolderOpen } from "lucide-react";

type AppsCreatedCardProps = {
  type: "app" | "db" | "bucket";
  name: string;
  status?: "running" | "paused" | "error";
  url?: string;
};

export function AppsCreatedCard({
  type,
  name,
  status = "running",
  url,
}: AppsCreatedCardProps) {
  const iconMap = {
    app: <AppWindow className="w-5 h-5 text-primary" />,
    db: <Database className="w-5 h-5 text-primary" />,
    bucket: <FolderOpen className="w-5 h-5 text-primary" />,
  };

  const statusColor =
    status === "running"
      ? "text-green-500"
      : status === "paused"
        ? "text-yellow-500"
        : "text-red-500";

  return (
    <div className="space-y-2 p-4 transition-colors duration-200 cursor-pointer">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-muted p-2 rounded-full">{iconMap[type]}</div>
          <h1 className="font-medium">{name}</h1>
        </div>
        <span className={`text-xs font-medium  capitalize ${statusColor}`}>
          {status}
        </span>
      </div>

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground text-xs hover:underline"
        >
          {url}
        </a>
      )}
    </div>
  );
}
