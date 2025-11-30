import { CircleQuestionMarkIcon } from 'lucide-react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline';

import { Text, TextLink } from '@/components/catalyst/text';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { Divider } from '@/components/catalyst/divider';

const faqs = [
  {
    question: 'How can I work around the lack of debt modeling?',
    answer: 'Enter your monthly debt payment as a regular expense.',
  },
  {
    question: 'How can I check my vulnerability to sequence of returns risk?',
    answer:
      'You have two good options. First, you can use the Historical Returns Simulation Mode (in Simulation Settings) with Historical Retirement Start Year set to a historical year with a market crash, like 1929 for the Great Depression. This will make the market crash in your simulation at the same time as your retirement, which is the classic sequence of returns risk scenario. Second, you can use one of the two Monte Carlo Simulation Modes and check your Success %. You can drill down into failed simulations from the table at the bottom of Simulator Results by sorting by Success.',
  },
  {
    question: 'What is the recommended workflow for Ignidash?',
    answer: '...',
  },
  {
    question: 'Why do you never see elephants hiding in trees?',
    answer: "Because they're so good at it. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas cupiditate laboriosam fugiat.",
  },
  {
    question: "Why can't you hear a pterodactyl go to the bathroom?",
    answer:
      'Because the pee is silent. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ipsam, quas voluptatibus ex culpa ipsum, aspernatur blanditiis fugiat ullam magnam suscipit deserunt illum natus facilis atque vero consequatur! Quisquam, debitis error.',
  },
  {
    question: 'Why did the invisible man turn down the job offer?',
    answer:
      "He couldn't see himself doing it. Lorem ipsum dolor sit, amet consectetur adipisicing elit. Eveniet perspiciatis officiis corrupti tenetur. Temporibus ut voluptatibus, perferendis sed unde rerum deserunt eius.",
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
              <p className="text-muted-foreground text-sm">Last updated: November 29, 2025</p>
            </div>
          </div>
        </div>
        <Divider soft />
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl dark:text-white">Frequently asked questions</h2>
            <Text className="mt-2">
              For any questions not covered by Help Center, please email me directly at{' '}
              <TextLink href="mailto:joe@schelske.dev">joe@schelske.dev</TextLink> or join the{' '}
              <TextLink href="https://discord.gg/AVNg9JCNUr">Discord server</TextLink>—I&apos;ll be there, and hopefully by the time
              you&apos;re reading this, other users will be too!
            </Text>
          </div>
          <dl className="divide-y divide-zinc-900/10 dark:divide-white/10">
            {faqs.map((faq) => (
              <Disclosure key={faq.question} as="div" className="py-6 first:pt-0 last:pb-0">
                <dt>
                  <DisclosureButton className="group flex w-full items-start justify-between text-left text-zinc-900 dark:text-white">
                    <span className="text-sm/7 font-semibold">{faq.question}</span>
                    <span className="ml-6 flex h-7 items-center">
                      <PlusSmallIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                      <MinusSmallIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                    </span>
                  </DisclosureButton>
                </dt>
                <DisclosurePanel as="dd" className="mt-2 pr-12">
                  <p className="text-sm/7 text-zinc-600 dark:text-zinc-400">{faq.answer}</p>
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
              Ignidash is in early beta and actively under development. While the core simulation engine is reliable, there are some
              features and scenarios not yet supported. I&apos;m working to add these over the coming months. If something critical is
              missing for your planning needs, please let me know!
            </Text>
          </div>
          <DescriptionList>
            <DescriptionTerm>Configurable drawdown order</DescriptionTerm>
            <DescriptionDetails>Q1 2026</DescriptionDetails>

            <DescriptionTerm>Configurable rebalancing rules</DescriptionTerm>
            <DescriptionDetails>Q1 2026</DescriptionDetails>

            <DescriptionTerm>Modeling debt in Simulator</DescriptionTerm>
            <DescriptionDetails>Q1 2026</DescriptionDetails>

            <DescriptionTerm>Modeling physical assets in Simulator</DescriptionTerm>
            <DescriptionDetails>Q1 2026</DescriptionDetails>

            <DescriptionTerm>State & local taxes</DescriptionTerm>
            <DescriptionDetails>Q1 2026</DescriptionDetails>

            <DescriptionTerm>Roth conversions & SEPP</DescriptionTerm>
            <DescriptionDetails>Q2 2026</DescriptionDetails>

            <DescriptionTerm>Custom financial goals & milestones</DescriptionTerm>
            <DescriptionDetails>Q2 2026</DescriptionDetails>
          </DescriptionList>
        </div>
      </div>
    </main>
  );
}
