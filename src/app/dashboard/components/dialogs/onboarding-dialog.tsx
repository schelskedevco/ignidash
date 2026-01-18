'use client';

import { FireIcon } from '@heroicons/react/24/solid';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
  LayoutDashboardIcon,
  ChartNoAxesCombinedIcon,
  ZapIcon,
  WandSparklesIcon,
  SettingsIcon,
  CircleQuestionMarkIcon,
  LinkIcon,
} from 'lucide-react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';

import { DialogTitle, DialogDescription, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { Strong, Text, TextLink } from '@/components/catalyst/text';

interface OnboardingDialogProps {
  onClose: () => void;
}

export default function OnboardingDialog({ onClose }: OnboardingDialogProps) {
  return (
    <>
      <DialogTitle onClose={onClose}>
        <div className="flex items-center gap-4">
          <FireIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>Ignidash Onboarding</span>
        </div>
      </DialogTitle>
      <DialogDescription>
        Here&apos;s a brief overview of the app. Feel free to skip it if you&apos;d like to explore things on your own.
      </DialogDescription>

      <DialogBody className="space-y-4">
        <Disclosure as="div" className="border-border/25 border-t pt-4" defaultOpen>
          <DisclosureButton className="group data-open:border-border/25 focus-outline flex w-full items-start justify-between text-left transition-opacity duration-150 hover:opacity-75 data-open:border-b data-open:pb-4">
            <div className="flex items-center gap-2">
              <LayoutDashboardIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
              <span className="text-base/7 font-semibold">Dashboard</span>
              <span className="hidden sm:inline">|</span>
              <span className="text-muted-foreground hidden truncate sm:inline">Home base & net worth tracking</span>
            </div>
            <span className="text-muted-foreground ml-6 flex h-7 items-center">
              <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
              <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
            </span>
          </DisclosureButton>
          <DisclosurePanel className="space-y-2 pt-4">
            <Text>Dashboard is your home base in Ignidash.</Text>
            <Text>
              From here, you can view existing Simulator plans, create new ones, and track your Net Worth by adding assets and liabilities.
            </Text>
            <Text>
              <Strong>Tip:</Strong> Click <Strong>Create</Strong> and select a Demo Plan under <Strong>With Template</Strong> to try
              Simulator with demo data.
            </Text>
          </DisclosurePanel>
        </Disclosure>

        <Disclosure as="div" className="border-border/25 border-t pt-4">
          <DisclosureButton className="group data-open:border-border/25 focus-outline flex w-full items-start justify-between text-left transition-opacity duration-150 hover:opacity-75 data-open:border-b data-open:pb-4">
            <div className="flex items-center gap-2">
              <ChartNoAxesCombinedIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
              <span className="text-base/7 font-semibold">Simulator</span>
              <span className="hidden sm:inline">|</span>
              <span className="text-muted-foreground hidden truncate sm:inline">Detailed financial projections</span>
            </div>
            <span className="text-muted-foreground ml-6 flex h-7 items-center">
              <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
              <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
            </span>
          </DisclosureButton>
          <DisclosurePanel className="space-y-2 pt-4">
            <Text>Simulator is where you&apos;ll spend most of your time.</Text>
            <Text>
              Here, you&apos;ll enter financial information such as incomes, expenses, and investment accounts under{' '}
              <Strong>Numbers</Strong>, and receive detailed long-term projections under <Strong>Results</Strong>.
            </Text>
            <Text>
              To discuss your plan and results with AI chat powered by GPT-5.2, click the{' '}
              <WandSparklesIcon className="text-primary mx-1 inline size-5 shrink-0" aria-label="Ask AI button icon" /> next to{' '}
              <Strong>Results</Strong>.
            </Text>
            <Text>
              <Strong>Tip:</Strong> Run Monte Carlo simulations by clicking the{' '}
              <SettingsIcon className="text-foreground mx-1 inline size-5 shrink-0" aria-label="Simulation Settings button icon" /> next to{' '}
              <Strong>Results</Strong> and selecting one of the Monte Carlo modes. Drill down into full individual simulations by clicking
              on rows in the table at the bottom of the page.
            </Text>
          </DisclosurePanel>
        </Disclosure>

        <Disclosure as="div" className="border-border/25 border-t pt-4">
          <DisclosureButton className="group data-open:border-border/25 focus-outline flex w-full items-start justify-between text-left transition-opacity duration-150 hover:opacity-75 data-open:border-b data-open:pb-4">
            <div className="flex items-center gap-2">
              <ZapIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
              <span className="text-base/7 font-semibold">Insights</span>
              <span className="hidden sm:inline">|</span>
              <span className="text-muted-foreground hidden truncate sm:inline">AI-generated plan analysis</span>
            </div>
            <span className="text-muted-foreground ml-6 flex h-7 items-center">
              <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
              <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
            </span>
          </DisclosureButton>
          <DisclosurePanel className="space-y-2 pt-4">
            <Text>From Insights, you can generate a comprehensive breakdown of your plan and results with AI.</Text>
            <Text>
              Visit Insights after you&apos;ve finished a Simulator plan, reviewed some of the outputs, and are ready to dive deeper.
            </Text>
            <Text>
              <Strong>Tip:</Strong> Discuss topics from Insights further by returning to your Simulator plan and clicking the{' '}
              <WandSparklesIcon className="text-primary mx-1 inline size-5 shrink-0" aria-label="Ask AI button icon" /> next to{' '}
              <Strong>Results</Strong>.
            </Text>
          </DisclosurePanel>
        </Disclosure>

        <Disclosure as="div" className="border-border/25 border-t pt-4">
          <DisclosureButton className="group data-open:border-border/25 focus-outline flex w-full items-start justify-between text-left transition-opacity duration-150 hover:opacity-75 data-open:border-b data-open:pb-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
              <span className="text-base/7 font-semibold">Links</span>
              <span className="hidden sm:inline">|</span>
              <span className="text-muted-foreground hidden truncate sm:inline">Source code, self-hosting, & Discord</span>
            </div>
            <span className="text-muted-foreground ml-6 flex h-7 items-center">
              <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
              <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
            </span>
          </DisclosureButton>
          <DisclosurePanel className="space-y-2 pt-4">
            <Text>
              Visit the{' '}
              <TextLink href="https://github.com/schelskedevco/ignidash" target="_blank" rel="noopener noreferrer">
                GitHub repository
              </TextLink>{' '}
              for source code and a guide on how to self-host Ignidash with Docker, and join the{' '}
              <TextLink href="https://discord.gg/AVNg9JCNUr" target="_blank" rel="noopener noreferrer">
                Discord server
              </TextLink>{' '}
              to get support, provide feedback, and to stay updated about new features.
            </Text>
            <Text>
              <Strong>Tip:</Strong> Clone the repo and vibe-code features you want to see in Ignidash for yourself with{' '}
              <TextLink href="https://code.claude.com/docs/en/overview" target="_blank" rel="noopener noreferrer">
                Claude Code
              </TextLink>{' '}
              or{' '}
              <TextLink href="https://cursor.com/home" target="_blank" rel="noopener noreferrer">
                Cursor
              </TextLink>
              .
            </Text>
          </DisclosurePanel>
        </Disclosure>
      </DialogBody>

      <DialogActions>
        <Button plain href="/help" className="hidden sm:inline-flex" target="_blank" rel="noopener noreferrer">
          <CircleQuestionMarkIcon data-slot="icon" />
          Help
        </Button>
        <Button color="rose" onClick={onClose}>
          OK, let&apos;s go!
        </Button>
      </DialogActions>
    </>
  );
}
