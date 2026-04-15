import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }) {
  const variants = {
    danger: 'bg-red-600 hover:bg-red-700',
    primary: 'bg-indigo-600 hover:bg-indigo-700',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
          Cancel
        </button>
        <button onClick={onConfirm} className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${variants[variant]}`}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
