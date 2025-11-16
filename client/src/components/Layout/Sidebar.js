import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Code2, 
  FileText, 
  User, 
  Settings, 
  Link as LinkIcon,
  BarChart3,
  Trophy
} from 'lucide-react';
import { cn } from '../../utils/helpers';

const Sidebar = () => {
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Problems',
      href: '/problems',
      icon: Code2,
      current: location.pathname.startsWith('/problems')
    },
    {
      name: 'Sheets',
      href: '/sheets',
      icon: FileText,
      current: location.pathname.startsWith('/sheets')
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      current: location.pathname === '/profile'
    },
    {
      name: 'Integrations',
      href: '/integrations',
      icon: LinkIcon,
      current: location.pathname === '/integrations'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      current: location.pathname === '/settings'
    }
  ];

  const quickStats = [
    { name: 'Problems Solved', value: '142', icon: Trophy, color: 'text-success-600' },
    { name: 'Current Streak', value: '7', icon: BarChart3, color: 'text-primary-600' },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 lg:translate-x-0">
        <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
          {/* Navigation */}
          <ul className="space-y-2 font-medium">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center p-2 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 group transition-colors',
                        isActive && 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50'
                      )
                    }
                  >
                    <Icon className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" />
                    <span className="ml-3">{item.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>

          {/* Quick Stats */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Quick Stats
            </h3>
            <div className="space-y-3">
              {quickStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.name} className="flex items-center p-2 rounded-lg bg-gray-50">
                    <Icon className={cn('w-4 h-4', stat.color)} />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-500">{stat.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Recent Activity
            </h3>
            <div className="space-y-2">
              <div className="p-2 rounded-lg bg-gray-50">
                <div className="text-sm font-medium text-gray-900">Two Sum</div>
                <div className="text-xs text-gray-500">Solved • LeetCode</div>
              </div>
              <div className="p-2 rounded-lg bg-gray-50">
                <div className="text-sm font-medium text-gray-900">Binary Search</div>
                <div className="text-xs text-gray-500">Solved • LeetCode</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar backdrop */}
      <div className="fixed inset-0 z-30 bg-gray-900 bg-opacity-50 lg:hidden" />
    </>
  );
};

export default Sidebar;