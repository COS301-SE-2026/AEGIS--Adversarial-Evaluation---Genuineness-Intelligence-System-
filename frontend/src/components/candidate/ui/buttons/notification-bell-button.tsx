import Image from "next/image";

export function NotificationBell() {
    return (
        <div className="cursor-pointer">
            <Image src="/illustrations/icons/notification-bell-icon.svg" alt="Notification Bell Icon" width={24} height={24} />
        </div>  
    );
}