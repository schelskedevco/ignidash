'use client';

import { useState } from 'react';

import { Button } from '@/components/catalyst/button';
import { usePreferencesData, useUpdatePreferences, useResetStore } from '@/lib/stores/quick-plan-store';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import SelectMenu from '@/components/ui/select-menu';

export default function PreferencesDrawer() {
  const [isDeleting, setIsDeleting] = useState(false);

  const preferences = usePreferencesData();
  const updatePreferences = useUpdatePreferences();
  const resetStore = useResetStore();

  return (
    <>
      <SectionContainer showBottomBorder={false} location="drawer">
        <SectionHeader title="Data Storage" desc="Control how your data is saved and managed." />
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset className="space-y-4">
            <legend className="sr-only">Data storage configuration</legend>
            <Card>
              <SelectMenu
                id="data-storage"
                label="Data Persistence"
                value={preferences.dataStorage}
                onChange={(e) => updatePreferences('dataStorage', e.target.value)}
                options={[
                  { value: 'localStorage', label: 'Local Storage' },
                  { value: 'none', label: 'No Data Persistence' },
                ]}
                desc="Save your data locally on this device, or work without saving between sessions."
              />
            </Card>

            <Card>
              <Button
                type="button"
                color="red"
                onClick={async () => {
                  setIsDeleting(true);
                  await new Promise((resolve) => setTimeout(resolve, 500));
                  resetStore();
                  setIsDeleting(false);
                }}
                className="focus-outline w-full"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Saved Data'}
              </Button>
              <p className="text-muted-foreground mt-2 text-sm">This will permanently delete all saved data and reset to defaults.</p>
            </Card>
          </fieldset>
        </form>
      </SectionContainer>
    </>
  );
}
