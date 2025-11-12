'use client';

import Image from 'next/image';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronRightIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

const statuses = {
  offline: 'text-zinc-400 bg-zinc-100 dark:text-zinc-500 dark:bg-zinc-100/10',
  online: 'text-green-500 bg-green-500/10 dark:text-green-400 dark:bg-green-400/10',
  error: 'text-rose-500 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-400/10',
};
const environments = {
  Preview: 'text-zinc-500 bg-zinc-50 ring-zinc-200 dark:text-zinc-400 dark:bg-zinc-400/10 dark:ring-zinc-400/20',
  Production: 'text-rose-500 bg-rose-50 ring-rose-200 dark:text-rose-400 dark:bg-rose-400/10 dark:ring-rose-400/30',
};
const deployments = [
  {
    id: 1,
    href: '#',
    projectName: 'ios-app',
    teamName: 'Planetaria',
    status: 'offline',
    statusText: 'Initiated 1m 32s ago',
    description: 'Deploys from GitHub',
    environment: 'Preview',
  },
  {
    id: 2,
    href: '#',
    projectName: 'mobile-api',
    teamName: 'Planetaria',
    status: 'online',
    statusText: 'Deployed 3m ago',
    description: 'Deploys from GitHub',
    environment: 'Production',
  },
  {
    id: 3,
    href: '#',
    projectName: 'tailwindcss.com',
    teamName: 'Tailwind Labs',
    status: 'offline',
    statusText: 'Deployed 3h ago',
    description: 'Deploys from GitHub',
    environment: 'Preview',
  },
  {
    id: 4,
    href: '#',
    projectName: 'company-website',
    teamName: 'Tailwind Labs',
    status: 'online',
    statusText: 'Deployed 1d ago',
    description: 'Deploys from GitHub',
    environment: 'Preview',
  },
  {
    id: 5,
    href: '#',
    projectName: 'relay-service',
    teamName: 'Protocol',
    status: 'online',
    statusText: 'Deployed 1d ago',
    description: 'Deploys from GitHub',
    environment: 'Production',
  },
  {
    id: 6,
    href: '#',
    projectName: 'android-app',
    teamName: 'Planetaria',
    status: 'online',
    statusText: 'Deployed 5d ago',
    description: 'Deploys from GitHub',
    environment: 'Preview',
  },
  {
    id: 7,
    href: '#',
    projectName: 'api.protocol.chat',
    teamName: 'Protocol',
    status: 'error',
    statusText: 'Failed to deploy 6d ago',
    description: 'Deploys from GitHub',
    environment: 'Preview',
  },
  {
    id: 8,
    href: '#',
    projectName: 'planetaria.tech',
    teamName: 'Planetaria',
    status: 'online',
    statusText: 'Deployed 6d ago',
    description: 'Deploys from GitHub',
    environment: 'Preview',
  },
];
const activityItems = [
  {
    user: {
      name: 'Michael Foster',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    projectName: 'ios-app',
    commit: '2d89f0c8',
    branch: 'main',
    date: '1h',
    dateTime: '2023-01-23T11:00',
  },
  {
    user: {
      name: 'Lindsay Walton',
      imageUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    projectName: 'mobile-api',
    commit: '249df660',
    branch: 'main',
    date: '3h',
    dateTime: '2023-01-23T09:00',
  },
  {
    user: {
      name: 'Courtney Henry',
      imageUrl:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    projectName: 'ios-app',
    commit: '11464223',
    branch: 'main',
    date: '12h',
    dateTime: '2023-01-23T00:00',
  },
  {
    user: {
      name: 'Courtney Henry',
      imageUrl:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    projectName: 'company-website',
    commit: 'dad28e95',
    branch: 'main',
    date: '2d',
    dateTime: '2023-01-21T13:00',
  },
  {
    user: {
      name: 'Michael Foster',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    projectName: 'relay-service',
    commit: '624bc94c',
    branch: 'main',
    date: '5d',
    dateTime: '2023-01-18T12:34',
  },
  {
    user: {
      name: 'Courtney Henry',
      imageUrl:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    projectName: 'api.protocol.chat',
    commit: 'e111f80e',
    branch: 'main',
    date: '1w',
    dateTime: '2023-01-16T15:54',
  },
  {
    user: {
      name: 'Michael Foster',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    projectName: 'api.protocol.chat',
    commit: '5e136005',
    branch: 'main',
    date: '1w',
    dateTime: '2023-01-16T11:31',
  },
  {
    user: {
      name: 'Whitney Francis',
      imageUrl:
        'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    projectName: 'ios-app',
    commit: '5c1fd07f',
    branch: 'main',
    date: '2w',
    dateTime: '2023-01-09T08:45',
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Example() {
  return (
    <>
      <div className="-mx-2 sm:-mx-3 lg:-mx-4 lg:pr-96">
        <header className="from-emphasized-background to-background border-border/50 flex items-center justify-between border-b bg-gradient-to-l px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <h1 className="text-base/7 font-semibold text-zinc-900 dark:text-white">Simulations</h1>
          <Menu as="div" className="relative">
            <MenuButton className="flex items-center gap-x-1 text-sm/6 font-medium text-zinc-900 dark:text-white">
              Sort by
              <ChevronUpDownIcon aria-hidden="true" className="size-5 text-zinc-500" />
            </MenuButton>
            <MenuItems
              transition
              className="absolute right-0 z-10 mt-2.5 w-40 origin-top-right rounded-md bg-white py-2 shadow-lg outline-1 outline-zinc-900/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:bg-zinc-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
            >
              <MenuItem>
                <a
                  href="#"
                  className="block px-3 py-1 text-sm/6 text-zinc-900 data-focus:bg-zinc-50 data-focus:outline-hidden dark:text-white dark:data-focus:bg-white/5"
                >
                  Name
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href="#"
                  className="block px-3 py-1 text-sm/6 text-zinc-900 data-focus:bg-zinc-50 data-focus:outline-hidden dark:text-white dark:data-focus:bg-white/5"
                >
                  Date updated
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href="#"
                  className="block px-3 py-1 text-sm/6 text-zinc-900 data-focus:bg-zinc-50 data-focus:outline-hidden dark:text-white dark:data-focus:bg-white/5"
                >
                  Environment
                </a>
              </MenuItem>
            </MenuItems>
          </Menu>
        </header>
        <ul role="list" className="divide-border/25 divide-y">
          {deployments.map((deployment) => (
            <li key={deployment.id} className="relative flex items-center space-x-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="min-w-0 flex-auto">
                <div className="flex items-center gap-x-3">
                  <div className={classNames(statuses[deployment.status as keyof typeof statuses], 'flex-none rounded-full p-1')}>
                    <div className="size-2 rounded-full bg-current" />
                  </div>
                  <h2 className="min-w-0 text-sm/6 font-semibold text-zinc-900 dark:text-white">
                    <a href={deployment.href} className="flex gap-x-2">
                      <span className="truncate">{deployment.teamName}</span>
                      <span className="text-zinc-400">/</span>
                      <span className="whitespace-nowrap">{deployment.projectName}</span>
                      <span className="absolute inset-0" />
                    </a>
                  </h2>
                </div>
                <div className="mt-3 flex items-center gap-x-2.5 text-xs/5 text-zinc-500 dark:text-zinc-400">
                  <p className="truncate">{deployment.description}</p>
                  <svg viewBox="0 0 2 2" className="size-0.5 flex-none fill-zinc-300 dark:fill-zinc-500">
                    <circle r={1} cx={1} cy={1} />
                  </svg>
                  <p className="whitespace-nowrap">{deployment.statusText}</p>
                </div>
              </div>
              <div
                className={classNames(
                  environments[deployment.environment as keyof typeof environments],
                  'flex-none rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset'
                )}
              >
                {deployment.environment}
              </div>
              <ChevronRightIcon aria-hidden="true" className="size-5 flex-none text-zinc-400" />
            </li>
          ))}
        </ul>
      </div>
      <aside className="lg:border-border/50 -mx-2 bg-zinc-50 sm:-mx-3 lg:fixed lg:top-[4.3125rem] lg:right-0 lg:bottom-0 lg:mx-0 lg:w-96 lg:overflow-y-auto lg:border-l dark:bg-black/10">
        <header className="from-emphasized-background to-background border-border/50 flex items-center justify-between border-b bg-gradient-to-l px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <h2 className="text-base/7 font-semibold text-zinc-900 dark:text-white">Your Finances</h2>
          <a href="#" className="text-sm/6 font-semibold text-rose-600 dark:text-rose-400">
            View all
          </a>
        </header>
        <ul role="list" className="divide-border/25 divide-y">
          {activityItems.map((item) => (
            <li key={item.commit} className="px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-x-3">
                <Image
                  width={24}
                  height={24}
                  alt=""
                  src={item.user.imageUrl}
                  className="size-6 flex-none rounded-full bg-zinc-100 outline -outline-offset-1 outline-black/5 dark:bg-zinc-800 dark:outline-white/10"
                />
                <h3 className="flex-auto truncate text-sm/6 font-semibold text-zinc-900 dark:text-white">{item.user.name}</h3>
                <time dateTime={item.dateTime} className="flex-none text-xs text-zinc-500 dark:text-zinc-600">
                  {item.date}
                </time>
              </div>
              <p className="mt-3 truncate text-sm text-zinc-500">
                Pushed to <span className="text-zinc-700 dark:text-zinc-400">{item.projectName}</span> (
                <span className="font-mono text-zinc-700 dark:text-zinc-400">{item.commit}</span> on{' '}
                <span className="text-zinc-700 dark:text-zinc-400">{item.branch}</span>)
              </p>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
