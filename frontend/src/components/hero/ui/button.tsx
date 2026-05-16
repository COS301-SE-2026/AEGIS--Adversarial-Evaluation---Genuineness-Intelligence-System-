import type { ReactNode } from "react";
type ButtonVariant = "solid" | "outline";

type ButtonProps = {
  variant?: ButtonVariant;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
};

const Button = ({
  variant = "solid",
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
  icon,
}: ButtonProps) => {
  const base =
    "inline-flex items-center justify-center gap-2 px-8 py-4 font-jetbrains-mono text-sm tracking-widest uppercase transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<ButtonVariant, string> = {
    solid:
      "bg-system-red text-default-text hover:bg-red-700 border border-system-red",
    outline:
      "bg-transparent text-system-red border border-system-red hover:bg-system-red hover:text-default-text",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
};

export default Button;
