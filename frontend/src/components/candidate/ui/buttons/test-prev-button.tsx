export function TestPreviousButton({handlePrevious}: {handlePrevious: () => void}) {
    return (
        <button className=" w-16 h-8 text-staatliches text-md border border-default-border" onClick={handlePrevious}>
            <h1>Prev</h1>
        </button>
    )
}