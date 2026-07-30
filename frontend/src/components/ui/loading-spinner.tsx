"use client"

type LoadingSpinnerProps = Readonly<{
    message?: string;
}>;

export default function LoadingSpinner({ message = "Loading..." }: LoadingSpinnerProps) {
    return (
        <div className="flex items-center gap-3 text-default-text">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-default-border border-t-system-red" />
            <span className="text-sm">{message}</span>
        </div>
    );
}