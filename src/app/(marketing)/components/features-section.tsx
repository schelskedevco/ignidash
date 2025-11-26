import { ArrowPathIcon, ChartBarIcon, BeakerIcon, BanknotesIcon, AcademicCapIcon, ShieldCheckIcon } from '@heroicons/react/20/solid';

const features = [
  {
    name: 'Compare scenarios.',
    description: 'Create up to 10 different plans and compare them side by side to find your optimal path forward.',
    icon: ChartBarIcon,
  },
  {
    name: 'Understand your taxes.',
    description: 'See tax estimates for each year of your plan so you can make informed decisions about contributions and withdrawals.',
    icon: BanknotesIcon,
  },
  {
    name: 'Test resilience.',
    description: 'Run Monte Carlo simulations to understand what could derail your plan and your overall probability of success.',
    icon: ArrowPathIcon,
  },
  {
    name: 'Learn from history.',
    description: 'Stress-test your plan against decades of real market data to see how it would have performed.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Optimize your strategy.',
    description: 'Experiment with different investment approaches, account types, and contribution sequences to maximize your outcomes.',
    icon: BeakerIcon,
  },
  {
    name: 'Your data, your control.',
    description: 'No account syncing means you enter what matters and can delete it anytime. Track your net worth on your terms.',
    icon: ShieldCheckIcon,
  },
];

export default function FeaturesSection() {
  return (
    <div className="bg-white py-24 sm:py-32 dark:bg-zinc-800">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-base/7 font-semibold text-rose-600 dark:text-rose-400">Built for everyone</h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-5xl dark:text-white">
            No expertise? No problem.
          </p>
          <p className="mt-6 text-lg/8 text-zinc-700 dark:text-zinc-300">
            Plan your financial future with confidence. Our AI guides you through complex decisions and teaches you core concepts along the
            way.
          </p>
        </div>
        <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 text-base/7 text-zinc-600 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-16 dark:text-zinc-400">
          {features.map((feature) => (
            <div key={feature.name} className="relative pl-9">
              <dt className="inline font-semibold text-zinc-900 dark:text-white">
                <feature.icon aria-hidden="true" className="absolute top-1 left-1 size-5 text-rose-600 dark:text-rose-500" />
                {feature.name}
              </dt>{' '}
              <dd className="inline">{feature.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
