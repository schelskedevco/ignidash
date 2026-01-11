'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useState } from 'react';

interface PasswordInputProps {
  passwordType: 'new' | 'current';
  isPasswordReset?: boolean;
}

export default function PasswordInput({ passwordType, isPasswordReset = false }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  let autoComplete: string;
  switch (passwordType) {
    case 'new':
      autoComplete = 'new-password';
      break;
    case 'current':
      autoComplete = 'current-password';
      break;
  }

  return (
    <div>
      <label htmlFor="password" className="block text-sm/6 font-medium text-stone-900 dark:text-white">
        {isPasswordReset ? 'New Password' : 'Password'}
      </label>
      <div className="relative mt-2">
        <input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          className="block w-full rounded-md bg-white px-3 py-1.5 pr-10 text-base text-stone-900 outline-1 -outline-offset-1 outline-stone-400 placeholder:text-stone-400 focus:outline-2 focus:-outline-offset-2 focus:outline-rose-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/25 dark:placeholder:text-stone-500 dark:focus:outline-rose-500"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="focus-outline absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
