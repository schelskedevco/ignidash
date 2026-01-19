'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogPanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { FireIcon } from '@heroicons/react/24/solid';
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react';

import { useThemeSwitcher } from '@/hooks/use-theme-switcher';

const navigation = [
  { name: 'Features', href: '/#features' },
  { name: 'FAQ', href: '/#faq' },
  { name: 'Pricing', href: '/pricing' },
];

function NavbarModeToggle() {
  const themeSwitcher = useThemeSwitcher();
  if (!themeSwitcher) return null;

  const { newTheme, label, icon: Icon, setTheme } = themeSwitcher;

  return (
    <button type="button" aria-label={label} onClick={() => setTheme(newTheme)} className="focus-outline rounded-full">
      <Icon aria-hidden="true" className="size-6 shrink-0" />
    </button>
  );
}

function SidebarModeToggle() {
  const themeSwitcher = useThemeSwitcher();
  if (!themeSwitcher) return null;

  const { newTheme, label, setTheme } = themeSwitcher;

  return (
    <button className="w-full text-left" onClick={() => setTheme(newTheme)}>
      <span className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-stone-900 hover:bg-stone-50 dark:text-white dark:hover:bg-white/5">
        {label}
      </span>
    </button>
  );
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Ignidash</span>
            <div className="flex items-center gap-2">
              <FireIcon className="text-primary h-8 w-8" aria-hidden="true" />
              <span className="text-xl font-semibold">Ignidash</span>
            </div>
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-stone-700 dark:text-stone-200"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} className="text-sm/6 font-semibold">
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-6 lg:flex lg:flex-1 lg:justify-end">
          <a href="https://github.com/schelskedevco/ignidash" target="_blank" rel="noopener noreferrer" aria-label="GitHub repository">
            <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" className="text-foreground/90 size-6 shrink-0">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </a>
          <a href="https://x.com/schelskedevco" target="_blank" rel="noopener noreferrer" aria-label="GitHub repository">
            <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" className="text-foreground/90 size-6 shrink-0">
              <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
            </svg>
          </a>
          <NavbarModeToggle />
          <AuthLoading>
            <span className="text-sm/6 font-semibold">Loading...</span>
          </AuthLoading>
          <Unauthenticated>
            <Link href="/signin" className="text-sm/6 font-semibold">
              Sign in <span aria-hidden="true">&rarr;</span>
            </Link>
          </Unauthenticated>
          <Authenticated>
            <Link href="/dashboard" className="text-sm/6 font-semibold">
              Dashboard <span aria-hidden="true">&rarr;</span>
            </Link>
          </Authenticated>
        </div>
      </nav>
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-stone-900/10 dark:bg-stone-900 dark:sm:ring-stone-100/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Ignidash</span>
              <div className="flex items-center gap-2">
                <FireIcon className="text-primary h-8 w-8" aria-hidden="true" />
                <span className="text-xl font-semibold">Ignidash</span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-stone-700 dark:text-stone-200"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-stone-500/10 dark:divide-white/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-stone-900 hover:bg-stone-50 dark:text-white dark:hover:bg-white/5"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="space-y-2 py-6">
                <SidebarModeToggle />
                <AuthLoading>
                  <span className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-stone-900 hover:bg-stone-50 dark:text-white dark:hover:bg-white/5">
                    Loading...
                  </span>
                </AuthLoading>
                <Unauthenticated>
                  <Link
                    href="/signin"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-stone-900 hover:bg-stone-50 dark:text-white dark:hover:bg-white/5"
                  >
                    Sign in
                  </Link>
                </Unauthenticated>
                <Authenticated>
                  <Link
                    href="/dashboard"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-stone-900 hover:bg-stone-50 dark:text-white dark:hover:bg-white/5"
                  >
                    Dashboard
                  </Link>
                </Authenticated>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}
