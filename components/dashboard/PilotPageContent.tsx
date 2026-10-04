"use client";

import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Card } from "@/components/ui/PageHeader";
import { RoadmapTimeline } from "@/components/dashboard/RoadmapTimeline";
import { PilotTargets } from "@/components/dashboard/PilotTargets";
import { useT } from "@/lib/i18n/context";

const scopeKeys = ["scope_farmers", "scope_storage", "scope_arot", "scope_sms", "scope_dae"];

export function PilotPageContent() {
  const t = useT();

  return (
    <AppShell>
      <PageHeader title={t("pilot.title")} subtitle={t("pilot.subtitle")} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title={t("pilot.roadmap_title")}>
          <RoadmapTimeline />
        </Card>

        <Card title={t("pilot.scope_title")}>
          <ul className="space-y-3.5">
            {scopeKeys.map((key) => (
              <li key={key} className="flex items-start gap-2.5 text-sm text-slate-600">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand-500" />
                <span>{t(`pilot.${key}`)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4">
        <Card title={t("pilot.targets_title")}>
          <PilotTargets />
        </Card>
      </div>
    </AppShell>
  );
}
