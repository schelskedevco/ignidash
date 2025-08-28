'use client';

import { useState, RefObject } from 'react';
import { HourglassIcon } from 'lucide-react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/16/solid';

import { useTimelinesData, useDeleteTimeline } from '@/lib/stores/quick-plan-store';
import { type RetirementStrategyInputs } from '@/lib/schemas/timeline-form-schema';
import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';
import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/catalyst/alert';
import { cn } from '@/lib/utils';
import type { DisclosureState } from '@/lib/types/disclosure-state';

import TimelineDialog from '../dialogs/timeline-dialog';

const colors = ['bg-rose-500/50', 'bg-rose-500/75', 'bg-rose-500'];

function getRetirementStrategyDesc(retirementStrategy: RetirementStrategyInputs) {
  switch (retirementStrategy.type) {
    case 'fixedAge':
      return 'Retire at ' + retirementStrategy.retirementAge;
    case 'swrTarget':
      return retirementStrategy.safeWithdrawalRate + '% SWR';
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
        defaultOpen
      >
        {hasTimelines && (
          <div className="flex h-full flex-col">
            <ul role="list" className="mb-6 grid grid-cols-1 gap-3">
              {Object.entries(timelines).map(([id, timeline], index) => (
                <li key={id} className="col-span-1 flex rounded-md shadow-xs dark:shadow-none">
                  <div
                    className={cn(
                      'border-foreground/50 flex w-16 shrink-0 items-center justify-center rounded-l-md border text-xl font-medium text-white',
                      colors[index % colors.length]
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="bg-emphasized-background/25 border-border flex flex-1 items-center justify-between truncate rounded-r-md border-t border-r border-b">
                    <div className="flex-1 truncate px-4 py-2 text-sm">
                      <span className="font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-200">
                        {'Timeline ' + (index + 1)}
                      </span>
                      <p className="text-muted-foreground">{`${timeline.currentAge} to ${timeline.lifeExpectancy} | ${getRetirementStrategyDesc(timeline.retirementStrategy)}`}</p>
                    </div>
                    <div className="shrink-0 pr-2">
                      <Dropdown>
                        <DropdownButton plain aria-label="Open options">
                          <EllipsisVerticalIcon />
                        </DropdownButton>
                        <DropdownMenu>
                          <DropdownItem
                            onClick={() => {
                              setTimelineDialogOpen(true);
                              setSelectedTimelineID(id);
                            }}
                          >
                            Edit
                          </DropdownItem>
                          <DropdownItem
                            onClick={() => {
                              setTimelineToDelete({ id, name: 'Timeline ' + (index + 1) });
                            }}
                          >
                            Delete
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex items-center justify-end gap-x-2">
              <Button outline onClick={() => setTimelineDialogOpen(true)}>
                <PlusIcon />
                Timeline
              </Button>
            </div>
          </div>
        )}
        {!hasTimelines && (
          <div className="flex h-full flex-col gap-2">
            <button
              type="button"
              className="focus-outline relative block w-full grow rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-gray-400 sm:p-12 dark:border-white/15 dark:hover:border-white/25"
              onClick={() => setTimelineDialogOpen(true)}
            >
              <HourglassIcon aria-hidden="true" className="text-primary mx-auto size-12" />
              <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-white">Add timeline</span>
            </button>
          </div>
        )}
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
      <Alert
        open={!!timelineToDelete}
        onClose={() => {
          setTimelineToDelete(null);
        }}
      >
        <AlertTitle>Are you sure you want to delete {timelineToDelete ? `"${timelineToDelete.name}"` : 'this timeline'}?</AlertTitle>
        <AlertDescription>This action cannot be undone.</AlertDescription>
        <AlertActions>
          <Button plain onClick={() => setTimelineToDelete(null)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              deleteTimeline(timelineToDelete!.id);
              setTimelineToDelete(null);
            }}
          >
            Delete
          </Button>
        </AlertActions>
      </Alert>
    </>
  );
}
