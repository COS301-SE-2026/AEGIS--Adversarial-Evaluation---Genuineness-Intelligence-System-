import React from "react";

type ButtonVariant  = "solid"|"outline";

type ButtonProps = {
    variant? : ButtonVariant;
    children: React.ReactNode;
    onClick?: ()=> void;
    type?: "button" | "submit" | "reset";
    className?: string;
    disabled?: boolean;
};

const Button = ({
    variant = "solid",
    children,
    onClick,
    type = "button",
    className = "",
    disabled = false
}: ButtonProps) => {
  const base = "inline-flex items-center justify-center px-8 py-4 font-jetbrains-mono text-sm tracking-widest uppercase transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<ButtonVariant, string> = {
    solid:  "bg-signal-red text-pure-white hover:bg-red-700 border border-signal-red",
    outline: "bg-transparent text-signal-red border border-signal-red hover:bg-signal-red hover:text-pure-white"
  };

  return (
   <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
   </button>
  )
}

export default Button