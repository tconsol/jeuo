import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Reusable custom dropdown select component.
 *
 * @param {string}   value       – current selected value
 * @param {function} onChange    – callback(value)
 * @param {{ value: string, label: string, icon?: React.ReactNode }[]} options
 * @param {string}   placeholder – placeholder text
 * @param {string}   label       – label above the select
 * @param {React.ComponentType} icon – optional icon component rendered in the label
 * @param {string}   className   – extra class on wrapper
 */
export default function CustomSelect({ value, onChange, options = [], placeholder = 'Select…', label, icon: Icon, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.value === value);

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {Icon && <Icon size={14} className="inline mr-1" />}{label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`w-full text-left border rounded-xl px-4 py-3 text-sm bg-white transition flex items-center justify-between gap-2 ${
          open ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <span className={`flex items-center gap-2 truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
          {selected?.icon}
          {selected ? selected.label : placeholder}
        </span>
        <FiChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                    <span className="flex-1 truncate">{opt.label}</span>
                    {isSelected && <FiCheck size={14} className="text-indigo-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
