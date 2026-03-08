import {
  Package,
  Layers,
  BarChart,
  BarChart2,
  Code,
  Smartphone,
  Globe,
  Rocket,
  Users,
  Lightbulb,
  ShoppingCart,
  CreditCard,
  Shield,
  Lock,
  Database,
  Cloud,
  Server,
  Monitor,
  Laptop,
  Tablet,
  Watch,
  Cpu,
  Zap,
  Activity,
  Heart,
  Star,
  Sun,
  Moon,
  Music,
  Camera,
  Video,
  Image,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Navigation,
  Compass,
  Home,
  Building,
  Briefcase,
  Calendar,
  Clock,
  Bell,
  Search,
  Settings,
  Wrench,
  Puzzle,
  Gift,
  Truck,
  Plane,
  Anchor,
  Wifi,
  Bluetooth,
  Radio,
  Headphones,
  Gamepad2,
  Trophy,
  Flag,
  Bookmark,
  Tag,
  Box,
  type LucideIcon,
} from 'lucide-react'

export type ProductIconEntry = {
  name: string
  label: string
  icon: LucideIcon
  category: string
}

export const PRODUCT_ICONS: ProductIconEntry[] = [
  // General
  { name: 'package', label: 'Package', icon: Package, category: 'General' },
  { name: 'layers', label: 'Layers', icon: Layers, category: 'General' },
  { name: 'box', label: 'Box', icon: Box, category: 'General' },
  { name: 'puzzle', label: 'Puzzle', icon: Puzzle, category: 'General' },
  { name: 'tag', label: 'Tag', icon: Tag, category: 'General' },
  { name: 'bookmark', label: 'Bookmark', icon: Bookmark, category: 'General' },
  { name: 'flag', label: 'Flag', icon: Flag, category: 'General' },
  { name: 'gift', label: 'Gift', icon: Gift, category: 'General' },
  { name: 'star', label: 'Star', icon: Star, category: 'General' },
  { name: 'trophy', label: 'Trophy', icon: Trophy, category: 'General' },

  // Tech
  { name: 'code', label: 'Code', icon: Code, category: 'Tech' },
  { name: 'database', label: 'Database', icon: Database, category: 'Tech' },
  { name: 'cloud', label: 'Cloud', icon: Cloud, category: 'Tech' },
  { name: 'server', label: 'Server', icon: Server, category: 'Tech' },
  { name: 'cpu', label: 'CPU', icon: Cpu, category: 'Tech' },
  { name: 'wifi', label: 'WiFi', icon: Wifi, category: 'Tech' },
  { name: 'bluetooth', label: 'Bluetooth', icon: Bluetooth, category: 'Tech' },
  { name: 'settings', label: 'Settings', icon: Settings, category: 'Tech' },
  { name: 'wrench', label: 'Wrench', icon: Wrench, category: 'Tech' },
  { name: 'shield', label: 'Shield', icon: Shield, category: 'Tech' },
  { name: 'lock', label: 'Lock', icon: Lock, category: 'Tech' },

  // Devices
  { name: 'smartphone', label: 'Smartphone', icon: Smartphone, category: 'Devices' },
  { name: 'monitor', label: 'Monitor', icon: Monitor, category: 'Devices' },
  { name: 'laptop', label: 'Laptop', icon: Laptop, category: 'Devices' },
  { name: 'tablet', label: 'Tablet', icon: Tablet, category: 'Devices' },
  { name: 'watch', label: 'Watch', icon: Watch, category: 'Devices' },
  { name: 'headphones', label: 'Headphones', icon: Headphones, category: 'Devices' },
  { name: 'gamepad-2', label: 'Gamepad', icon: Gamepad2, category: 'Devices' },
  { name: 'camera', label: 'Camera', icon: Camera, category: 'Devices' },
  { name: 'radio', label: 'Radio', icon: Radio, category: 'Devices' },

  // Business
  { name: 'bar-chart', label: 'Bar Chart', icon: BarChart, category: 'Business' },
  { name: 'bar-chart-2', label: 'Bar Chart 2', icon: BarChart2, category: 'Business' },
  { name: 'shopping-cart', label: 'Cart', icon: ShoppingCart, category: 'Business' },
  { name: 'credit-card', label: 'Credit Card', icon: CreditCard, category: 'Business' },
  { name: 'briefcase', label: 'Briefcase', icon: Briefcase, category: 'Business' },
  { name: 'building', label: 'Building', icon: Building, category: 'Business' },
  { name: 'truck', label: 'Truck', icon: Truck, category: 'Business' },

  // Communication
  { name: 'mail', label: 'Mail', icon: Mail, category: 'Communication' },
  { name: 'message-square', label: 'Message', icon: MessageSquare, category: 'Communication' },
  { name: 'phone', label: 'Phone', icon: Phone, category: 'Communication' },
  { name: 'bell', label: 'Bell', icon: Bell, category: 'Communication' },
  { name: 'video', label: 'Video', icon: Video, category: 'Communication' },
  { name: 'music', label: 'Music', icon: Music, category: 'Communication' },

  // Navigation
  { name: 'globe', label: 'Globe', icon: Globe, category: 'Navigation' },
  { name: 'map-pin', label: 'Map Pin', icon: MapPin, category: 'Navigation' },
  { name: 'navigation', label: 'Navigation', icon: Navigation, category: 'Navigation' },
  { name: 'compass', label: 'Compass', icon: Compass, category: 'Navigation' },
  { name: 'home', label: 'Home', icon: Home, category: 'Navigation' },
  { name: 'plane', label: 'Plane', icon: Plane, category: 'Navigation' },
  { name: 'anchor', label: 'Anchor', icon: Anchor, category: 'Navigation' },
  { name: 'search', label: 'Search', icon: Search, category: 'Navigation' },

  // People & Life
  { name: 'users', label: 'Users', icon: Users, category: 'People' },
  { name: 'heart', label: 'Heart', icon: Heart, category: 'People' },
  { name: 'activity', label: 'Activity', icon: Activity, category: 'People' },

  // Misc
  { name: 'rocket', label: 'Rocket', icon: Rocket, category: 'Misc' },
  { name: 'lightbulb', label: 'Lightbulb', icon: Lightbulb, category: 'Misc' },
  { name: 'zap', label: 'Zap', icon: Zap, category: 'Misc' },
  { name: 'sun', label: 'Sun', icon: Sun, category: 'Misc' },
  { name: 'moon', label: 'Moon', icon: Moon, category: 'Misc' },
  { name: 'image', label: 'Image', icon: Image, category: 'Misc' },
  { name: 'file-text', label: 'File', icon: FileText, category: 'Misc' },
  { name: 'calendar', label: 'Calendar', icon: Calendar, category: 'Misc' },
  { name: 'clock', label: 'Clock', icon: Clock, category: 'Misc' },
]

const iconMap = new Map(PRODUCT_ICONS.map((e) => [e.name, e.icon]))

export function getProductIcon(name: string | null | undefined): LucideIcon | null {
  if (!name) return null
  return iconMap.get(name) ?? null
}
