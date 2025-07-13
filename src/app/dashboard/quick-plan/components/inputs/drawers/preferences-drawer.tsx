"use client";

import { SelectInput } from "@/components/ui/select-input";
import { CardFormSection } from "@/components/layout/card-form-section";
import { Button } from "@/components/catalyst/button";
import {
  usePreferencesData,
  useUpdatePreferences,
  useResetStore,
} from "@/lib/stores/quick-plan-store";

export function PreferencesDrawer() {
  const preferences = usePreferencesData();
  const updatePreferences = useUpdatePreferences();
  const resetStore = useResetStore();

  return (
    <>
      <CardFormSection
        title="Display"
        desc="Choose how to display currency values in your projections."
        legendText="Display format configuration"
      >
        <SelectInput
          id="display-format"
          label="Currency Display"
          value={preferences.displayFormat}
          onChange={(e) => updatePreferences("displayFormat", e.target.value)}
          options={[
            { value: "today", label: "Today's Currency" },
            { value: "future", label: "Future Inflated Currency" },
          ]}
          desc="Today's currency shows values in current dollars. Future inflated currency shows values adjusted for inflation."
        />
      </CardFormSection>

      <CardFormSection
        title="Data Storage"
        desc="Control how your data is saved and managed."
        hasBorder={false}
        legendText="Data storage configuration"
      >
        <SelectInput
          id="data-storage"
          label="Data Persistence"
          value={preferences.dataStorage}
          onChange={(e) => updatePreferences("dataStorage", e.target.value)}
          options={[
            { value: "localStorage", label: "Local Storage" },
            { value: "none", label: "No Data Persistence" },
          ]}
          desc="Local storage saves your data on this device. No data persistence means your data is lost when you close or refresh the page."
        />

        <div>
          <Button color="red" onClick={() => resetStore()} className="w-full">
            Delete Saved Data
          </Button>
          <p className="text-muted-foreground mt-2 text-xs">
            This will permanently delete all saved data and reset to defaults.
          </p>
        </div>
      </CardFormSection>
    </>
  );
}
