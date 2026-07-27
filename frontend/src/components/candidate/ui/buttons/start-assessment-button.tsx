type StartAssessmentButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  isStarting?: boolean;
};

export function StartAssessmentButton({
  onClick,
  disabled,
  isStarting,
}: StartAssessmentButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-4 h-3rem w-8rem rounded-md border-2 bg-default-text text-background hover:bg-transparent hover:text-system-red  hover:border-system-red  px-4 py-2 transition-colors duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <h3 className="tracking-widest">
        {isStarting ? "Starting..." : "Start"}
      </h3>
    </button>
  );
}
