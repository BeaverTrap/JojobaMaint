/** Full viewport width for the map editor — breaks out of the default max-w-5xl main column. */
export default function MapEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 px-3 sm:px-4 lg:px-6">
      {children}
    </div>
  );
}
