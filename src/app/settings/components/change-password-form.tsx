'use client';

import { useState } from 'react';
import { LockIcon } from 'lucide-react';

import Card from '@/components/ui/card';
import { Input } from '@/components/catalyst/input';
import { Fieldset, FieldGroup, Field, Label, Legend, ErrorMessage } from '@/components/catalyst/fieldset';
import { Button } from '@/components/catalyst/button';
import { DialogActions } from '@/components/catalyst/dialog';
import { authClient } from '@/lib/auth-client';
import { useAccountSettingsFieldState } from '@/hooks/use-account-settings-field-state';

interface ChangePasswordFormProps {
  showSuccessNotification: (title: string, desc?: string) => void;
}

export default function ChangePasswordForm({ showSuccessNotification }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { fieldState: passwordFieldState, createCallbacks: createPasswordCallbacks } = useAccountSettingsFieldState();
  const handlePasswordSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await authClient.changePassword(
      { currentPassword, newPassword, revokeOtherSessions: true },
      createPasswordCallbacks(() => {
        setCurrentPassword('');
        setNewPassword('');
        showSuccessNotification('Password changed successfully!');
      })
    );
  };

  return (
    <Card className="my-6">
      <form onSubmit={handlePasswordSave}>
        <Fieldset>
          <Legend className="flex items-center gap-2">
            <LockIcon className="text-primary h-6 w-6" aria-hidden="true" />
            Change password
          </Legend>
          <FieldGroup>
            <Field className="flex-1">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                name="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                invalid={!!passwordFieldState.errorMessage}
                aria-invalid={!!passwordFieldState.errorMessage}
              />
            </Field>
            <Field className="flex-1">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                invalid={!!passwordFieldState.errorMessage}
                aria-invalid={!!passwordFieldState.errorMessage}
              />
              {passwordFieldState.errorMessage && <ErrorMessage>{passwordFieldState.errorMessage}</ErrorMessage>}
            </Field>
            <DialogActions>
              <Button color="rose" type="submit" disabled={!currentPassword || !newPassword || passwordFieldState.isLoading}>
                {passwordFieldState.isLoading ? 'Saving...' : 'Save'}
              </Button>
            </DialogActions>
          </FieldGroup>
        </Fieldset>
      </form>
    </Card>
  );
}
