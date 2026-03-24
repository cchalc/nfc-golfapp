/**
 * DataLoader component.
 *
 * Previously loaded seed data on app start. Now Electric shapes
 * automatically populate collections from the database.
 *
 * This component is kept as a pass-through for any future data loading needs.
 */
export function DataLoader({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
