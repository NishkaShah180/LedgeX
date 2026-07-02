const explicitMapping = {
  'Food': { bgClass: 'bg-orange-100', textClass: 'text-orange-700', hex: '#f97316' },
  'Shopping': { bgClass: 'bg-blue-100', textClass: 'text-blue-700', hex: '#3b82f6' },
  'Entertainment': { bgClass: 'bg-purple-100', textClass: 'text-purple-700', hex: '#a855f7' },
  'Transport': { bgClass: 'bg-red-100', textClass: 'text-red-700', hex: '#ef4444' },
  'Utilities': { bgClass: 'bg-emerald-100', textClass: 'text-emerald-700', hex: '#10b981' },
  'Healthcare': { bgClass: 'bg-cyan-100', textClass: 'text-cyan-700', hex: '#06b6d4' },
  'Salary': { bgClass: 'bg-green-100', textClass: 'text-green-700', hex: '#22c55e' }
};

const fallbackPalette = [
  { bgClass: 'bg-yellow-100', textClass: 'text-yellow-800', hex: '#eab308' },
  { bgClass: 'bg-pink-100', textClass: 'text-pink-700', hex: '#ec4899' },
  { bgClass: 'bg-indigo-100', textClass: 'text-indigo-700', hex: '#6366f1' },
  { bgClass: 'bg-fuchsia-100', textClass: 'text-fuchsia-700', hex: '#d946ef' },
  { bgClass: 'bg-rose-100', textClass: 'text-rose-700', hex: '#f43f5e' },
  { bgClass: 'bg-teal-100', textClass: 'text-teal-700', hex: '#14b8a6' }
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
