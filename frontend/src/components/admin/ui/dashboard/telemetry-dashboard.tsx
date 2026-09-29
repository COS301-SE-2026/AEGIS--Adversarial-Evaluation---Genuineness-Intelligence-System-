"use client"

import { CandidateMetrics, formatMs, calculatePastePercentage } from "@/app/(admin)/types/metrics";

interface TelemetryDashboardProps {
    metrics: CandidateMetrics | null;
}

export function TelemetryDashboard({metrics}: Readonly<TelemetryDashboardProps>){
    if(!metrics) {
        return (
            <div className="flex items-center justify-center h-40 text-default-border text-sm">
                No telemetry data available
            </div>
        )
    }

    const pastePercentage = calculatePastePercentage(metrics);

    return (
        <div className="space-y-6">

            <div>
                <div className="flex items-center justify-between mb-6 mt-8">
                    <h5 className="text-sm tracking-widest text-default-text/90 mb-2">
                        Pasting vs Typing
                    </h5>
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl font-bold font-jetbrains-mono">
                        {pastePercentage}%
                    </span>
                    <span className="text-md text-default-text font-staatliches uppercase tracking-widest mt-2">
                        Pasted
                    </span>
                </div>

                <div className="flex h-3 w-full bg-tertiary-surface rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-system-red transition-all duration-300" style={{ width: `${pastePercentage}%` }}/>
                    <div className="h-full bg-status-info transition-all duration-300" style={{ width: `${100 - pastePercentage}%` }}/>
                    
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-background rounded p-2">
                        <p className="text-xs text-default-border">Pasted</p>
                        <p className="text-sm font-bold font-jetbrains-mono text-system-red">{metrics.paste_char_count}</p>
                    </div>
                    <div className="bg-background rounded p-2">
                        <p className="text-xs text-default-border">Typed</p>
                        <p className="text-sm font-bold font-jetbrains-mono text-status-info">{metrics.copy_char_count}</p>
                    </div>
                </div>
            </div>

            <div>
                <h5 className="text-sm tracking-widest text-default-text/90 mb-6 mt-8">
                    Active Time vs Focus Loss
                </h5>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-default-text">Active Time</span>
                            <span className="font-jetbrains-mono text-status-info">{formatMs(metrics.active_time_ms)}</span>
                        </div>
                        <div className="h-2 bg-tertiary-surface rounded-full overflow-hidden">
                            <div className="h-full bg-status-info" style={{ width: "100%" }}/>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-default-text">Focus Loss</span>
                            <span className="font-jetbrains-mono text-system-red"> ({metrics.focus_loss_count} events) {formatMs(metrics.focus_loss_time_ms)} </span>
                        </div>
                        <div className="h-2 bg-tertiary-surface rounded-full overflow-hidden">
                            <div className="h-full bg-system-red" style={{ width: `${Math.min((metrics.focus_loss_time_ms / metrics.active_time_ms) * 100, 100)}%` }}/>
                        </div>
                    </div>
                </div>
            </div>
            
            <div>
                <h5 className="text-sm  tracking-widest text-default-text/90 mb-3 mt-10">Editing Activity</h5>
                <div className="bg-background border border-tertiary-surface rounded-lg p-3">
                    <p className="text-xs text-default-border mb-1">Backspaces</p>
                    <p className="text-xl font-bold font-jetbrains-mono text-defaukt-text">{metrics.backspace_count}</p>
                </div>
            </div>

        </div>
    )
}