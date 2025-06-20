import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { ICONS } from '../../constants';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonVariant?: 'primary' | 'danger' | 'success' | 'warning';
  confirmButtonIcon?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Konfirmasi',
  cancelButtonText = 'Batal',
  confirmButtonVariant = 'primary',
  confirmButtonIcon,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="text-smkn-text mb-6 text-sm">{message}</div>
      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose}>
          {cancelButtonText}
        </Button>
        <Button variant={confirmButtonVariant} onClick={onConfirm} leftIcon={confirmButtonIcon}>
          {confirmButtonText}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
