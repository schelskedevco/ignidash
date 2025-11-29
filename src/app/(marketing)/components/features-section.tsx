import { SparklesIcon, LightBulbIcon, ArrowPathIcon, ChartBarIcon, BanknotesIcon, ShieldCheckIcon } from '@heroicons/react/20/solid';

import { Badge } from '@/components/catalyst/badge';

const sectionHeader = {
  eyebrow: 'Everything you need',
  headline: 'Not an expert? No problem.',
  subhead:
    'With intuitive tools and AI assistance, creating a comprehensive retirement plan you can feel confident about has never been easier.',
};

const features = [
  {
    name: 'Chat with AI.',
    description: 'Use AI to ask questions, clarify results, and learn about retirement planning concepts and strategies.',
    icon: SparklesIcon,
    status: 'coming-soon',
  },
  {
    name: 'Automatic insights.',
    description: "Get an assessment of your plan's health in areas like tax efficiency, spending sustainability, and more.",
    icon: LightBulbIcon,
    status: 'coming-soon',
  },
  {
    name: 'Test your resilience.',
    description: 'Run Monte Carlo simulations and historical backtests to calculate your probability of success.',
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
    description: 'Model how different investment approaches and income changes impact your estimated taxes.',
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
    <div className="bg-white py-24 sm:py-32 dark:bg-zinc-800" id="features">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-base/7 font-semibold text-rose-600 dark:text-rose-400">{sectionHeader.eyebrow}</h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-5xl dark:text-white">
            {sectionHeader.headline}
          </p>
          <p className="mt-6 text-lg/8 text-zinc-700 dark:text-zinc-300">{sectionHeader.subhead}</p>
        </div>
        <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 text-base/7 text-zinc-600 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-16 dark:text-zinc-400">
          {features.map((feature) => (
            <div key={feature.name} className="relative pl-9">
              <dt className="inline-flex items-center font-semibold text-zinc-900 dark:text-white">
                <feature.icon aria-hidden="true" className="absolute top-1 left-1 size-5 text-rose-600 dark:text-rose-400" />
                {feature.name}
                {feature.status === 'coming-soon' && <Badge className="ml-3">Coming Soon</Badge>}
              </dt>{' '}
              <dd>{feature.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
