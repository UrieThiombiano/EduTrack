import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Btn } from './PageHeader';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmer la suppression',
  description = 'Cette action est irréversible.',
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3 mb-5">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex justify-end gap-2">
        <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
        <Btn variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Suppression…' : 'Supprimer'}
        </Btn>
      </div>
    </Modal>
  );
}
