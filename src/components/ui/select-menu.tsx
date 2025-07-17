'use client';

import { ChevronDownIcon } from '@heroicons/react/16/solid';

interface SelectMenuProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
  desc?: string | React.ReactNode;
}

export default function SelectMenu({ id, label, value, onChange, options, desc }: SelectMenuProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm/6 font-medium">
        {label}
      </label>
      <div className="mt-2 grid grid-cols-1">
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden="true"
          className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
        />
      </div>
      {desc && <p className="text-muted-foreground mt-2 text-xs">{desc}</p>}
    </div>
  );
}
