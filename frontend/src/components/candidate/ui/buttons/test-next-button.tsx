export function TestNextButton({handleNext}: {handleNext: () => void}) {
    return (
        <button className="w-16 h-8 text-staatliches text-md bg-[#F5f5f5] text-background " onClick={handleNext}>
            <h1>Next</h1>
        </button>
    )
}