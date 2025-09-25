import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DialogProps } from "@radix-ui/react-dialog";

import type { IDeployTypes } from "./quick-deploy";

import { CreateProjectForm } from "./forms/create-project";

interface QuickDeployDialogProps extends DialogProps {
  type: IDeployTypes;
}

export default function QuickDeployDialog({
  type,
  ...props
}: QuickDeployDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === "project" ? "Create New Project" : ""}
          </DialogTitle>
        </DialogHeader>

        {type === "project" && <CreateProjectForm />}
      </DialogContent>
    </Dialog>
  );
}
