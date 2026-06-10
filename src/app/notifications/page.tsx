import { EmptyState } from "@/components/empty-state";
import { SectionTitle } from "@/components/section-title";

export default function NotificationsPage() {
  return (
    <main className="page-stack">
      <SectionTitle
        eyebrow="Alerts"
        title="Notifications"
        description="Budget and savings milestones will show here."
      />
      <EmptyState
        title="No notifications"
        description="Unread budget warnings and savings reminders will appear here when generated."
      />
    </main>
  );
}
