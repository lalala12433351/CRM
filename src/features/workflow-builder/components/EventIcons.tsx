import React from 'react';
import { 
  Globe, 
  Phone, 
  Settings, 
  SlidersHorizontal, 
  Star, 
  User, 
  FileText, 
  MapPin, 
  Headphones, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Activity, 
  Users,
  Check
} from 'lucide-react';

interface EventIconProps {
  type: string;
  className?: string;
  size?: number;
}

export const EventIcon: React.FC<EventIconProps> = ({ type, className = '', size = 18 }) => {
  switch (type) {
    case 'whatsapp':
    case 'whatsapp_msg':
      return (
        <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path
              d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.9C17.18 3.03 14.69 2 12.04 2Z"
              fill="#25D366"
            />
            <path
              d="M17.5 14.33C17.2 14.18 15.73 13.45 15.45 13.35C15.18 13.25 14.98 13.2 14.78 13.5C14.58 13.8 14.01 14.47 13.84 14.67C13.66 14.87 13.49 14.9 13.19 14.75C12.89 14.6 11.93 14.28 10.79 13.27C9.9 12.48 9.3 11.5 9.13 11.2C8.95 10.9 9.11 10.74 9.26 10.59C9.39 10.46 9.56 10.24 9.71 10.07C9.86 9.9 9.91 9.77 10.01 9.57C10.11 9.37 10.06 9.2 9.98 9.05C9.91 8.9 9.31 7.42 9.06 6.82C8.82 6.24 8.57 6.32 8.39 6.31C8.22 6.3 8.02 6.3 7.82 6.3C7.62 6.3 7.3 6.37 7.03 6.67C6.75 6.97 5.98 7.69 5.98 9.17C5.98 10.64 7.05 12.07 7.2 12.27C7.35 12.47 9.31 15.49 12.32 16.79C13.04 17.1 13.6 17.28 14.04 17.42C14.76 17.65 15.41 17.62 15.93 17.54C16.51 17.45 17.71 16.81 17.96 16.11C18.21 15.41 18.21 14.81 18.13 14.68C18.06 14.56 17.8 14.48 17.5 14.33Z"
              fill="white"
            />
          </svg>
        </span>
      );

    case 'facebook':
      return (
        <span className={`inline-flex items-center justify-center shrink-0 w-5 h-5 rounded-[4px] bg-[#1877F2] text-white font-bold text-[13px] shadow-2xs ${className}`}>
          f
        </span>
      );

    case 'globe':
      return <Globe size={size} className={`text-slate-600 ${className}`} strokeWidth={1.75} />;

    case 'justdial':
      return (
        <span className={`inline-flex items-center justify-center shrink-0 w-5 h-5 rounded-[4px] bg-slate-100 border border-slate-200 text-[10px] font-extrabold shadow-2xs ${className}`}>
          <span className="text-[#0076D7]">J</span>
          <span className="text-[#F47820]">d</span>
        </span>
      );

    case 'woocommerce':
      return (
        <span className={`inline-flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-[#7F54B3] text-white font-bold text-[11px] shadow-2xs ${className}`}>
          W
        </span>
      );

    case 'excel':
      return (
        <span className={`inline-flex items-center justify-center shrink-0 w-5 h-5 rounded-[4px] bg-[#107C41] text-white font-extrabold text-[11px] shadow-2xs ${className}`}>
          X
        </span>
      );

    case 'phone':
      return <Phone size={size} className={`text-slate-600 ${className}`} strokeWidth={1.75} />;

    case 'gear':
      return <Settings size={size} className={`text-slate-600 ${className}`} strokeWidth={1.75} />;

    case 'status_change':
    case 'lead_status':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-slate-600 ${className}`}
        >
          <path d="M4 6h16l-1.5 3H5.5L4 6z" />
          <path d="M7 11h10l-1.5 3H8.5L7 11z" />
          <path d="M10 16h4l-1 3h-2L10 16z" />
        </svg>
      );

    case 'star':
      return <Star size={size} className={`text-slate-600 ${className}`} strokeWidth={1.75} />;

    case 'user':
      return <User size={size} className={`text-slate-600 ${className}`} strokeWidth={1.75} />;

    case 'file_text':
      return <FileText size={size} className={`text-slate-600 ${className}`} strokeWidth={1.75} />;

    case 'location':
      return (
        <span className="relative inline-flex items-center justify-center">
          <MapPin size={size} className={`text-slate-600 ${className}`} strokeWidth={1.75} />
          <Check size={9} className="absolute text-slate-800 -top-0.5" strokeWidth={3} />
        </span>
      );

    case 'ivr':
      return <Headphones size={size} className={`text-[#0284C7] ${className}`} strokeWidth={1.75} />;

    case 'call_incoming_ended':
      return <PhoneIncoming size={size} className={`text-emerald-600 ${className}`} strokeWidth={1.75} />;

    case 'call_outgoing_ended':
      return <PhoneOutgoing size={size} className={`text-emerald-600 ${className}`} strokeWidth={1.75} />;

    case 'call_missed':
      return <PhoneMissed size={size} className={`text-rose-500 ${className}`} strokeWidth={1.75} />;

    case 'call_recording':
      return (
        <span className="relative inline-flex items-center justify-center">
          <Phone size={size} className={`text-rose-600 ${className}`} strokeWidth={1.75} />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 border border-white"></span>
        </span>
      );

    case 'payment':
      return (
        <span className={`inline-flex items-center justify-center font-bold text-[14px] text-slate-700 leading-none ${className}`}>
          ₹
        </span>
      );

    case 'custom_action':
      return <Activity size={size} className={`text-slate-600 ${className}`} strokeWidth={1.75} />;

    case 'lead_recapture':
      return <Users size={size} className={`text-slate-600 ${className}`} strokeWidth={1.75} />;

    default:
      return <Activity size={size} className={`text-slate-600 ${className}`} strokeWidth={1.75} />;
  }
};
