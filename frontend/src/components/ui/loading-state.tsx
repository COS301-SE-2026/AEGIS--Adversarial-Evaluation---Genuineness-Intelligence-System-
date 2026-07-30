"use client"

import LoadingSpinner from "@/components/ui/loading-spinner";

type LoadingStateProps = Readonly<{
    message?: string;
}>;

export default function LoadingState({ message = "Loading..." }: LoadingStateProps) {
    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
            <LoadingSpinner message={message} />
        </div>
    );
}