import { ArrowPathIcon, ChartBarIcon, BeakerIcon, BanknotesIcon, AcademicCapIcon, ShieldCheckIcon } from '@heroicons/react/20/solid';

const sectionHeader = {
  eyebrow: 'Plan with confidence',
  headline: 'Tools to plan. AI to understand.',
  subhead: 'Model your path to FIRE (and beyond), stress-test your assumptions, and learn about concepts that matter—all in one place.',
};

const features = [
  {
    name: 'Compare paths.',
    description: 'Create multiple plans and view key results side-by-side to see how different choices shape your future.',
    icon: ChartBarIcon,
  },
  {
    name: 'Estimate taxes.',
    description: 'See projected taxes year by year so you can time contributions and withdrawals wisely.',
    icon: BanknotesIcon,
  },
  {
    name: 'Stress-test with simulations.',
    description: 'Run Monte Carlo analysis to understand your probability of success across hundreds of market outcomes.',
    icon: ArrowPathIcon,
  },
  {
    name: 'Learn from real history.',
    description: 'Replay your plan against decades of actual market data to see how it would have held up.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Refine your strategy.',
    description: 'Experiment with account types, contribution order, and withdrawal sequences to find what works.',
    icon: BeakerIcon,
  },
  {
    name: 'Stay in control.',
    description: 'No account linking required. Enter what you want and delete it anytime.',
    icon: ShieldCheckIcon,
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
              <dt className="inline font-semibold text-zinc-900 dark:text-white">
                <feature.icon aria-hidden="true" className="absolute top-1 left-1 size-5 text-rose-600 dark:text-rose-400" />
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
