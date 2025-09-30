export default function PublicTalentProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Return just the children without any wrapper to avoid layout nesting
  return <>{children}</>
}