interface ProfileHeaderProps {
    title: string;
    description: string;
}

export function ProfileHeader({title, description}: Readonly<ProfileHeaderProps>) {
    return (
        <header 
            className="space-y-2"
        >
            <h1
                className="text-4xl tracking-widest text-default-text"
            >
                {title}
            </h1>
            <p
                className="max-w-2xl text-sm text-default-text"
            >
                {description}
            </p>
        </header>
    );
}