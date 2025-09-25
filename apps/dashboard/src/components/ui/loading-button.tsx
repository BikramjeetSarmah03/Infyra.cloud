import { Loader2Icon } from "lucide-react";
import { Button, type ButtonProps } from "./button";

interface Props extends ButtonProps {
  loading: boolean;
  loadingText?: string;
}

export function LoadingButton({
  loading,
  loadingText,
  children,
  ...props
}: Props) {
  return (
    <Button type={props.type || "submit"} disabled={loading} {...props}>
      {loading && <Loader2Icon className="mr-2 w-4 h-4 animate-spin" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}
