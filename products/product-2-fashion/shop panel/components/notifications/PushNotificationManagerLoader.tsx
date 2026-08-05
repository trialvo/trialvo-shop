"use client";

/**
 * components/notifications/PushNotificationManagerLoader.tsx
 *
 * Thin client-component wrapper that lazy-loads PushNotificationManager
 * with ssr:false. Must be a Client Component because next/dynamic with
 * ssr:false is only allowed inside "use client" files.
 */
import dynamic from "next/dynamic";

const PushNotificationManager = dynamic(
  () => import("@/components/notifications/PushNotificationManager"),
  { ssr: false }
);

export default function PushNotificationManagerLoader() {
  return <PushNotificationManager />;
}
