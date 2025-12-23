import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Função utilitária para combinar classes do Tailwind
// Usa clsx para condicionais e tailwind-merge para resolver conflitos
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
