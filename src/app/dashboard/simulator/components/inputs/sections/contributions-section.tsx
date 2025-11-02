'use client';

import { useState, RefObject, useCallback, useMemo } from 'react';
import { HandCoinsIcon } from 'lucide-react';
import { PlusIcon } from '@heroicons/react/16/solid';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';

import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { formatNumber } from '@/lib/utils';
import type { DisclosureState } from '@/lib/types/disclosure-state';
import { Divider } from '@/components/catalyst/divider';
import { Select } from '@/components/catalyst/select';
import { Field, Label, Description } from '@/components/catalyst/fieldset';
import {
  useContributionRulesData,
  useBaseContributionRuleData,
  useUpdateBaseContributionRule,
  useReorderContributionRules,
  useDeleteContributionRule,
  useAccountsData,
} from '@/lib/stores/simulator-store';
import type { ContributionInputs } from '@/lib/schemas/contribution-form-schema';
import { accountTypeForDisplay, type AccountInputs, taxCategoryFromAccountType } from '@/lib/schemas/account-form-schema';
import type { TaxCategory } from '@/lib/calc/asset';

import ContributionRuleDialog from '../dialogs/contribution-rule-dialog';
import DisclosureSectionDeleteDataAlert from '../disclosure-section-delete-data-alert';
import DisclosureSectionEmptyStateButton from '../disclosure-section-empty-state-button';
import SortableContributionItem from '../sortable-contribution-item';
import ContributionItem from '../contribution-item';

function getContributionRuleDesc(accounts: Record<string, AccountInputs>, contributionInputs: ContributionInputs) {
  const accountType = accountTypeForDisplay(accounts[contributionInputs.accountId]?.type);

  let description: string;
  switch (contributionInputs.contributionType) {
    case 'dollarAmount':
      description = `${formatNumber(contributionInputs.dollarAmount, 2, '$')} per year`;
      break;
    case 'percentRemaining':
      description = `${contributionInputs.percentRemaining}% remaining`;
      break;
    case 'unlimited':
      description = 'Unlimited';
      break;
  }

  return (
    <p>
      {description} | {accountType}
    </p>
  );
}

const COLOR_MAP: Record<TaxCategory, string> = {
  taxable: 'bg-[var(--chart-1)]',
  taxDeferred: 'bg-[var(--chart-2)]',
  taxFree: 'bg-[var(--chart-3)]',
  cashSavings: 'bg-[var(--chart-4)]',
} as const;

interface ContributionsSectionProps {
  toggleDisclosure: (newDisclosure: DisclosureState) => void;
  disclosureButtonRef: RefObject<HTMLButtonElement | null>;
  disclosureKey: string;
}

export default function ContributionsSection(props: ContributionsSectionProps) {
  const [contributionRuleDialogOpen, setContributionRuleDialogOpen] = useState(false);
  const [selectedContributionRuleID, setSelectedContributionRuleID] = useState<string | null>(null);
  const [contributionRuleToDelete, setContributionRuleToDelete] = useState<{ id: string; name: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const accounts = useAccountsData();
  const contributionRules = Object.values(useContributionRulesData());

  const sortedRules = useMemo(() => contributionRules.sort((a, b) => a.rank - b.rank), [contributionRules]);
  const sortedRuleIds = useMemo(() => sortedRules.map((rule) => rule.id), [sortedRules]);

  const hasContributionRules = sortedRuleIds.length > 0;

  const activeIndex = sortedRules.findIndex((rule) => rule.id === activeId);
  const activeContributionRule = activeIndex !== -1 ? sortedRules[activeIndex] : null;

  const baseContributionRule = useBaseContributionRuleData();
  const updateBaseContributionRule = useUpdateBaseContributionRule();

  const reorderContributionRules = useReorderContributionRules();
  const deleteContributionRule = useDeleteContributionRule();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleClose = useCallback(() => {
    setSelectedContributionRuleID(null);
    setContributionRuleDialogOpen(false);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id.toString());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedRuleIds.indexOf(active.id.toString());
      const newIndex = sortedRuleIds.indexOf(over.id.toString());

      const newOrder = arrayMove(sortedRuleIds, oldIndex, newIndex);
      reorderContributionRules(newOrder);
    }

    setActiveId(null);
  };

  return (
    <>
      <DisclosureSection title="Contribution Order" icon={HandCoinsIcon} centerPanelContent {...props}>
        <div className="flex h-full flex-col">
          <Field>
            <Label className="sr-only">Base Rule</Label>
            <Select
              name="status"
              value={baseContributionRule.type}
              onChange={(e) => updateBaseContributionRule({ type: e.target.value as 'spend' | 'save' })}
            >
              <option value="spend">Spend anything left</option>
              <option value="save">Save anything left</option>
            </Select>
            <Description className="sr-only">Allocate any leftover cash after your contribution rules are applied.</Description>
          </Field>
          <Divider className="my-4" />
          {hasContributionRules && (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToParentElement]}
              >
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore - React 19 type compatibility */}
                <SortableContext items={sortedRules} strategy={verticalListSortingStrategy}>
                  <ul role="list" className="mb-6 grid grid-cols-1 gap-3">
                    {sortedRules.map(({ id, ...contributionRule }, index) => (
                      <SortableContributionItem
                        key={id}
                        id={id}
                        index={index}
                        name={`To ${accounts[contributionRule.accountId]?.name || 'Unknown'}`}
                        desc={getContributionRuleDesc(accounts, { id, ...contributionRule })}
                        leftAddOn={String(index + 1)}
                        onDropdownClickEdit={() => {
                          setContributionRuleDialogOpen(true);
                          setSelectedContributionRuleID(id);
                        }}
                        onDropdownClickDelete={() => {
                          setContributionRuleToDelete({ id, name: 'Contribution ' + (index + 1) });
                        }}
                        colorClassName={COLOR_MAP[taxCategoryFromAccountType(accounts[contributionRule.accountId]?.type)]}
                      />
                    ))}
                  </ul>
                </SortableContext>
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore - React 19 type compatibility */}
                <DragOverlay>
                  {activeId && activeContributionRule ? (
                    <ContributionItem
                      key={activeId}
                      id={activeId}
                      index={activeIndex}
                      name={`To ${accounts[activeContributionRule.accountId]?.name || 'Unknown'}`}
                      desc={getContributionRuleDesc(accounts, activeContributionRule)}
                      leftAddOn={String(activeIndex + 1)}
                      onDropdownClickEdit={() => {
                        setContributionRuleDialogOpen(true);
                        setSelectedContributionRuleID(activeId);
                      }}
                      onDropdownClickDelete={() => {
                        setContributionRuleToDelete({ id: activeId, name: 'Contribution ' + (activeIndex + 1) });
                      }}
                      colorClassName={COLOR_MAP[taxCategoryFromAccountType(accounts[activeContributionRule.accountId]?.type)]}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
              <div className="mt-auto flex items-center justify-end">
                <Button outline onClick={() => setContributionRuleDialogOpen(true)} disabled={!!selectedContributionRuleID}>
                  <PlusIcon />
                  Contribution
                </Button>
              </div>
            </>
          )}
          {!hasContributionRules && (
            <DisclosureSectionEmptyStateButton
              onClick={() => setContributionRuleDialogOpen(true)}
              icon={HandCoinsIcon}
              buttonText="Add contribution rule"
            />
          )}
        </div>
      </DisclosureSection>

      <Dialog size="xl" open={contributionRuleDialogOpen} onClose={handleClose}>
        <ContributionRuleDialog selectedContributionRuleID={selectedContributionRuleID} onClose={handleClose} />
      </Dialog>
      <DisclosureSectionDeleteDataAlert
        dataToDelete={contributionRuleToDelete}
        setDataToDelete={setContributionRuleToDelete}
        deleteData={deleteContributionRule}
      />
    </>
  );
}
