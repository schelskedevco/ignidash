'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ConvexError } from 'convex/values';
import { useState } from 'react';
import { Trash2Icon } from 'lucide-react';
import posthog from 'posthog-js';

import Card from '@/components/ui/card';
import { Fieldset, FieldGroup, Field, Legend, Description, ErrorMessage } from '@/components/catalyst/fieldset';
import { Alert, AlertActions, AlertDescription, AlertTitle, AlertBody } from '@/components/catalyst/alert';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Button } from '@/components/catalyst/button';
import { Divider } from '@/components/catalyst/divider';
import { authClient } from '@/lib/auth-client';
import { useAccountSettingsFieldState } from '@/hooks/use-account-settings-field-state';

interface DataSettingsFormProps {
  showSuccessNotification: (title: string, desc?: string) => void;
}

export default function DataSettingsForm({ showSuccessNotification }: DataSettingsFormProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const [appDataAlertOpen, setAppDataAlertOpen] = useState(false);
  const [appDataDeleteError, setAppDataDeleteError] = useState<string | null>(null);

  const [accountDeletionAlertOpen, setAccountDeletionAlertOpen] = useState(false);

  const { fieldState: deleteApplicationDataState } = useAccountSettingsFieldState();
  const deleteAppDataMutation = useMutation(api.app_data.deleteAppData);
  const handleDeleteApplicationData = async () => {
    posthog.capture('delete_app_data');
    await deleteAppDataMutation({ shouldCreateBlankPlan: true });
  };

  const { fieldState: deleteAccountState, createCallbacks: deleteAccountCallbacks } = useAccountSettingsFieldState();
  const handleDeleteAccount = async () => {
    posthog.capture('delete_account');
    await authClient.deleteUser(
      { callbackURL: '/signin?deleted=success' },
      deleteAccountCallbacks(() => showSuccessNotification('Account deletion initiated. Check your email for further instructions.'))
    );
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
        <AlertBody>{appDataDeleteError && <ErrorMessageCard errorMessage={appDataDeleteError} />}</AlertBody>
        <AlertActions>
          <Button plain onClick={() => setAppDataAlertOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            color="red"
            disabled={isDeleting}
            onClick={async () => {
              setIsDeleting(true);
              setAppDataDeleteError(null);
              try {
                await handleDeleteApplicationData();
                setAppDataAlertOpen(false);
                showSuccessNotification('Application data deleted!');
              } catch (error) {
                setAppDataDeleteError(error instanceof ConvexError ? error.message : 'Failed to delete.');
                console.error('Error during deletion: ', error);
              } finally {
                setIsDeleting(false);
              }
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete now'}
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
        <AlertDescription>This action will send a deletion email to your registered email address for confirmation.</AlertDescription>
        <AlertActions>
          <Button plain onClick={() => setAccountDeletionAlertOpen(false)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={async () => {
              setAccountDeletionAlertOpen(false);
              await handleDeleteAccount();
            }}
          >
            Send deletion email
          </Button>
        </AlertActions>
      </Alert>
    </>
  );
}
