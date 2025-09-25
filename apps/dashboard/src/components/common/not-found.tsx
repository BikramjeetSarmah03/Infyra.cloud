import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const NotFound = () => {
  return (
    <div className="flex justify-center items-center p-2 size-full text-2xl">
      <div className="flex flex-col items-center gap-4">
        <p className="font-bold text-4xl">404</p>
        <p className="text-lg">Page Not Found</p>

        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
};
