'use client';

import { Button } from '@/components/catalyst/button';
import { usePreferencesData, useUpdatePreferences, useResetStore } from '@/lib/stores/quick-plan-store';
import SectionHeader from '@/components/section-header';
import Card from '@/components/ui/card';
import SelectMenu from '@/components/ui/select-menu';

export default function PreferencesDrawer() {
  const preferences = usePreferencesData();
  const updatePreferences = useUpdatePreferences();
  const resetStore = useResetStore();

  return (
    <>
      <div className="border-border mb-5 border-b pb-5">
        <SectionHeader title="Display" desc="Choose how to display currency values in your projections." />
        <Card>
          <form onSubmit={(e) => e.preventDefault()}>
            <fieldset className="space-y-4">
              <legend className="sr-only">Display format configuration</legend>
              <SelectMenu
                id="display-format"
                label="Currency Display"
                value={preferences.displayFormat}
                onChange={(e) => updatePreferences('displayFormat', e.target.value)}
                options={[
                  { value: 'today', label: "Today's Currency" },
                  { value: 'future', label: 'Future Inflated Currency' },
                ]}
                desc="Today's currency shows values in current dollars. Future inflated currency shows values adjusted for inflation."
              />
            </fieldset>
          </form>
        </Card>
      </div>

      <div className="mb-5 pb-5">
        <SectionHeader title="Data Storage" desc="Control how your data is saved and managed." />
        <Card>
          <form onSubmit={(e) => e.preventDefault()}>
            <fieldset className="space-y-4">
              <legend className="sr-only">Data storage configuration</legend>
              <SelectMenu
                id="data-storage"
                label="Data Persistence"
                value={preferences.dataStorage}
                onChange={(e) => updatePreferences('dataStorage', e.target.value)}
                options={[
                  { value: 'localStorage', label: 'Local Storage' },
                  { value: 'none', label: 'No Data Persistence' },
                ]}
                desc="Local storage saves your data on this device. No data persistence means your data is lost when you close or refresh the page."
              />

              <div>
                <Button color="red" onClick={() => resetStore()} className="w-full">
                  Delete Saved Data
                </Button>
                <p className="text-muted-foreground mt-2 text-xs">This will permanently delete all saved data and reset to defaults.</p>
              </div>
            </fieldset>
          </form>
        </Card>
      </div>
    </>
  );
}
