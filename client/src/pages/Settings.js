import React from 'react';
import { User, Bell, Shield, Palette } from 'lucide-react';

const Settings = () => {
  const settingsSections = [
    {
      title: 'Profile Settings',
      description: 'Manage your profile information and visibility',
      icon: User,
      items: [
        'Edit profile information',
        'Change profile visibility',
        'Update social links'
      ]
    },
    {
      title: 'Notifications',
      description: 'Configure your notification preferences',
      icon: Bell,
      items: [
        'Email notifications',
        'Push notifications',
        'Weekly progress reports'
      ]
    },
    {
      title: 'Privacy & Security',
      description: 'Manage your account security and privacy',
      icon: Shield,
      items: [
        'Change password',
        'Two-factor authentication',
        'Data export'
      ]
    },
    {
      title: 'Appearance',
      description: 'Customize your app appearance',
      icon: Palette,
      items: [
        'Theme selection',
        'Color preferences',
        'Layout options'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <div key={index} className="card hover:shadow-md transition-shadow cursor-pointer">
              <div className="card-header">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="card-title text-lg">{section.title}</h3>
                    <p className="card-description">{section.description}</p>
                  </div>
                </div>
              </div>
              <div className="card-content">
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-gray-600">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Settings;