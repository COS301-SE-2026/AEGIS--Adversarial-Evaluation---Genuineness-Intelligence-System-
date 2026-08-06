"use client"

import { Camera, Upload } from "lucide-react";
import { useRef } from "react";

interface PropfilePictureProps {
    image?: string;
    fullName: string;
    onUpload(url: string): void;
}

export function ProfilePicture({image, fullName, onUpload}: Readonly<PropfilePictureProps>) {
    
    const inputRef = useRef<HTMLInputElement>(null);

    function handleClick() {
        inputRef.current?.click();
    }

    function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
        
        const file = event.target.files?.[0];

        if (!file) return;

        const preview = URL.createObjectURL(file);

        onUpload(preview);
    }

    return (
        <section
            className="rounded-2xl border border-default-border bg-secondary-surface p-6"
        >
            
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                
                <div className="relative h-24 w-24 overflow:hidden rounded-full border-2 border-default-text bg-background">

                    {image ? (
                        <img
                            src={image}
                            alt={fullName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <Camera
                                size={34}
                                className="text-default-text"
                            />
                        </div>
                    )}

                </div>

                <div>

                    <h3 className="text-2xl tracking-widest">
                        {fullName}
                    </h3>
                    <p className="mt-1 text-sm text-default-border">
                        PNG or JPEG
                    </p>

                </div>

                <div className="flex flex-wrap gap-3">
                   
                    <button
                        onClick={handleClick}
                        className="inline-flex items-center gap-2 rounded-lg bg-transparent px-5 py-3 text-sm font-medium text-default-text transition hover:bg-system-red hover:text-background"
                    >
                        <Upload size={18}/>
                        Upload Picture
                    </button>

                    <input
                        ref={inputRef}
                        type="file"
                        hidden
                        accept="image/png,image/jpeg"
                        onChange={handleFile}
                    />

                </div>

            </div>

        </section>
    )
}