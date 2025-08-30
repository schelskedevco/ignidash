'use client';

import { useState, RefObject, useCallback, useEffect } from 'react';
import { HandCoinsIcon, PiggyBankIcon, BanknoteArrowDownIcon } from 'lucide-react';
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
import { DisclosureState } from '@/lib/types/disclosure-state';
import { Divider } from '@/components/catalyst/divider';
import { Field, Label /* Description */ } from '@/components/catalyst/fieldset';
import { Listbox, ListboxLabel, ListboxDescription, ListboxOption } from '@/components/catalyst/listbox';
import {
  useContributionRulesData,
  useBaseContributionRuleData,
  useUpdateBaseContributionRule,
  useDeleteContributionRule,
  useAccountsData,
} from '@/lib/stores/quick-plan-store';
import type { ContributionInputs } from '@/lib/schemas/contribution-form-schema';
import { accountTypeForDisplay } from '@/lib/schemas/account-form-schema';

import ContributionRuleDialog from '../dialogs/contribution-rule-dialog';
import DisclosureSectionDeleteDataAlert from '../disclosure-section-delete-data-alert';
import DisclosureSectionEmptyStateButton from '../disclosure-section-empty-state-button';
import SortableContributionItem from '../sortable-contribution-item';
import ContributionItem from '../contribution-item';

function getContributionRuleDesc(contributionInputs: ContributionInputs) {
  const limitText = contributionInputs.maxValue ? ` | Up to: ${formatNumber(contributionInputs.maxValue, 2, '$')}` : '';

  switch (contributionInputs.contributionType) {
    case 'dollarAmount':
      return `${formatNumber(contributionInputs.dollarAmount, 2, '$') + ' per year'}${limitText}`;
    case 'percentRemaining':
      return `${contributionInputs.percentRemaining}% of remaining${limitText}`;
    case 'unlimited':
      return 'Unlimited';
  }
}

interface ContributionsSectionProps {
  toggleDisclosure: (newDisclosure: DisclosureState) => void;
  disclosureButtonRef: RefObject<HTMLButtonElement | null>;
  disclosureKey: string;
}

export default function ContributionsSection({ toggleDisclosure, disclosureButtonRef, disclosureKey }: ContributionsSectionProps) {
  const [contributionRuleDialogOpen, setContributionRuleDialogOpen] = useState(false);
  const [selectedContributionRuleID, setSelectedContributionRuleID] = useState<string | null>(null);
  const [contributionRuleToDelete, setContributionRuleToDelete] = useState<{ id: string; name: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const contributionRules = useContributionRulesData();
  const hasContributionRules = Object.keys(contributionRules).length > 0;

  const [items, setItems] = useState(Object.values(contributionRules));
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const activeContributionRule = hasContributionRules && activeId ? contributionRules[activeId] : null;

  useEffect(() => {
    setItems(Object.values(contributionRules));
  }, [contributionRules]);

  const baseContributionRule = useBaseContributionRuleData();
  const updateBaseContributionRule = useUpdateBaseContributionRule();

  const accounts = useAccountsData();

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

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;

    setActiveId(active.id.toString());
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id.toString());
        const newIndex = items.findIndex((item) => item.id === over.id.toString());

        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  }

  return (
    <>
      <DisclosureSection
        title="Contributions"
        icon={HandCoinsIcon}
        centerPanelContent
        toggleDisclosure={toggleDisclosure}
        disclosureButtonRef={disclosureButtonRef}
        disclosureKey={disclosureKey}
      >
        <div className="flex h-full flex-col">
          <Field>
            <Label className="sr-only">Base Rule</Label>
            <Listbox name="status" value={baseContributionRule.type} onChange={(value) => updateBaseContributionRule('type', value)}>
              <ListboxOption value="spend">
                <BanknoteArrowDownIcon data-slot="icon" className="text-primary" />
                <ListboxLabel>Spend</ListboxLabel>
                <ListboxDescription>Spend anything left</ListboxDescription>
              </ListboxOption>
              <ListboxOption value="save">
                <PiggyBankIcon data-slot="icon" className="text-primary" />
                <ListboxLabel>Save</ListboxLabel>
                <ListboxDescription>Save anything left</ListboxDescription>
              </ListboxOption>
            </Listbox>
            {/* <Description>Allocate any leftover cash after your contribution rules are applied.</Description> */}
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
                {/* @ts-expect-error | React 19 type compatibility */}
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                  <ul role="list" className="mb-6 grid grid-cols-1 gap-3">
                    {items.map(({ id, ...contributionRule }, index) => (
                      <SortableContributionItem
                        key={id}
                        id={id}
                        index={index}
                        name={`To "${accounts[contributionRule.accountId]?.name || 'Unknown'}" (${accountTypeForDisplay(accounts[contributionRule.accountId]?.type)})`}
                        desc={getContributionRuleDesc({ id, ...contributionRule })}
                        leftAddOnCharacter={String(index + 1)}
                        onDropdownClickEdit={() => {
                          setContributionRuleDialogOpen(true);
                          setSelectedContributionRuleID(id);
                        }}
                        onDropdownClickDelete={() => {
                          setContributionRuleToDelete({ id, name: 'Contribution Rule ' + (index + 1) });
                        }}
                      />
                    ))}
                  </ul>
                </SortableContext>
                {/* @ts-expect-error | React 19 type compatibility */}
                <DragOverlay>
                  {activeId && activeContributionRule ? (
                    <ContributionItem
                      key={activeId}
                      id={activeId}
                      index={activeIndex}
                      name={`To "${accounts[activeContributionRule.accountId]?.name || 'Unknown'}" (${accountTypeForDisplay(accounts[activeContributionRule.accountId]?.type)})`}
                      desc={getContributionRuleDesc(activeContributionRule)}
                      leftAddOnCharacter={String(activeIndex + 1)}
                      onDropdownClickEdit={() => {
                        setContributionRuleDialogOpen(true);
                        setSelectedContributionRuleID(activeId);
                      }}
                      onDropdownClickDelete={() => {
                        setContributionRuleToDelete({ id: activeId, name: 'Contribution Rule ' + (activeIndex + 1) });
                      }}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
              <div className="mt-auto flex items-center justify-end">
                <Button outline onClick={() => setContributionRuleDialogOpen(true)} disabled={!!selectedContributionRuleID}>
                  <PlusIcon />
                  Contribution Rule
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
