import { Button } from '@/components/catalyst/button';
import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/catalyst/alert';

interface DisclosureSectionDeleteDataAlertProps {
  dataToDelete: { id: string; name: string } | null;
  setDataToDelete: (data: { id: string; name: string } | null) => void;
  deleteData: (id: string) => void;
}

export default function DisclosureSectionDeleteDataAlert({
  dataToDelete,
  setDataToDelete,
  deleteData,
}: DisclosureSectionDeleteDataAlertProps) {
  return (
    <Alert
      open={!!dataToDelete}
      onClose={() => {
        setDataToDelete(null);
      }}
    >
      <AlertTitle>Are you sure you want to delete {dataToDelete ? `"${dataToDelete.name}"` : 'this'}?</AlertTitle>
      <AlertDescription>This action cannot be undone.</AlertDescription>
      <AlertActions>
        <Button plain onClick={() => setDataToDelete(null)}>
          Cancel
        </Button>
        <Button
          color="red"
          onClick={() => {
            deleteData(dataToDelete!.id);
            setDataToDelete(null);
          }}
        >
          Delete
        </Button>
      </AlertActions>
    </Alert>
  );
}
