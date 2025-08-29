'use client';

import { useState, RefObject } from 'react';
import { HourglassIcon } from 'lucide-react';
import { PlusIcon } from '@heroicons/react/16/solid';

import { useTimelinesData, useDeleteTimeline } from '@/lib/stores/quick-plan-store';
import { type RetirementStrategyInputs } from '@/lib/schemas/timeline-form-schema';
import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import type { DisclosureState } from '@/lib/types/disclosure-state';

import TimelineDialog from '../dialogs/timeline-dialog';
import DisclosureSectionDataItem from '../disclosure-section-data-item';
import DisclosureSectionDeleteDataAlert from '../disclosure-section-delete-data-alert';
import DisclosureSectionEmptyStateButton from '../disclosure-section-empty-state-button';

function getRetirementStrategyDesc(retirementStrategy: RetirementStrategyInputs) {
  switch (retirementStrategy.type) {
    case 'fixedAge':
      return 'Retire at ' + retirementStrategy.retirementAge;
    case 'swrTarget':
      return retirementStrategy.safeWithdrawalRate + '% SWR Target';
  }
}

interface TimelineSectionProps {
  toggleDisclosure: (newDisclosure: DisclosureState) => void;
  disclosureButtonRef: RefObject<HTMLButtonElement | null>;
  disclosureKey: string;
}

export default function TimelineSection({ toggleDisclosure, disclosureButtonRef, disclosureKey }: TimelineSectionProps) {
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [selectedTimelineID, setSelectedTimelineID] = useState<string | null>(null);

  const [timelineToDelete, setTimelineToDelete] = useState<{ id: string; name: string } | null>(null);

  const timelines = useTimelinesData();
  const hasTimelines = Object.keys(timelines).length > 0;

  const deleteTimeline = useDeleteTimeline();

  return (
    <>
      <DisclosureSection
        title="Timeline"
        icon={HourglassIcon}
        centerPanelContent={!hasTimelines}
        toggleDisclosure={toggleDisclosure}
        disclosureButtonRef={disclosureButtonRef}
        disclosureKey={disclosureKey}
      >
        <div className="flex h-full flex-col">
          {hasTimelines && (
            <>
              <ul role="list" className="mb-6 grid grid-cols-1 gap-3">
                {Object.entries(timelines).map(([id, timeline], index) => (
                  <DisclosureSectionDataItem
                    key={id}
                    id={id}
                    index={index}
                    name={'Timeline ' + (index + 1)}
                    desc={`${timeline.currentAge} to ${timeline.lifeExpectancy} | ${getRetirementStrategyDesc(timeline.retirementStrategy)}`}
                    leftAddOnCharacter={String(index + 1)}
                    onDropdownClickEdit={() => {
                      setTimelineDialogOpen(true);
                      setSelectedTimelineID(id);
                    }}
                    onDropdownClickDelete={() => {
                      setTimelineToDelete({ id, name: 'Timeline ' + (index + 1) });
                    }}
                  />
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-end">
                <Button outline onClick={() => setTimelineDialogOpen(true)}>
                  <PlusIcon />
                  Timeline
                </Button>
              </div>
            </>
          )}
          {!hasTimelines && (
            <DisclosureSectionEmptyStateButton onClick={() => setTimelineDialogOpen(true)} icon={HourglassIcon} buttonText="Add timeline" />
          )}
        </div>
      </DisclosureSection>
      <Dialog
        size="xl"
        open={timelineDialogOpen}
        onClose={() => {
          setSelectedTimelineID(null);
          setTimelineDialogOpen(false);
        }}
      >
        <TimelineDialog setTimelineDialogOpen={setTimelineDialogOpen} selectedTimelineID={selectedTimelineID} />
      </Dialog>
      <DisclosureSectionDeleteDataAlert dataToDelete={timelineToDelete} setDataToDelete={setTimelineToDelete} deleteData={deleteTimeline} />
    </>
  );
}
