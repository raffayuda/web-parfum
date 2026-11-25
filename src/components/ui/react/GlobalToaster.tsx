import React from 'react';
import { Toaster } from 'sonner';

export const GlobalToaster: React.FC = () => {
  return <Toaster position="bottom-right" richColors theme="system" />;
};
