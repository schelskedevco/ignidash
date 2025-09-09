'use client';

import { useState } from 'react';
import { ArrowsUpDownIcon, ScaleIcon } from '@heroicons/react/20/solid';

import Card from '@/components/ui/card';
import ButtonGroup from '@/components/ui/button-group';
import type { SimulationResult } from '@/lib/calc/simulation-engine';

import FixedReturnsCashFlowBarChart from '../../charts/legacy/fixed-returns-cash-flow-bar-chart';

interface FixedReturnsCashFlowBarChartCardProps {
  simulation: SimulationResult;
  selectedAge: number;
}

export default function FixedReturnsCashFlowBarChartCard({ simulation, selectedAge }: FixedReturnsCashFlowBarChartCardProps) {
  const [viewMode, setViewMode] = useState<'inflowOutflow' | 'net'>('inflowOutflow');

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold">
          <span className="mr-2">Cash Flow</span>
          <span className="text-muted-foreground">Age {selectedAge}</span>
        </h4>
        <ButtonGroup
          firstButtonText="All Flows"
          firstButtonIcon={<ArrowsUpDownIcon />}
          firstButtonOnClick={() => setViewMode('inflowOutflow')}
          lastButtonText="Net"
          lastButtonIcon={<ScaleIcon />}
          lastButtonOnClick={() => setViewMode('net')}
          defaultActiveButton="first"
        />
      </div>
      <FixedReturnsCashFlowBarChart simulation={simulation} selectedAge={selectedAge} mode={viewMode} />
    </Card>
  );
}
