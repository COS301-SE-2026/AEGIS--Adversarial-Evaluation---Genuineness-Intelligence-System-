import type { ReactNode, KeyboardEvent } from "react";

type InputProps = {
    label: string;
    type?: "text" | "email" | "password";
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
    icon?: ReactNode;
    rightIcon?: ReactNode;
    error?: string;
    onBlur?: () => void;
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
};


const Input = ({
    label,
    type="text",
    placeholder,
    value,
    onChange,
    className="",
    icon,
    rightIcon,
    error,
    onBlur,
    onKeyDown
}: InputProps) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
        <label className="text-xs tracking-widest uppercase text-default-text">
            {label}
        </label>
        <div className="relative flex items-center">
            {icon && (
                <span className="absolute left-4 text-default-text shrink-0">
                    {icon}
                </span>
            )}
            <input 
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e)=> onChange(e.target.value)}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                className=  {`w-full bg-secondary-surface text-default-text placeholder:text-default-text/80 text-sm px-4 py-4 border border-transparent
                                focus:outline-none focus:border-default-border transition-colors duration-200
                                ${icon ? "pl-10" : ""} 
                                ${rightIcon ? "pr-10" : ""}
                            `}
            />

            {rightIcon && (
                <div className="absolute right-4 flex items-center justify-center">
                    {rightIcon}
                </div>
            )}
        </div>
        {error && <p className="text-system-red text-xs">{error}</p>}
    </div>
  );
}

export default Input