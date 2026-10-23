/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Modal } from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  isDestructive?: boolean;
  icon?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmLabel,
  cancelText = 'Cancel',
  isDestructive = true,
  icon = 'warning',
}) => {
  const handleClose = onClose || onCancel || (() => {});
  const buttonLabel = confirmLabel || confirmText;
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      icon={icon}
      maxWidth="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-[#603e39] dark:text-gray-300 leading-relaxed">
          {message}
        </p>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              handleClose();
            }}
            className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-md active:scale-95 ${
              isDestructive
                ? 'bg-[#ba1a1a] hover:bg-red-700 shadow-red-500/20'
                : 'bg-[#bc0100] hover:bg-[#eb0000]'
            }`}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
