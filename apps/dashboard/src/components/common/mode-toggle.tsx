import { CheckIcon, Moon, Sun } from "lucide-react";

import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "./theme-provider";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="gap-2">
        <Sun className="dark:hidden w-[1rem] h-[1rem] text-muted-foreground rotate-0 dark:-rotate-90 scale-100 dark:scale-0 transition-all" />

        <Moon className="hidden dark:block w-[1rem] h-[1rem] text-muted-foreground rotate-90 dark:rotate-0 scale-0 dark:scale-100 transition-all" />
        <h1>Theme</h1>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem
            className="justify-between items-center"
            onClick={() => setTheme("light")}
          >
            Light {theme === "light" && <CheckIcon />}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="justify-between items-center"
            onClick={() => setTheme("dark")}
          >
            Dark {theme === "dark" && <CheckIcon />}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="justify-between items-center"
            onClick={() => setTheme("system")}
          >
            System {theme === "system" && <CheckIcon />}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
