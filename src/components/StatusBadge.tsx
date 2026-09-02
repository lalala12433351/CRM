import React, { useContext } from 'react';
import { LeadStatus } from '../types';
import { getStatusStyle } from '../utils/statusStyles';
import { StagesContext } from '../App';

interface StatusBadgeProps {
  status?: LeadStatus | string | null;
  lostReason?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showDot?: boolean;
  isDark?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  lostReason,
  size = 'sm',
  showDot = false,
  isDark = false,
  className = '',
  onClick
}) => {
  const stages = useContext(StagesContext);
  const config = getStatusStyle(status);
  
  const customStage = stages?.find(s => s.name.toLowerCase() === (status || '').toString().toLowerCase());
  const isLost = (status || '').toString().toLowerCase() === 'lost';

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] rounded',
    sm: 'px-2.5 py-0.5 text-xs font-semibold rounded-md',
    md: 'px-3 py-1 text-xs font-bold rounded-lg',
    lg: 'px-3.5 py-1.5 text-sm font-bold rounded-xl'
  }[size];

  let colorStyles = '';
  let inlineStyles: React.CSSProperties = {};
  
  if (customStage) {
    const color = customStage.color;
    inlineStyles = isDark 
      ? { color: color, backgroundColor: `${color}1A`, borderColor: `${color}40` }
      : { color: color, backgroundColor: `${color}15`, borderColor: `${color}40` };
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
      className={`inline-flex items-center justify-center select-none font-medium tracking-tight transition-all duration-150 ${sizeClasses} ${colorStyles} ${
        onClick ? 'cursor-pointer hover:opacity-90 active:scale-95' : ''
      } ${className}`}
      title={`Status: ${customStage ? customStage.name : config.label}${lostReason ? ` - Reason: ${lostReason}` : ''}`}
    >
      <span className="truncate">
        {status || config.label}
        {isLost && lostReason && (
          <span className="opacity-80 font-normal ml-1 text-[11px] truncate">
            - {lostReason}
          </span>
        )}
      </span>
    </span>
  );
};
