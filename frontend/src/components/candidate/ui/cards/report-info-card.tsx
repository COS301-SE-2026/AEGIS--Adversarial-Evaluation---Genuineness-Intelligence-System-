
interface InfoCardProps {
    title: string,
    value: number,
    topCandidates?: Record<string, number>,
}
export function InfoCard({ title, value, topCandidates }: Readonly<InfoCardProps>) {
    return (
        <div className="flex flex-col relative p-3 sm:p-4 tracking-wider rounded-md bg-secondary-surface/50 border border-default-border ">
            
            <div className="flex items-center justify-between gap-4">

                <p className="font-medium text-sm sm:text-base truncate">
                    {title}
                </p>

                <div className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 border rounded-full border-blue-300"/>

            </div>

            <p className="text-lg sm:text-xl mt-auto">{value}</p>

        </div>
    )
}