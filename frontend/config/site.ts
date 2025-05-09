import { 
  DashboardIcon,
  DashboardIconFilled,
  PracticesIcon,
  PracticesIconFilled
} from '@/components/icons'

import { ChatBubbleOvalLeftEllipsisIcon, CalendarDaysIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { 
  ChatBubbleOvalLeftEllipsisIcon as ChatBubbleOvalLeftEllipsisIconFilled,
  CalendarDaysIcon as CalendarDaysIconFilled,
  AcademicCapIcon as AcademicCapIconFilled
 } from '@heroicons/react/24/solid';

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Golem XIV",
  description: "Make beautiful websites regardless of your design experience.",
  navItems: [
    {
      label: "Dashboard",
      href: "/",
      icon: DashboardIcon,
      iconFilled: DashboardIconFilled,
    },
    {
      label: "Cursos",
      href: "/courses",
      icon: AcademicCapIcon,
      iconFilled: AcademicCapIconFilled,
    },
    {
      label: "Pràctiques",
      href: "/practices",
      icon: PracticesIcon,
      iconFilled: PracticesIconFilled,
    },
    {
      label: "Calendari",
      href: "/calendar",
      icon: CalendarDaysIcon,
      iconFilled: CalendarDaysIconFilled,
    }
  ],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/"
    },
    {
      label: "Missatges",
      href: "/messages"
    },
    {
      label: "Pràctiques",
      href: "/practices"
    },
    {
      label: "Calendari",
      href: "/calendar"
    },
    {
      label: "Configuració",
      href: "/settings"
    },
    {
      label: "Tancar sessió",
      href: "/logout"
    }
  ]
};
