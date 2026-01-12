'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
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
import { Field as HeadlessField } from '@headlessui/react';
import { InfoIcon } from 'lucide-react';

import { useContributionRulesData, useBaseContributionRuleData, useAccountsData } from '@/hooks/use-convex-data';
import { contributionToConvex, baseContributionToConvex } from '@/lib/utils/convex-to-zod-transformers';
import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { formatNumber } from '@/lib/utils';
import type { DisclosureState } from '@/lib/types/disclosure-state';
import { Divider } from '@/components/catalyst/divider';
import { Select } from '@/components/catalyst/select';
import { Label } from '@/components/catalyst/fieldset';
import type { ContributionInputs, BaseContributionInputs } from '@/lib/schemas/inputs/contribution-form-schema';
import { accountTypeForDisplay, type AccountInputs, taxCategoryFromAccountType } from '@/lib/schemas/inputs/account-form-schema';
import type { TaxCategory } from '@/lib/calc/asset';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import DeleteDataItemAlert from '@/components/ui/delete-data-item-alert';
import DataListEmptyStateButton from '@/components/ui/data-list-empty-state-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

import ContributionRuleDialog from '../dialogs/contribution-rule-dialog';
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
  const planId = useSelectedPlanId();

  const [contributionRuleDialogOpen, setContributionRuleDialogOpen] = useState(false);
  const [selectedContributionRule, setSelectedContributionRule] = useState<ContributionInputs | null>(null);
  const [contributionRuleToDelete, setContributionRuleToDelete] = useState<{ id: string; name: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: accounts, isLoading: isLoadingAccounts } = useAccountsData();
  const { data: contributionRules, isLoading: isLoadingContributionRules } = useContributionRulesData();
  const contributionRulesValues = Object.values(contributionRules);

  const sortedRules = useMemo(() => contributionRulesValues.sort((a, b) => a.rank - b.rank), [contributionRulesValues]);
  const sortedRuleIds = useMemo(() => sortedRules.map((rule) => rule.id), [sortedRules]);

  const numContributionRules = sortedRuleIds.length;
  const hasContributionRules = numContributionRules > 0;

  const activeIndex = sortedRules.findIndex((rule) => rule.id === activeId);
  const activeContributionRule = activeIndex !== -1 ? sortedRules[activeIndex] : null;

  const baseContributionRule = useBaseContributionRuleData();

  const updateBaseRuleMutation = useMutation(api.contribution_rule.updateBaseRule);
  const updateBaseContributionRule = useCallback(
    async (data: BaseContributionInputs) => {
      const baseContributionRule = baseContributionToConvex(data);
      await updateBaseRuleMutation({ baseContributionRule, planId });
    },
    [updateBaseRuleMutation, planId]
  );

  const updateRuleMutation = useMutation(api.contribution_rule.upsertContributionRule);
  const updateContributionRules = useCallback(
    async (data: ContributionInputs) => {
      const contributionRule = contributionToConvex(data);
      await updateRuleMutation({ contributionRule, planId });
    },
    [updateRuleMutation, planId]
  );

  const reorderRulesMutation = useMutation(api.contribution_rule.reorderContributionRules).withOptimisticUpdate(
    (localStorage, { newOrder, planId }) => {
      const currentContributionRules = localStorage.getQuery(api.contribution_rule.getContributionRules, { planId });
      if (!currentContributionRules) return;

      const reorderedContributionRules = newOrder.map((id, index) => {
        const cr = currentContributionRules.find((c) => c.id === id);
        if (!cr) throw new Error(`Contribution rule ${id} not found`);
        return { ...cr, rank: index + 1 };
      });

      localStorage.setQuery(api.contribution_rule.getContributionRules, { planId }, reorderedContributionRules);
    }
  );
  const reorderContributionRules = useCallback(
    async (newOrder: string[]) => {
      await reorderRulesMutation({ newOrder, planId });
    },
    [reorderRulesMutation, planId]
  );

  const deleteRuleMutation = useMutation(api.contribution_rule.deleteContributionRule);
  const deleteContributionRule = useCallback(
    async (contributionRuleId: string) => {
      await deleteRuleMutation({ contributionRuleId, planId });
    },
    [deleteRuleMutation, planId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const disableContributionRule = useCallback(
    async (id: string) => {
      const rule = contributionRules[id];
      if (!rule) return;

      await updateContributionRules({ ...rule, disabled: !rule.disabled });
    },
    [contributionRules, updateContributionRules]
  );

  const handleClose = () => {
    setSelectedContributionRule(null);
    setContributionRuleDialogOpen(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id.toString());
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedRuleIds.indexOf(active.id.toString());
      const newIndex = sortedRuleIds.indexOf(over.id.toString());

      const newOrder = arrayMove(sortedRuleIds, oldIndex, newIndex);
      await reorderContributionRules(newOrder);
    }

    setActiveId(null);
  };

  const handleDropdownClickEdit = (rule: ContributionInputs) => {
    setSelectedContributionRule(rule);
    setContributionRuleDialogOpen(true);
  };

  return (
    <>
      <DisclosureSection title="Contributions" icon={HandCoinsIcon} centerPanelContent hideBottomBorders {...props}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3">
            <HeadlessField className="grow">
              <Label className="sr-only">Base Rule</Label>
              <Select
                name="status"
                value={baseContributionRule?.type ?? 'save'}
                onChange={async (e) => await updateBaseContributionRule({ type: e.target.value as 'spend' | 'save' })}
              >
                <option value="spend">Spend anything left</option>
                <option value="save">Save anything left</option>
              </Select>
            </HeadlessField>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="size-4 fill-white dark:fill-stone-950" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Allocate any leftover cash after your contribution rules are applied.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Divider className="my-4" soft />
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
                        disabled={contributionRule.disabled}
                        onDropdownClickEdit={() => handleDropdownClickEdit({ id, ...contributionRule })}
                        onDropdownClickDelete={() => setContributionRuleToDelete({ id, name: 'Contribution ' + (index + 1) })}
                        onDropdownClickDisable={async () => await disableContributionRule(id)}
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
                      disabled={activeContributionRule.disabled}
                      onDropdownClickEdit={() => handleDropdownClickEdit(activeContributionRule)}
                      onDropdownClickDelete={() => setContributionRuleToDelete({ id: activeId, name: 'Contribution ' + (activeIndex + 1) })}
                      onDropdownClickDisable={async () => await disableContributionRule(activeId)}
                      colorClassName={COLOR_MAP[taxCategoryFromAccountType(accounts[activeContributionRule.accountId]?.type)]}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
              <div className="mt-auto flex items-center justify-end">
                <Button outline onClick={() => setContributionRuleDialogOpen(true)} disabled={!!selectedContributionRule}>
                  <PlusIcon />
                  Contribution
                </Button>
              </div>
            </>
          )}
          {!hasContributionRules && !(isLoadingAccounts || isLoadingContributionRules) && (
            <DataListEmptyStateButton
              onClick={() => setContributionRuleDialogOpen(true)}
              icon={HandCoinsIcon}
              buttonText="Add contribution rule"
            />
          )}
          {(isLoadingAccounts || isLoadingContributionRules) && (
            <>
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-[80px] w-full" />
                <Skeleton className="h-[80px] w-full" />
              </div>
              <div className="mt-auto flex items-center justify-end">
                <Skeleton className="h-[40px] w-[100px] rounded-full" />
              </div>
            </>
          )}
        </div>
      </DisclosureSection>

      <Dialog size="xl" open={contributionRuleDialogOpen} onClose={handleClose}>
        <ContributionRuleDialog
          selectedContributionRule={selectedContributionRule}
          numContributionRules={numContributionRules}
          onClose={handleClose}
        />
      </Dialog>
      <DeleteDataItemAlert
        dataToDelete={contributionRuleToDelete}
        setDataToDelete={setContributionRuleToDelete}
        deleteData={deleteContributionRule}
      />
    </>
  );
}
