const legacyCodeMap: Record<string, string> = {
  SICK: 'SL', ANNUAL: 'VL', EMERGENCY: 'EL', MATERNITY: 'ML', NO_PAY: 'NP',
};

export const normalizeCode = (type: string): string => {
  return legacyCodeMap[type] || type;
};

const typeColors: Record<string, { bg: string; text: string; border: string; darkBg: string; darkText: string; darkBorder: string }> = {
  VL: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-400', darkBorder: 'dark:border-purple-800' },
  SL: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400', darkBorder: 'dark:border-blue-800' },
  EL: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', darkBg: 'dark:bg-yellow-900/30', darkText: 'dark:text-yellow-400', darkBorder: 'dark:border-yellow-800' },
  ML: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', darkBg: 'dark:bg-pink-900/30', darkText: 'dark:text-pink-400', darkBorder: 'dark:border-pink-800' },
  NP: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', darkBg: 'dark:bg-gray-800/50', darkText: 'dark:text-gray-400', darkBorder: 'dark:border-gray-800' },
};

const fallbackColors = [
  { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', darkBg: 'dark:bg-teal-900/30', darkText: 'dark:text-teal-400', darkBorder: 'dark:border-teal-800' },
  { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-400', darkBorder: 'dark:border-orange-800' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200', darkBg: 'dark:bg-cyan-900/30', darkText: 'dark:text-cyan-400', darkBorder: 'dark:border-cyan-800' },
  { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', darkBg: 'dark:bg-rose-900/30', darkText: 'dark:text-rose-400', darkBorder: 'dark:border-rose-800' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', darkBg: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-400', darkBorder: 'dark:border-emerald-800' },
];

const colorCache = new Map<string, number>();

export const getTypeColor = (code: string) => {
  const c = normalizeCode(code);
  if (typeColors[c]) return typeColors[c];
  if (!colorCache.has(c)) {
    colorCache.set(c, colorCache.size % fallbackColors.length);
  }
  return fallbackColors[colorCache.get(c)!];
};

export const getTypeLabel = (code: string, name?: string): string => {
  const typeLabels: Record<string, string> = {
    VL: 'VACATION', SL: 'SICK', EL: 'EMERGENCY', ML: 'MATERNITY', NP: 'NO PAY',
  };
  return name || typeLabels[normalizeCode(code)] || code;
};

export const getCardColor = (code: string) => {
  const c = normalizeCode(code);
  const colorMap: Record<string, { from: string; to: string; border: string; darkFrom: string; darkTo: string; darkBorder: string; icon: string }> = {
    SL: { from: 'from-blue-50', to: 'to-blue-100', border: 'border-blue-200', darkFrom: 'dark:from-blue-950/30', darkTo: 'dark:to-blue-900/30', darkBorder: 'dark:border-blue-800', icon: 'text-blue-600' },
    VL: { from: 'from-purple-50', to: 'to-purple-100', border: 'border-purple-200', darkFrom: 'dark:from-purple-950/30', darkTo: 'dark:to-purple-900/30', darkBorder: 'dark:border-purple-800', icon: 'text-purple-600' },
    ML: { from: 'from-pink-50', to: 'to-pink-100', border: 'border-pink-200', darkFrom: 'dark:from-pink-950/30', darkTo: 'dark:to-pink-900/30', darkBorder: 'dark:border-pink-800', icon: 'text-pink-600' },
    EL: { from: 'from-yellow-50', to: 'to-yellow-100', border: 'border-yellow-200', darkFrom: 'dark:from-yellow-950/30', darkTo: 'dark:to-yellow-900/30', darkBorder: 'dark:border-yellow-800', icon: 'text-yellow-600' },
  };
  return colorMap[c] || { from: 'from-gray-50', to: 'to-gray-100', border: 'border-gray-200', darkFrom: 'dark:from-gray-950/30', darkTo: 'dark:to-gray-900/30', darkBorder: 'dark:border-gray-800', icon: 'text-gray-600' };
};
