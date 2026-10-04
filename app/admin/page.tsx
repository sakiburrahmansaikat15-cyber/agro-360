"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { AgentManagementTabs } from "@/components/admin/AgentManagementTabs";
import { useT } from "@/lib/i18n/context";
import { RequireAdmin } from "@/components/layout/RequireAdmin";

export default function AdminPage() {
  const t = useT();
  // Using the translation key for the title if it exists, otherwise fallback to "Agent Management"
  const title = t("nav.admin") || "Agent Management";

  return (
    <RequireAdmin>
      <AppShell>
        <PageHeader
          title={title}
          subtitle="Manage field agents, assign tasks, and monitor data collection across regions"
        />
        <AgentManagementTabs />
      </AppShell>
    </RequireAdmin>
  );
}
