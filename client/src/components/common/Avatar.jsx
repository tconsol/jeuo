import { getInitials } from '../../utils';

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base', xl: 'h-20 w-20 text-xl' };

  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ${className}`} />;
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-indigo-100 text-indigo-600 font-semibold flex items-center justify-center ${className}`}>
      {getInitials(name)}
    </div>
  );
}
