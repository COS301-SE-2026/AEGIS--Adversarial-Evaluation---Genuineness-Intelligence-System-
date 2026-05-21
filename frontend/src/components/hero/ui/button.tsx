import type { ReactNode } from "react";
type ButtonVariant = "solid" | "outline" | "social";

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
    "font-staatliches tracking-widest inline-flex items-center justify-center rounded-md gap-2 px-8 py-4 tracking-widest uppercase transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<ButtonVariant, string> = {
    solid:
      "bg-default-text text-background border border-default-text hover:bg-transparent hover:border-system-red hover:text-system-red",
    outline:
      "bg-transparent text-default-text border border-default-border hover:bg-background hover:text-default-text",
    social:
      "bg-transparent text-default-text border border-default-border hover:border-system-red",
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
