export interface ConnectedAccount {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    conencted: boolean;
    account?: string;
}

export interface UserProfile {
    fullName: string;
    username: string;
    email: string;
    avatar?: string;
}