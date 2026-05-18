export function ReportInfoCard({ title, value }: { title: string; value: number }) {
    return (
        <div className="flex flex-col w-72 h-23 tracking-wider rounded-md bg-secondary-surface/50 border border-default-border p-4 relative">
            <div className="flex flex-row items-center">
                <p className="font-medium">{title}</p>
                <div className="absolute top-4 right-4 w-8 h-8 border rounded-full border-blue-300"></div>
            </div>
            <p className="text-xl mt-auto">{value}</p>
        </div>
    )
}