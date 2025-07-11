"use client";

import { Card } from "@/components/card";
import type { InvalidInputErrorProps } from "@/components/invalid-input-error";

interface SettingsSectionProps {
  title: React.ReactNode;
  desc?: string | React.ReactNode;
  children: React.ReactNode;
  hasBorder?: boolean;
  errorComponent?: React.ReactElement<InvalidInputErrorProps> | false;
}

export function SettingsSection({
  title,
  desc,
  children,
  hasBorder = true,
  errorComponent,
}: SettingsSectionProps) {
  return (
    <div
      className={
        hasBorder ? "border-foreground/10 mb-5 border-b pb-5" : "mb-5 pb-5"
      }
    >
      <div className="ml-2">
        <h4 className="text-base font-semibold">{title}</h4>
        {desc && <p className="text-muted-foreground mt-2 text-sm">{desc}</p>}
      </div>
      <Card>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {children}
        </form>
      </Card>
      {errorComponent}
    </div>
  );
}
