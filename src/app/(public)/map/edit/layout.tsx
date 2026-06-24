/** Full viewport width + fixed height — map and item list scroll independently. */
export default function MapEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="map-edit-shell relative left-1/2 flex h-[calc(100dvh-10rem)] max-h-[calc(100dvh-10rem)] w-screen max-w-[100vw] -translate-x-1/2 flex-col overflow-hidden px-3 sm:px-4 lg:h-[calc(100dvh-8.25rem)] lg:max-h-[calc(100dvh-8.25rem)] lg:px-6">
      {children}
    </div>
  );
}
