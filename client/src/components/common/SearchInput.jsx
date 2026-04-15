import { useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useEffect } from 'react';

export default function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  const [input, setInput] = useState(value || '');
  const debounced = useDebounce(input, 350);

  useEffect(() => {
    if (debounced !== value) onChange(debounced);
  }, [debounced]);

  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      {input && (
        <button onClick={() => { setInput(''); onChange(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          &times;
        </button>
      )}
    </div>
  );
}
