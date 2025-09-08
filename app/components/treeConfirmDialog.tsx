import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmTreeUpdate {
  open: boolean;
  onConfirm: (confirmed: boolean) => void;
}

export const ConfirmTreeUpdate = ({ open, onConfirm }: ConfirmTreeUpdate) => {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm</DialogTitle>
          <DialogDescription>
            Do you want update the selected to all parent/child nodes?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm(false);
            }}
          >
            No
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm(true);
            }}
          >
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
