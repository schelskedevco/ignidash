'use client';

import Link from 'next/link';
import { SparklesIcon } from 'lucide-react';
import { motion } from 'framer-motion';

import { Heading } from '@/components/catalyst/heading';
import { useInsightsSelectedPlan } from '@/lib/stores/simulator-store';

interface PulseButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

function PulseButton({ onClick, disabled = false }: PulseButtonProps) {
  const rings = 4;
  const buttonSize = 120;
  const gap = 30;

  return (
    <div className="relative grid place-items-center">
      {Array.from({ length: rings }, (_, i) => {
        const isButton = i === 0;
        const ringSize = buttonSize + gap * i;

        if (isButton) {
          return (
            <motion.button
              key={i}
              onClick={onClick}
              disabled={disabled}
              className="bg-emphasized-background hover:bg-background text-foreground z-10 col-start-1 row-start-1 flex h-30 w-30 flex-col items-center justify-center gap-2 rounded-full font-medium shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              whileHover={disabled ? undefined : { scale: 1.05 }}
              whileTap={disabled ? undefined : { scale: 0.95 }}
            >
              <SparklesIcon className="text-primary h-10 w-10" />
              <span className="text-foreground text-sm/6 font-medium">Generate</span>
            </motion.button>
          );
        }

        return (
          <motion.div
            key={i}
            className="col-start-1 row-start-1 aspect-square rounded-full"
            style={{
              width: ringSize,
              background: 'radial-gradient(50% 50% at 50% 50%, rgba(244, 63, 94, 0.25) 0%, rgba(251, 113, 133, 0.15) 100%)',
              border: '2px solid rgba(244, 63, 94, 0.5)',
              zIndex: rings - i,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0], scale: 1.1 }}
            transition={{
              duration: 3.4 + 0.8 * (rings - i),
              delay: 0.8 * i,
              ease: [0.05, 0.6, 0.3, 0.3],
              repeat: Infinity,
              repeatDelay: 0.8 * i,
            }}
          />
        );
      })}
    </div>
  );
}

export default function AIOutput() {
  const selectedPlan = useInsightsSelectedPlan();

  const handleGenerate = () => {
    console.log('Generating insights for: ', selectedPlan?.name);
  };

  return (
    <div className="-mx-2 h-full sm:-mx-3 lg:-mx-4 lg:pr-96">
      <header className="from-emphasized-background to-background border-border/50 flex items-center justify-between border-b bg-gradient-to-l px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {selectedPlan ? (
          <Heading level={3}>
            Insights for{' '}
            <Link
              href={`/dashboard/simulator/${selectedPlan?.id}`}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {selectedPlan?.name}
            </Link>
          </Heading>
        ) : (
          <Heading level={3}>
            Select a plan <span aria-hidden="true">&rarr;</span>
          </Heading>
        )}
      </header>
      <div className="flex h-full flex-col items-center justify-center">
        <PulseButton onClick={handleGenerate} />
      </div>
    </div>
  );
}
