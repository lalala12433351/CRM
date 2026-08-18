import React, { useContext } from 'react';
import { LeadStatus } from '../types';
import { getStatusStyle } from '../utils/statusStyles';
import { StagesContext } from '../App';

interface StatusBadgeProps {
  status?: LeadStatus | string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showDot?: boolean;
  isDark?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  showDot = true,
  isDark = false,
  className = '',
  onClick
}) => {
  const stages = useContext(StagesContext);
  const config = getStatusStyle(status);
  
  const customStage = stages?.find(s => s.name.toLowerCase() === (status || '').toString().toLowerCase());

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1 rounded',
    sm: 'px-2.5 py-0.5 text-xs font-semibold gap-1.5 rounded-md',
    md: 'px-3 py-1 text-xs font-bold gap-1.5 rounded-lg',
    lg: 'px-3.5 py-1.5 text-sm font-bold gap-2 rounded-xl'
  }[size];

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  }[size];

  let colorStyles = '';
  let inlineStyles: React.CSSProperties = {};
  let dotInlineStyles: React.CSSProperties = {};
  
  if (customStage) {
    const color = customStage.color;
    inlineStyles = isDark 
      ? { color: color, backgroundColor: `${color}1A`, borderColor: `${color}40` }
      : { color: color, backgroundColor: `${color}15`, borderColor: `${color}40` };
    dotInlineStyles = { backgroundColor: color, boxShadow: `0 0 8px ${color}66` };
    colorStyles = 'border shadow-2xs';
  } else {
    colorStyles = isDark 
      ? `${config.darkBg} ${config.darkText} ${config.darkBorder} border`
      : `${config.bg} ${config.text} ${config.border} border shadow-2xs`;
  }

  return (
    <span
      onClick={onClick}
      style={inlineStyles}
      className={`inline-flex items-center select-none font-medium tracking-tight transition-all duration-150 ${sizeClasses} ${colorStyles} ${
        onClick ? 'cursor-pointer hover:opacity-90 active:scale-95' : ''
      } ${className}`}
      title={`Status: ${customStage ? customStage.name : config.label}`}
    >
      {showDot && (
        <span className="relative flex items-center justify-center shrink-0">
          <span 
            style={customStage ? dotInlineStyles : undefined}
            className={`${dotSizes} rounded-full ${!customStage ? config.dot : ''} shrink-0`} 
          />
        </span>
      )}
      <span className="truncate">{status || config.label}</span>
    </span>
  );
};
