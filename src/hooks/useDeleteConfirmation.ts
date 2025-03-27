import { useState } from 'react';
import type { DeleteConfirmation } from '../lib/types';

export function useDeleteConfirmation() {
  const [confirmation, setConfirmation] = useState<DeleteConfirmation | null>(null);

  const requestConfirmation = (config: DeleteConfirmation) => {
    setConfirmation(config);
  };

  const cancelConfirmation = () => {
    setConfirmation(null);
  };

  return {
    confirmation,
    requestConfirmation,
    cancelConfirmation
  };
}