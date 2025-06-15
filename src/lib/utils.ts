import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-US", options).format(num);
}

export function formatCurrency(num: number, currency = "USD") {
  return formatNumber(num, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(num: number, options?: Intl.NumberFormatOptions) {
  return formatNumber(num, {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength) + "...";
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function generateId(length = 8) {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function liquidColors(variant: "primary" | "secondary" | "success" | "warning" | "danger" = "primary") {
  const variants = {
    primary: "bg-gradient-to-r from-liquid-500 to-liquid-600 text-white",
    secondary: "bg-gradient-to-r from-cloud-400 to-cloud-500 text-white",
    success: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
    warning: "bg-gradient-to-r from-amber-500 to-amber-600 text-white",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white",
  };

  return variants[variant];
}

export function liquidShadow(variant: "sm" | "md" | "lg" | "xl" = "md") {
  const shadows = {
    sm: "shadow-liquid-sm",
    md: "shadow-liquid-md",
    lg: "shadow-liquid-lg",
    xl: "shadow-liquid-xl",
  };

  return shadows[variant];
}
