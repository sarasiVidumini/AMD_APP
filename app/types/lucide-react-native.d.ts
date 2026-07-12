// Workaround for a known lucide-react-native typing bug where its icon props
// incorrectly extend web SVG types (RefAttributes<SVGSVGElement>) instead of
// react-native-svg's types. This does not change runtime behavior — icons
// already accept `color` and `size` correctly on-device; this file only
// corrects what TypeScript believes the prop shape is.
declare module 'lucide-react-native' {
  import { FC } from 'react';
  import { SvgProps } from 'react-native-svg';

  export interface LucideProps extends SvgProps {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    fill?: string;
  }

  export type LucideIcon = FC<LucideProps>;

  export const Trash2: LucideIcon;
  export const Star: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const Award: LucideIcon;
  export const GraduationCap: LucideIcon;
  export const FileText: LucideIcon;
  export const Download: LucideIcon;
  export const Users: LucideIcon;
  export const UserCheck: LucideIcon;
  export const Mail: LucideIcon;
  export const Calendar: LucideIcon;
  export const UserX: LucideIcon;
  export const Shield: LucideIcon;
  export const BookOpen: LucideIcon;
  export const Search: LucideIcon;
  export const Sparkles: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const UploadCloud: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const X: LucideIcon;
  export const Send: LucideIcon;
  export const User: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const Edit3: LucideIcon;
  export const Clock: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const Timer: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const NotebookText: LucideIcon;
  export const Layers3: LucideIcon;
  export const Brain: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const Upload: LucideIcon;
  export const Smile: LucideIcon;
  export const Camera: LucideIcon;
  export const Paperclip: LucideIcon;
  export const Copy: LucideIcon;
  export const Trash: LucideIcon;
  export const Edit2: LucideIcon;
  export const Check: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Zap: LucideIcon;
  export const CheckCheck: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Loader2: LucideIcon;
  export const Lightbulb: LucideIcon;
  export const CreditCard: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const Pencil: LucideIcon;
  export const MonitorSmartphone: LucideIcon;
  export const FileUp: LucideIcon;
  export const LayoutGrid: LucideIcon;
  export const Lock: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const Compass: LucideIcon;
  export const Plus: LucideIcon;
  export const Filter: LucideIcon;
  export const Grid3x3: LucideIcon;
  export const List: LucideIcon;
  export const Globe: LucideIcon;
  export const LogOut: LucideIcon;
}