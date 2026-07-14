const explicitMapping = {
  'Food': { bgClass: 'bg-orange-100 dark:bg-orange-900/20', textClass: 'text-orange-700 dark:text-orange-400', hex: '#f97316' },
  'Shopping': { bgClass: 'bg-blue-100 dark:bg-blue-900/20', textClass: 'text-blue-700 dark:text-blue-400', hex: '#3b82f6' },
  'Entertainment': { bgClass: 'bg-purple-100 dark:bg-purple-900/20', textClass: 'text-purple-700 dark:text-purple-400', hex: '#a855f7' },
  'Transport': { bgClass: 'bg-red-100 dark:bg-red-900/20', textClass: 'text-red-700 dark:text-red-400', hex: '#ef4444' },
  'Utilities': { bgClass: 'bg-indigo-100 dark:bg-indigo-900/20', textClass: 'text-indigo-700 dark:text-indigo-400', hex: '#6366f1' },
  'Healthcare': { bgClass: 'bg-cyan-100 dark:bg-cyan-900/20', textClass: 'text-cyan-700 dark:text-cyan-400', hex: '#06b6d4' },
  'Salary': { bgClass: 'bg-green-100 dark:bg-green-900/20', textClass: 'text-green-700 dark:text-green-400', hex: '#22c55e' }
};

const fallbackPalette = [
  { bgClass: 'bg-yellow-100 dark:bg-yellow-900/20', textClass: 'text-yellow-800 dark:text-yellow-400', hex: '#eab308' },
  { bgClass: 'bg-pink-100 dark:bg-pink-900/20', textClass: 'text-pink-700 dark:text-pink-400', hex: '#ec4899' },
  { bgClass: 'bg-lime-100 dark:bg-lime-900/20', textClass: 'text-lime-700 dark:text-lime-400', hex: '#84cc16' },
  { bgClass: 'bg-fuchsia-100 dark:bg-fuchsia-900/20', textClass: 'text-fuchsia-700 dark:text-fuchsia-400', hex: '#d946ef' },
  { bgClass: 'bg-rose-100 dark:bg-rose-900/20', textClass: 'text-rose-700 dark:text-rose-400', hex: '#f43f5e' },
  { bgClass: 'bg-teal-100 dark:bg-teal-900/20', textClass: 'text-teal-700 dark:text-teal-400', hex: '#14b8a6' }
];

let nextColorIndex = 0;
const dynamicMapping = {};

export const getCategoryColorInfo = (category) => {
  if (!category) category = 'Unknown';
  const normalizedCategory = Object.keys(explicitMapping).find(
    k => k.toLowerCase() === category.toLowerCase()
  );

  if (normalizedCategory) {
    return explicitMapping[normalizedCategory];
  }

  if (dynamicMapping[category]) {
    return dynamicMapping[category];
  }

  const color = fallbackPalette[nextColorIndex % fallbackPalette.length];
  dynamicMapping[category] = color;
  nextColorIndex++;
  
  return color;
};

export const getCategoryBadgeClass = (category) => {
  const info = getCategoryColorInfo(category);
  return `${info.bgClass} ${info.textClass}`;
};

export const getCategoryHexColor = (category) => {
  return getCategoryColorInfo(category).hex;
};
