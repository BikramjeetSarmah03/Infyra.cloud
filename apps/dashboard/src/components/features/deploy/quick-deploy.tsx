import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  ChevronDownIcon,
  FolderIcon,
  GitBranchIcon,
  GitlabIcon,
  GlobeIcon,
  PlusIcon,
} from "lucide-react";

import QuickDeployDialog from "./quick-deploy-dialog";

export type IDeployTypes =
  | ""
  | "github"
  | "gitlab"
  | "folder"
  | "template"
  | "project";

export default function QuickDeploy() {
  const [dialog, setDialog] = useState<{ type: IDeployTypes; open: boolean }>({
    type: "",
    open: false,
  });

  const toggleOpen = () =>
    setDialog({
      type: "",
      open: false,
    });

  const handleOpenDialog = (type: IDeployTypes) => {
    setDialog({
      type,
      open: true,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size={"sm"} className="cursor-pointer">
            <PlusIcon />
            Quick Actions
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>Deploy Options</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem>
            <GitBranchIcon className="mr-2 w-4 h-4" />
            Deploy from GitHub
          </DropdownMenuItem>

          <DropdownMenuItem>
            <GitlabIcon className="mr-2 w-4 h-4" />
            Deploy from GitLab
          </DropdownMenuItem>

          <DropdownMenuItem>
            <FolderIcon className="mr-2 w-4 h-4" />
            Deploy Local Folder
          </DropdownMenuItem>

          <DropdownMenuItem>
            <GlobeIcon className="mr-2 w-4 h-4" />
            Deploy via Template
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => handleOpenDialog("project")}>
            <FolderIcon className="mr-2 w-4 h-4" />
            Create New Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <QuickDeployDialog
        open={dialog.open}
        onOpenChange={toggleOpen}
        type={dialog.type}
      />
    </>
  );
}
