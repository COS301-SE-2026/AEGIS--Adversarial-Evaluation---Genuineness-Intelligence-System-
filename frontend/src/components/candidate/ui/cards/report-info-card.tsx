
"use client"

import type { InfoCardProps } from "@/types/dashboard-types";
import { TrophyIcon, ChartIcon, UsersIcon, ClockIcon, AIIcon, } from "@/components/ui/icons/dashboard-icon";

const iconMap = {
    trophy: TrophyIcon,
    chart: ChartIcon,
    users: UsersIcon,
    clock: ClockIcon,
    ai: AIIcon,
}

function formatDuration(minutesTotal: number): string {
    if (minutesTotal < 60) {
        return `${Math.round(minutesTotal)} min`;
    }

    const hours = Math.floor(minutesTotal / 60);
    const minutes = Math.round(minutesTotal % 60);

    if (minutes === 0) {
        return `${hours} ${hours === 1 ? "Hour" : "Hours"}`;
    }

    return `${hours} ${hours === 1 ? "Hour" : "Hours"} ${minutes} Min`
}



export function InfoCard( props : Readonly<InfoCardProps>) {
    const Icon = iconMap[props.icon];

    const rankingLevel = () => {
        if (props.type === "percentage" && props.label === "HIGH") {
            return "text-system-red";
        }
        else if (props.type === "percentage" && props.label === "MEDIUM") {
            return "text-status-warning";
        }
        else {
            return ("text-status-success");
        }
    }  

    const renderContent = () => {
        
        switch (props.type) {
            case "metric":
                return (
                    <div className="flex flex-col items-center mt-6 font-medium">
                        <p className="text-xl sm:text-2xl">
                            {props.value}
                        </p>
                    </div>
                );
            
            case "duration" :
                return (
                    <div className="flex flex-col items-center font-medium mt-6">
                        <p className="text-xl sm:text-2xl">
                            {formatDuration(props.value)}
                        </p>
                    </div>
                )

            case "percentage":
                return ( 
                    <div className="flex flex-col items-center justify-evenly gap-2 text-md sm:text-xl font-medium mt-6">   
                       
                        {props.value}%
                       
                    </div>
                );

            case "ranking":
                return (
                    <div className="mt-3 space-y-2">
                        {props.items.slice(0, 3).map((item, index) => (
                            <div
                                key={`${item.name}-${index}`}
                                className="flex items-center justify-between gap-3 text-sm"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-default-border">
                                        {index + 1}.
                                    </span>

                                    <span className="truncate">
                                        {item.name}
                                    </span>
                                </div>

                                <span className="shrink-0">
                                    {item.value}%
                                </span>
                            </div>
                        ))}
                    </div>
                );
            
        }

    }

    return (
        <div className="flex flex-col min-h-32 p-3 sm:p-4 tracking-wider rounded-lg bg-secondary-surface border border-default-text">
            <div className="flex items-center justify-between gap-4">
                <h3 className="font-medium text-sm sm:text-base truncate">
                    {props.title}
                </h3>

                <Icon className="w-6 h-6 text-system-red"/>
            </div>

            {renderContent()}
        </div>
    )
}