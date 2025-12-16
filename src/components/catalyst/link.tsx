/**
 * TODO: Update this component to use your client-side framework's link
 * component. We've provided examples of how to do this for Next.js, Remix, and
 * Inertia.js in the Catalyst documentation:
 *
 * https://catalyst.tailwindui.com/docs#client-side-router-integration
 */

import { DataInteractive } from '@headlessui/react';
import NextLink, { type LinkProps } from 'next/link';
import React, { forwardRef } from 'react';

export const Link = forwardRef(function Link(
  props: LinkProps & React.ComponentPropsWithoutRef<'a'>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  return (
    <DataInteractive>
      <NextLink {...props} ref={ref} />
    </DataInteractive>
  );
});
