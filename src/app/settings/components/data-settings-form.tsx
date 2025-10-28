'use client';

import { useState } from 'react';
import { Trash2Icon } from 'lucide-react';

import Card from '@/components/ui/card';
import { Fieldset, FieldGroup, Field, Legend, Description, ErrorMessage } from '@/components/catalyst/fieldset';
import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/catalyst/alert';
import { Button } from '@/components/catalyst/button';
import { Divider } from '@/components/catalyst/divider';
import { authClient } from '@/lib/auth-client';
import { useAccountSettingsFieldState } from '@/hooks/use-account-settings-field-state';
import { useResetStore } from '@/lib/stores/quick-plan-store';

interface DataSettingsFormProps {
  showSuccessNotification: (title: string, message: string) => void;
}

export default function DataSettingsForm({ showSuccessNotification }: DataSettingsFormProps) {
  const deleteAppData = useResetStore();
  const [appDataAlertOpen, setAppDataAlertOpen] = useState(false);
  const { fieldState: deleteApplicationDataState } = useAccountSettingsFieldState({
    successNotification: 'Application data deleted!',
    showSuccessNotification,
  });
  const handleDeleteApplicationData = async () => deleteAppData();

  const [accountDeletionAlertOpen, setAccountDeletionAlertOpen] = useState(false);
  const { fieldState: deleteAccountState, createCallbacks: deleteAccountCallbacks } = useAccountSettingsFieldState({
    successNotification: 'Account deletion initiated. Check your email for further instructions.',
    showSuccessNotification,
  });
  const handleDeleteAccount = async () => {
    await authClient.deleteUser({ callbackURL: '/signin?deleted=success' }, deleteAccountCallbacks());
  };

  return (
    <>
      <Card className="my-6 border-red-500 dark:border-red-400">
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset>
            <Legend className="flex items-center gap-2">
              <Trash2Icon className="text-primary h-6 w-6" aria-hidden="true" />
              Manage data
            </Legend>
            <FieldGroup>
              <Field>
                <Button
                  color="rose"
                  type="button"
                  className="w-full"
                  data-slot="control"
                  onClick={() => setAppDataAlertOpen(true)}
                  disabled={deleteApplicationDataState.isLoading}
                >
                  {deleteApplicationDataState.isLoading ? 'Deleting...' : 'Delete application data'}
                </Button>
                {deleteApplicationDataState.errorMessage && <ErrorMessage>{deleteApplicationDataState.errorMessage}</ErrorMessage>}
                <Description>
                  <strong className="text-red-500 dark:text-red-400">Warning:</strong> This action will permanently delete your app data,
                  including Simulator plans, but will not delete your account. This cannot be undone.
                </Description>
              </Field>
              <Divider />
              <Field>
                <Button
                  color="rose"
                  type="button"
                  className="w-full"
                  data-slot="control"
                  onClick={() => setAccountDeletionAlertOpen(true)}
                  disabled={deleteAccountState.isLoading}
                >
                  {deleteAccountState.isLoading ? 'Sending deletion email...' : 'Delete my account'}
                </Button>
                {deleteAccountState.errorMessage && <ErrorMessage>{deleteAccountState.errorMessage}</ErrorMessage>}
                <Description>
                  <strong className="text-red-500 dark:text-red-400">Warning:</strong> This action will initiate the deletion of your
                  account. You will receive an email with instructions to confirm the deletion.
                </Description>
              </Field>
            </FieldGroup>
          </Fieldset>
        </form>
      </Card>
      <Alert
        open={appDataAlertOpen}
        onClose={() => {
          setAppDataAlertOpen(false);
        }}
      >
        <AlertTitle>Are you sure you want to delete your application data?</AlertTitle>
        <AlertDescription>This action cannot be undone.</AlertDescription>
        <AlertActions>
          <Button plain onClick={() => setAppDataAlertOpen(false)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={async () => {
              await handleDeleteApplicationData();
              setAppDataAlertOpen(false);
            }}
          >
            Delete
          </Button>
        </AlertActions>
      </Alert>
      <Alert
        open={accountDeletionAlertOpen}
        onClose={() => {
          setAccountDeletionAlertOpen(false);
        }}
      >
        <AlertTitle>Are you sure you want to delete your account?</AlertTitle>
        <AlertDescription>This action cannot be undone.</AlertDescription>
        <AlertActions>
          <Button plain onClick={() => setAccountDeletionAlertOpen(false)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={async () => {
              await handleDeleteAccount();
              setAccountDeletionAlertOpen(false);
            }}
          >
            Delete
          </Button>
        </AlertActions>
      </Alert>
    </>
  );
}
