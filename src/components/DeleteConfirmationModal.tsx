import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { DeleteConfirmation } from '../lib/types';

interface DeleteConfirmationModalProps extends DeleteConfirmation {
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  title,
  message,
  onConfirm,
  onCancel
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error during deletion:', error);
    } finally {
      setIsDeleting(false);
      onCancel();
    }
  };

  return (
    <div className="modal-container">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
            {title}
          </h2>
          <button
            onClick={onCancel}
            className="modal-close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="modal-body">
          <p className="text-gray-600">{message}</p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="modal-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="modal-delete"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}