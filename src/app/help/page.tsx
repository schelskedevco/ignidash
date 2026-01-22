import type { Metadata } from 'next';
import { CircleQuestionMarkIcon } from 'lucide-react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline';

import { Text, TextLink } from '@/components/catalyst/text';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { Divider } from '@/components/catalyst/divider';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Get answers to common questions about Ignidash, learn how to use the simulator, and see what features are coming soon.',
  openGraph: {
    title: 'Help Center - Ignidash',
    description: 'Get answers to common questions about Ignidash, learn how to use the simulator, and see what features are coming soon.',
  },
};

const faqs = [
  {
    question: 'How should I get started with Ignidash?',
    answer: (
      <>
        If you would like to see a demo plan for Simulator to quickly explore the tool, create a new plan with the{' '}
        <strong className="underline">Demo Plan</strong> template of your choosing. This can be done with the Create button in Dashboard.
        <br />
        <br />
        Once you&apos;re ready to work on your own plan, create a new one or use the blank plan that was created automatically when you
        opened your account. I recommend customizing your Numbers with a{' '}
        <strong className="underline">Fixed Returns Simulation Mode</strong> until the Results are to your liking. After that, you can
        explore the other Simulation Modes to see how your plan performs under different market conditions and assumptions.
        <br />
        <br />
        The <strong className="underline">Monte Carlo modes</strong> are particularly useful for understanding the range of possible
        outcomes. You can drill down into full individual simulations by clicking on rows in the table at the bottom of Results.{' '}
        <strong>Tip:</strong> To find relevant simulations to explore, sort the table by metrics you care about!
      </>
    ),
  },
  {
    question: 'How can I check my vulnerability to sequence of returns risk?',
    answer: (
      <>
        You have two good options.
        <br />
        <br />
        First, you can use the <strong className="underline">Historical Returns Simulation Mode</strong> (in Simulation Settings) with{' '}
        <strong className="underline">Historical Retirement Start Year</strong> set to a historical year with a market crash, like 1929 for
        the Great Depression. This will make the market crash in your simulation at the same time as your retirement, which is the classic
        sequence of returns risk scenario.
        <br />
        <br />
        Second, you can use one of the two <strong className="underline">Monte Carlo Simulation Modes</strong> to check your Success %
        across 500 simulations. You can then drill down into failed simulations from the table at the bottom of Results by sorting by the
        Success column and clicking on one of the rows for a failed simulation. Chances are high that many of the failed simulations will
        involve market crashes early in retirement, which you can see from the Returns tab.
      </>
    ),
  },
  {
    question: 'How can I work around the lack of debt modeling?',
    answer: 'Enter your monthly debt payment as a regular expense. You can make it a monthly expense using the Frequency input.',
  },
  {
    question: 'How can I try out different options for incomes or expenses within a single Simulator plan?',
    answer:
      'You can disable (and then re-enable) individual incomes, expenses, and contributions using the Disable button in the three dot menu next to each. This keeps the data in the plan, but excludes it from the simulation results.',
  },
  {
    question: 'Can I choose not to automatically reinvest dividends and interest?',
    answer:
      "No. For now, Ignidash always assumes that dividends and interest are automatically reinvested, which is a common practice. There are currently no plans to change this in the future, but let me know if it's something you'd like.",
  },
  {
    question: "Why doesn't investment income, such as dividends and interest, show up in the Income & Expenses tab?",
    answer: (
      <>
        Since Ignidash automatically reinvests dividends and interest, this investment income never becomes available as cash to spend;
        instead, it immediately contributes to portfolio growth. You can see this growth reflected in your account balances in the Portfolio
        tab and in the Returns tab.
        <br />
        <br />
        If you need to see investment income for tax purposes, check out the Taxes tab. And if you feel strongly about seeing investment
        income in Income & Expenses, feel free to reach out through the contact info at the top of the page!
      </>
    ),
  },
  {
    question: "Why don't retirement distributions, such as 401(k) withdrawals, show up in the Income & Expenses tab?",
    answer: (
      <>
        The Income & Expenses tab is designed to show external money flows like salary, business income, and expenses. Since retirement
        distributions are withdrawals from your accumulated savings rather than new money earned, they&apos;re tracked separately in the
        Withdrawals tab. This keeps Income & Expenses focused on actual income and spending.
        <br />
        <br />
        For tax reporting purposes, you can see all income sources including retirement distributions in the Taxes tab. If you&apos;d prefer
        to see retirement distributions in Income & Expenses as well, let me know through the contact info at the top of the page!
      </>
    ),
  },
];

export default function HelpPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-7xl px-2 pt-[4.25rem] pb-[2.125rem] sm:px-3 lg:px-4">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="mt-8 space-y-8">
          <div className="flex items-center gap-4">
            <CircleQuestionMarkIcon className="text-primary h-12 w-12" />
            <div>
              <h1 className="mb-2 text-3xl font-bold">Help Center</h1>
              <p className="text-muted-foreground text-sm">Last updated: January 19, 2026</p>
            </div>
          </div>
        </div>
        <Divider soft />
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl dark:text-white">Frequently asked questions</h2>
            <Text className="mt-2">
              For any questions not answered by Help Center, please email me directly at{' '}
              <TextLink href="mailto:joe@schelske.dev">joe@schelske.dev</TextLink> or join the{' '}
              <TextLink href="https://discord.gg/AVNg9JCNUr" target="_blank" rel="noopener noreferrer">
                Discord server
              </TextLink>
              —I&apos;ll be there, and hopefully by the time you&apos;re reading this, other users will be too!
            </Text>
          </div>
          <dl className="divide-y divide-stone-900/10 dark:divide-white/10">
            {faqs.map((faq) => (
              <Disclosure key={faq.question} as="div" className="py-6 first:pt-0 last:pb-0">
                <dt>
                  <DisclosureButton className="group flex w-full items-start justify-between text-left text-stone-900 dark:text-white">
                    <span className="text-sm/7 font-semibold">{faq.question}</span>
                    <span className="ml-6 flex h-7 items-center">
                      <PlusSmallIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                      <MinusSmallIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                    </span>
                  </DisclosureButton>
                </dt>
                <DisclosurePanel as="dd" className="mt-2 pr-12">
                  <p className="text-sm/7 text-stone-600 dark:text-stone-400">{faq.answer}</p>
                </DisclosurePanel>
              </Disclosure>
            ))}
          </dl>
        </div>
        <Divider soft />
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl dark:text-white">Known limitations</h2>
            <Text className="mt-2">
              Ignidash is in beta and actively under development. While the core simulation engine is reliable, there are some features and
              scenarios not yet supported. I&apos;m working to add these over the coming months. If something critical is missing for your
              planning needs, please let me know!
            </Text>
          </div>
          <DescriptionList>
            <DescriptionTerm>Configurable drawdown order</DescriptionTerm>
            <DescriptionDetails>Q1 2026</DescriptionDetails>

            <DescriptionTerm>Modeling debt in Simulator</DescriptionTerm>
            <DescriptionDetails>Q1 2026</DescriptionDetails>

            <DescriptionTerm>Modeling physical assets in Simulator</DescriptionTerm>
            <DescriptionDetails>Q1 2026</DescriptionDetails>

            <DescriptionTerm>State & local taxes, IRMAA surcharges</DescriptionTerm>
            <DescriptionDetails>Q1 2026</DescriptionDetails>

            <DescriptionTerm>Roth conversions & SEPP</DescriptionTerm>
            <DescriptionDetails>Q1 2026</DescriptionDetails>

            <DescriptionTerm>Custom financial goals & milestones</DescriptionTerm>
            <DescriptionDetails>Q2 2026</DescriptionDetails>

            <DescriptionTerm>Support for planning as a couple</DescriptionTerm>
            <DescriptionDetails>Q2 2026</DescriptionDetails>

            <DescriptionTerm>Track NW with real-time data</DescriptionTerm>
            <DescriptionDetails>Q2 2026</DescriptionDetails>
          </DescriptionList>
        </div>
      </div>
    </main>
  );
}
