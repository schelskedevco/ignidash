export type BadgeColor = 'green' | 'red' | 'yellow' | 'gray';

interface BadgeProps {
  color: BadgeColor;
  text: string;
}

export default function Badge({ color, text }: BadgeProps) {
  let bgColor, textColor, fillColor, ringColor;

  switch (color) {
    case 'green':
      bgColor = 'bg-green-100 dark:bg-green-400/10';
      textColor = 'text-green-800 dark:text-green-400';
      fillColor = 'fill-green-400';
      ringColor = 'ring-green-200 dark:ring-green-400/20';
      break;
    case 'red':
      bgColor = 'bg-red-100 dark:bg-red-400/10';
      textColor = 'text-red-800 dark:text-red-400';
      fillColor = 'fill-red-400';
      ringColor = 'ring-red-200 dark:ring-red-400/20';
      break;
    case 'yellow':
      bgColor = 'bg-yellow-100 dark:bg-yellow-400/10';
      textColor = 'text-yellow-800 dark:text-yellow-400';
      fillColor = 'fill-yellow-400';
      ringColor = 'ring-yellow-200 dark:ring-yellow-400/20';
      break;
    case 'gray':
      bgColor = 'bg-gray-100 dark:bg-gray-400/10';
      textColor = 'text-gray-800 dark:text-gray-400';
      fillColor = 'fill-gray-400';
      ringColor = 'ring-gray-200 dark:ring-gray-400/20';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium ring ring-inset ${textColor} ${bgColor} ${ringColor}`}
    >
      <svg viewBox="0 0 6 6" aria-hidden="true" className={`size-1.5 ${fillColor}`}>
        <circle r={3} cx={3} cy={3} />
      </svg>
      {text}
    </span>
  );
}
