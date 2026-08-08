"use client"

import { Loader2, Save } from "lucide-react";

interface SaveChangesBarProps {
    loading: boolean;
    onSave(): void;
}

export function SaveChangesBar({ loading, onSave }: Readonly<SaveChangesBarProps>){
    return(
        <div className="flex justify-end sticky bottom-6 z-20 mt-4">

            <button
                onClick={onSave}
                disabled={loading}
                className="flex items-center gap-3 rounded-xl bg-system-red text-background px-8 py-4 text-sm shadow-lg transition hover:bg-transparent hover:text-default-text disabled:cursor-not-allowed disabled:opacity-60"
            >
                {loading ? (
                    <>
                        <Loader2
                            size={18}
                            className="animate-spin"
                        />
                        Saving...
                    </>
                ) : (
                    <>
                        <Save size={18}/>
                        Save Changes
                    </>
                )}
            </button>

        </div>
    )
}