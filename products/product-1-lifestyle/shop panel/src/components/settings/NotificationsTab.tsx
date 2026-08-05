"use client";

import { useState } from "react";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

type NotificationKey = "orderUpdates" | "promotions" | "newsletter";

const notificationMeta: Record<NotificationKey, { label: string; description: string }> = {
  orderUpdates: { label: "Order Updates", description: "Get notified about order status changes" },
  promotions: { label: "Promotions", description: "Receive exclusive deals and offers" },
  newsletter: { label: "Newsletter", description: "Weekly style tips and new arrivals" },
};

export function NotificationsTab() {
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    orderUpdates: true,
    promotions: false,
    newsletter: true,
  });

  const toggle = (key: NotificationKey) =>
    setNotifications((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-medium tracking-[0.1em] uppercase text-foreground mb-6">
        Notification Preferences
      </h2>
      {(Object.keys(notificationMeta) as NotificationKey[]).map((key) => (
        <ToggleSwitch
          key={key}
          id={key}
          checked={notifications[key]}
          onChange={() => toggle(key)}
          label={notificationMeta[key].label}
          description={notificationMeta[key].description}
        />
      ))}
    </div>
  );
}
