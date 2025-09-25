import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

import type { ButtonProps } from "@/components/ui/button";

import { authClient } from "@/lib/auth-client";

export default function LogoutButton({ children, ...props }: ButtonProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const res = await authClient.signOut();

      if (res.error) throw new Error(res.error.message);

      navigate({
        to: "/auth/login",
        replace: true,
      });

      toast.success("Logged Out Successfully");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <button
      type="button"
      className="w-full cursor-pointer"
      onClick={handleLogout}
      {...props}
    >
      {children}
    </button>
  );
}
