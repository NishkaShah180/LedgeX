import React from 'react';

export default function PageHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center transition-colors duration-200">
          {Icon && <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 mr-3 flex-shrink-0" />}
          {title}
        </h1>
        {subtitle && <p className="text-slate-500 dark:text-gray-400 mt-1 text-base transition-colors duration-200">{subtitle}</p>}
      </div>
      {action && (
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
}
