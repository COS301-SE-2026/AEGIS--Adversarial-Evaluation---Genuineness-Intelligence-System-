import type { ReactNode } from "react";

type InputProps = {
    label: string;
    type?: "text" | "email" | "password";
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
    icon?: ReactNode;
};


const Input = ({
    label,
    type="text",
    placeholder,
    value,
    onChange,
    className="",
    icon
}: InputProps) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
        <label className="font-jetbrains-mono text-xs tracking-widest uppercase text-white-smoke">
            {label}
        </label>
        <div className="relative flex items-center">
            {icon && (
                <span className="absolute left-4 text-white-smoke shrink-0">
                    {icon}
                </span>
            )}
            <input 
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e)=> onChange(e.target.value)}
                className={`w-full bg-bunker-grey text-white-smoke placeholder:text-white-smoke/40 font-ibm-plex text-sm px-4 py-4 border border-transparent
                            focus:outline-none focus:border-signal-red transition-colors duration-200 {icon ? "pl-10" : ""}`}
                />

        </div>
    </div>
  );
}

export default Input