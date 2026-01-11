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
