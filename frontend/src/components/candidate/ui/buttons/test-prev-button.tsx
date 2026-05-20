export function TestPreviousButton({handlePrevious}: {handlePrevious: () => void}) {
    return (
        <button className=" w-16 h-8 tracking-widest rounded-md text-default-text border border-default-border hover:bg-default-text hover:text-secondary-surface hover:border-default-text transition-colors duration-300 cursor-pointer" onClick={handlePrevious}>
            <h1>Prev</h1>
        </button>
    )
}