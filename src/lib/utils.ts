export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
  if (num >= 1000) return (num / 1000).toFixed(2) + "k";
  return num.toString();
};
