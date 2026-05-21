export function TestNextButton({handleNext}: {handleNext: () => void}) {
    return (
        <button className="w-16 h-8 rounded-md text-staatliches tracking-wider text-md bg-default-text border border-default-text text-secondary-surface hover:bg-transparent hover:border-system-red hover:text-system-red transition-colors duration-300 cursor-pointer" onClick={handleNext}>
            <h1>Next</h1>
        </button>
    )
}