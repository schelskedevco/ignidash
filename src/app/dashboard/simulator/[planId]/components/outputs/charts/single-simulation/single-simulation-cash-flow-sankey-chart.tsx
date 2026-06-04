'use client';

import { useMemo, useRef, useState } from 'react';
import {
  sankey as d3Sankey,
  sankeyLinkHorizontal,
  sankeyCenter,
  type SankeyNodeMinimal,
  type SankeyLinkMinimal,
} from 'd3-sankey';

import { formatCompactCurrency } from '@/lib/utils/number-formatters';
import { ChartEmptyState, TimeSeriesChartContainer } from '../chart-primitives';
import { SANKEY_NODE_COLORS, type SankeyInputData } from '@/lib/calc/data-extractors/sankey-data-extractor';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomNodeProps {
  name: string;
  category: 'income' | 'outflow' | 'intermediary';
}

interface CustomLinkProps {
  sourceName: string;
  targetName: string;
}

type LayoutNode = SankeyNodeMinimal<CustomNodeProps, CustomLinkProps> & CustomNodeProps;
type LayoutLink = SankeyLinkMinimal<CustomNodeProps, CustomLinkProps> & CustomLinkProps;

interface SankeyDiagramProps {
  data: SankeyInputData;
  width?: number;
  height?: number;
}

// ─── Default colors for unnamed nodes ─────────────────────────────────────────

const DEFAULT_INCOME_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
const DEFAULT_OUTFLOW_COLORS = ['var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)', 'var(--chart-1)', 'var(--chart-2)'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getNodeColor = (node: LayoutNode): string => {
  if (node.name === 'Total Income') return 'var(--foreground)';
  return SANKEY_NODE_COLORS[node.name] ?? 'var(--chart-5)';
};

const getLinkColor = (link: LayoutLink): string => {
  const sourceColor = getNodeColor(link.source as LayoutNode);
  // Make links semi-transparent to avoid visual overload
  return sourceColor.replace(')', ' / 0.35)').replace('var(', '').includes('--chart')
    ? `color-mix(in srgb, ${sourceColor} 35%, transparent)`
    : sourceColor;
};

// ─── Gradient ID helper ───────────────────────────────────────────────────────

const gradientId = (linkIndex: number) => `sankey-gradient-${linkIndex}`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function SankeyDiagram({ data, width = 900, height = 500 }: SankeyDiagramProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<{ source: string; target: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { layoutNodes, layoutLinks } = useMemo(() => {
    if (!data.nodes.length || !data.links.length) {
      return { layoutNodes: [], layoutLinks: [] };
    }

    const sankeyLayout = d3Sankey<CustomNodeProps, CustomLinkProps>()
      .nodeWidth(24)
      .nodePadding(12)
      .nodeAlign(sankeyCenter)
      .extent([
        [10, 10],
        [width - 10, height - 10],
      ]);

    // Deep clone to avoid mutation issues
    const graph = sankeyLayout({
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    });

    return {
      layoutNodes: graph.nodes as LayoutNode[],
      layoutLinks: graph.links as LayoutLink[],
    };
  }, [data, width, height]);

  if (!layoutNodes.length) {
    return <ChartEmptyState />;
  }

  const linkPathGenerator = sankeyLinkHorizontal();

  const totalIncomeNode = layoutNodes.find((n) => n.name === 'Total Income');
  const incomeNodes = layoutNodes.filter((n) => n.category === 'income');
  const outflowNodes = layoutNodes.filter((n) => n.category === 'outflow');

  const hasSurplus = data.links
    .filter((l) => l.target === data.nodes.findIndex((n) => n.name === 'Total Income'))
    .reduce((sum, l) => sum + l.value, 0) > 0;

  return (
    <TimeSeriesChartContainer>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        <defs>
          {layoutLinks.map((link, i) => {
            const color = getLinkColor(link);
            return (
              <linearGradient key={i} id={gradientId(i)} gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor={color.replace(' / 0.35)', ' / 0.2)')} />
              </linearGradient>
            );
          })}
        </defs>

        {/* ── Links (flow paths) ── */}
        {layoutLinks.map((link, i) => {
          const path = (linkPathGenerator as (link: unknown) => string | null)(link) ?? '';
          const isHovered =
            hoveredLink !== null &&
            ((link.source as LayoutNode).name === hoveredLink.source && (link.target as LayoutNode).name === hoveredLink.target);

          const opacity = hoveredNode || hoveredLink ? (isHovered ? 0.8 : 0.1) : 0.4;

          return (
            <path
              key={i}
              d={path}
              fill="none"
              stroke={`url(#${gradientId(i)})`}
              strokeOpacity={opacity}
              strokeWidth={Math.max(1, link.width ?? 1)}
              onMouseEnter={() =>
                setHoveredLink({
                  source: (link.source as LayoutNode).name,
                  target: (link.target as LayoutNode).name,
                })
              }
              onMouseLeave={() => setHoveredLink(null)}
              style={{ transition: 'stroke-opacity 0.15s', cursor: 'pointer' }}
            />
          );
        })}

        {/* ── Nodes (rectangles) ── */}
        {layoutNodes.map((node, i) => {
          const x0 = node.x0 ?? 0;
          const x1 = node.x1 ?? 0;
          const y0 = node.y0 ?? 0;
          const y1 = node.y1 ?? 0;
          const nodeValue = node.value ?? 0;
          const color = getNodeColor(node);
          const isHovered = hoveredNode === node.name;
          const opacity = hoveredNode ? (isHovered ? 1 : 0.3) : 0.85;

          // Label placement
          const isIncome = node.category === 'income' || (node.category === 'intermediary' && incomeNodes.includes(node));
          const labelX = isIncome ? x0 - 8 : x1 + 8;
          const textAnchor = isIncome ? 'end' : 'start';

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredNode(node.name)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ transition: 'opacity 0.15s', cursor: 'pointer' }}
            >
              <rect
                x={x0}
                y={y0}
                width={Math.max(1, x1 - x0)}
                height={Math.max(1, y1 - y0)}
                fill={color}
                fillOpacity={opacity}
                stroke={color}
                strokeWidth={0.5}
                rx={3}
                ry={3}
              />
              {node.category !== 'intermediary' && (
                <text
                  x={labelX}
                  y={y0 + (y1 - y0) / 2}
                  dy="0.35em"
                  textAnchor={textAnchor}
                  fill="currentColor"
                  fontSize={12}
                  fontWeight={isHovered ? '600' : '400'}
                >
                  {node.name}
                </text>
              )}
              {node.category === 'intermediary' && (
                <text
                  x={x0 + (x1 - x0) / 2}
                  y={y0 + (y1 - y0) / 2}
                  dy="0.35em"
                  textAnchor="middle"
                  fill="var(--background)"
                  fontSize={11}
                  fontWeight="600"
                >
                  {formatCompactCurrency(nodeValue, 1)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </TimeSeriesChartContainer>
  );
}