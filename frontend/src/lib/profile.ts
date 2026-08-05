export interface ConnectedAccount {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    conencted: boolean;
}

export interface UserProfile {
    fullName: string;
    username: string;
    email: string;
    avatar?: string;
}