import React from 'react';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  rounded?: 'full' | 'xl' | 'lg' | '2xl';
}

const GRADIENT_PALETTES = [
  'from-indigo-600 to-blue-500 text-white',
  'from-emerald-600 to-teal-500 text-white',
  'from-violet-600 to-purple-500 text-white',
  'from-amber-600 to-orange-500 text-white',
  'from-rose-600 to-pink-500 text-white',
  'from-cyan-600 to-blue-600 text-white',
];

export const getAvatarColor = (name: string = ''): string => {
  const clean = name.trim().toUpperCase();
  if (!clean) return GRADIENT_PALETTES[0];
  const charCode = clean.charCodeAt(0) + (clean.charCodeAt(clean.length - 1) || 0);
  return GRADIENT_PALETTES[charCode % GRADIENT_PALETTES.length];
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = 'User',
  avatarUrl,
  avatar,
  size = 'md',
  className = '',
  rounded = 'full'
}) => {
  const finalAvatar = avatarUrl || avatar;
  const initial = (name?.trim()?.charAt(0) || 'U').toUpperCase();
  const gradient = getAvatarColor(name);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs font-bold',
    lg: 'w-10 h-10 text-sm font-bold',
    xl: 'w-12 h-12 text-base font-bold'
  };

  const roundedClasses = {
    full: 'rounded-full',
    xl: 'rounded-xl',
    lg: 'rounded-lg',
    '2xl': 'rounded-2xl'
  };

  if (finalAvatar && finalAvatar.trim()) {
    return (
      <div
        className={`${sizeClasses[size]} ${roundedClasses[rounded]} overflow-hidden shrink-0 shadow-2xs select-none border border-slate-200/60 ${className}`}
        title={name}
      >
        <img
          src={finalAvatar}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback if image fails to load
            (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${roundedClasses[rounded]} bg-gradient-to-tr ${gradient} flex items-center justify-center font-sans tracking-wide shrink-0 shadow-2xs select-none border border-white/20 ${className}`}
      title={name}
    >
      <span>{initial}</span>
    </div>
  );
};
