import { CircleQuestionMarkIcon } from 'lucide-react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline';

import { Divider } from '@/components/catalyst/divider';

const faqs = [
  {
    question: "What's the best thing about Switzerland?",
    answer:
      "I don't know, but the flag is a big plus. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas cupiditate laboriosam fugiat.",
  },
  {
    question: 'How do you make holy water?',
    answer:
      'You boil the hell out of it. Lorem ipsum dolor sit amet consectetur adipisicing elit. Magnam aut tempora vitae odio inventore fuga aliquam nostrum quod porro. Delectus quia facere id sequi expedita natus.',
  },
  {
    question: 'What do you call someone with no body and no nose?',
    answer:
      'Nobody knows. Lorem ipsum dolor sit amet consectetur adipisicing elit. Culpa, voluptas ipsa quia excepturi, quibusdam natus exercitationem sapiente tempore labore voluptatem.',
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
      <div className="mx-auto max-w-4xl">
        <div className="my-8">
          <div className="flex items-center gap-4">
            <CircleQuestionMarkIcon className="text-primary h-12 w-12" />
            <div>
              <h1 className="mb-2 text-3xl font-bold">Help Center</h1>
              <p className="text-muted-foreground text-sm">Last updated: November 29, 2025</p>
            </div>
          </div>
        </div>
        <Divider className="my-8" />
        <dl className="divide-y divide-zinc-900/10 dark:divide-white/10">
          {faqs.map((faq) => (
            <Disclosure key={faq.question} as="div" className="py-6 first:pt-0 last:pb-0">
              <dt>
                <DisclosureButton className="group flex w-full items-start justify-between text-left text-zinc-900 dark:text-white">
                  <span className="text-base/7 font-semibold">{faq.question}</span>
                  <span className="ml-6 flex h-7 items-center">
                    <PlusSmallIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                    <MinusSmallIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                  </span>
                </DisclosureButton>
              </dt>
              <DisclosurePanel as="dd" className="mt-2 pr-12">
                <p className="text-base/7 text-zinc-600 dark:text-zinc-400">{faq.answer}</p>
              </DisclosurePanel>
            </Disclosure>
          ))}
        </dl>
      </div>
    </main>
  );
}
