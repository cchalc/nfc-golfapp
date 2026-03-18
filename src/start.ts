if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  import('tidewave/tanstack');
}

export const startInstance = undefined
