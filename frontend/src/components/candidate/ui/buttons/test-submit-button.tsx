type Props = {
    onClick?: () => void | Promise<void>;
    disabled?: boolean;
    isSubmitting?: boolean;
};

export function TestSubmitButton({ onClick, disabled, isSubmitting }: Props) {
    return (
        <button
            onClick={() => void (onClick ? onClick() : undefined)}
            disabled={disabled}
            className={`bg-default-text h-8 w-32 rounded-md text-secondary-surface border border-default-text hover:bg-transparent hover:text-system-red hover:border-system-red transition-colors duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
        >
            <h3 className="tracking-widest">{isSubmitting ? "Submitting..." : "Submit"}</h3>
        </button>
    );
}