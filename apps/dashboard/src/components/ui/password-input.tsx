import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

import { Input, type InputProps } from "./input";

export function PasswordInput({ ...props }: InputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input type={show ? "text" : "password"} {...props} />

      <button
        type="button"
        className="top-0 right-0 absolute bg-gray-100 p-[7px] border rounded-md rounded-l-none cursor-pointer"
        onClick={() => setShow(!show)}
      >
        {show ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
      </button>
    </div>
  );
}
