/**
 * DataLoader component.
 *
 * Previously initialized Electric SQL offline support.
 * Now just a pass-through that can be removed or used for future data initialization.
 */
export function DataLoader({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
