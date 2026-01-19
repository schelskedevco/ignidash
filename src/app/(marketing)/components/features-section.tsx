import { SparklesIcon, LightBulbIcon, ArrowPathIcon, ChartBarIcon, BanknotesIcon, ShieldCheckIcon } from '@heroicons/react/20/solid';

import { Badge, BadgeButton } from '@/components/catalyst/badge';

const sectionHeader = {
  eyebrow: 'Everything you need',
  headline: (
    <>
      Not an expert? <span className="bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent">No problem</span>.
    </>
  ),
  subhead: (
    <>
      With intuitive tools and AI assistance, creating a comprehensive retirement plan you{' '}
      <span className="text-stone-700 underline decoration-stone-300 underline-offset-4 dark:text-stone-100 dark:decoration-stone-600">
        feel confident about
      </span>{' '}
      has never been easier.
    </>
  ),
};

const features = [
  {
    name: 'Chat with AI.',
    description: 'Use AI to ask questions, clarify results, and learn about retirement planning concepts and principles.',
    icon: SparklesIcon,
    pro: true,
  },
  {
    name: 'Automatic insights.',
    description: 'Generate an AI educational overview of your plan to understand the financial topics that matter most to you.',
    icon: LightBulbIcon,
    pro: true,
  },
  {
    name: 'Test your resilience.',
    description: 'Run Monte Carlo simulations and historical backtests to identify risks and calculate your probability of success.',
    icon: ArrowPathIcon,
    status: 'ready',
  },
  {
    name: 'Compare paths.',
    description: 'Create up to 10 plans and view key outcomes side-by-side to see how different choices affect your future.',
    icon: ChartBarIcon,
    status: 'coming-soon',
  },
  {
    name: 'Understand tax implications.',
    description: 'Model how withdrawals, asset location, and income changes impact your estimated tax liability.',
    icon: BanknotesIcon,
    status: 'ready',
  },
  {
    name: 'You control your data.',
    description: 'No account linking required. Manually enter the financial data you want and delete it anytime.',
    icon: ShieldCheckIcon,
    status: 'ready',
  },
];

export default function FeaturesSection() {
  return (
    <div className="bg-white py-24 sm:py-32 dark:bg-stone-800" id="features">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-base/7 font-semibold text-rose-600 dark:text-rose-400">{sectionHeader.eyebrow}</h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-stone-900 sm:text-5xl dark:text-white">
            {sectionHeader.headline}
          </p>
          <p className="mt-6 text-lg/8 text-stone-700 dark:text-stone-300">{sectionHeader.subhead}</p>
        </div>
        <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 text-base/7 text-stone-600 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-16 dark:text-stone-400">
          {features.map((feature) => (
            <div key={feature.name} className="relative pl-9">
              <dt className="inline-flex items-center font-semibold text-stone-900 dark:text-white">
                <feature.icon aria-hidden="true" className="absolute top-1 left-1 size-5 text-rose-600 dark:text-rose-400" />
                {feature.name}
                {feature.status === 'coming-soon' && (
                  <Badge color="rose" className="ml-3">
                    Coming Soon
                  </Badge>
                )}
                {feature.pro && (
                  <BadgeButton color="rose" href="/pricing" className="ml-3">
                    Pro
                  </BadgeButton>
                )}
              </dt>{' '}
              <dd>{feature.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
