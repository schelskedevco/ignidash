'use client';

import { ConvexError } from 'convex/values';
import { useState } from 'react';

import { Button } from '@/components/catalyst/button';
import { Alert, AlertActions, AlertDescription, AlertTitle, AlertBody } from '@/components/catalyst/alert';
import ErrorMessageCard from '@/components/ui/error-message-card';

interface DeleteDataItemAlertProps {
  dataToDelete: { id: string; name: string } | null;
  setDataToDelete: (data: { id: string; name: string } | null) => void;
  deleteData: (id: string) => Promise<void>;
}

export default function DeleteDataItemAlert({ dataToDelete, setDataToDelete, deleteData }: DeleteDataItemAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <Alert
      open={!!dataToDelete}
      onClose={() => {
        setDataToDelete(null);
      }}
    >
      <AlertTitle>Are you sure you want to delete {dataToDelete ? `"${dataToDelete.name}"` : 'this'}?</AlertTitle>
      <AlertDescription>This action cannot be undone.</AlertDescription>
      <AlertBody>{deleteError && <ErrorMessageCard errorMessage={deleteError} />}</AlertBody>
      <AlertActions>
        <Button plain onClick={() => setDataToDelete(null)} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          color="red"
          disabled={isDeleting}
          onClick={async () => {
            setIsDeleting(true);
            setDeleteError(null);
            try {
              await deleteData(dataToDelete!.id);
              setDataToDelete(null);
            } catch (error) {
              setDeleteError(error instanceof ConvexError ? error.message : 'Failed to delete.');
              console.error('Error during deletion: ', error);
            } finally {
              setIsDeleting(false);
            }
          }}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </AlertActions>
    </Alert>
  );
}
