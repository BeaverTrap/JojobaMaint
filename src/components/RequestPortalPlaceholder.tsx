import MascotEmptyState from "@/components/MascotEmptyState";

export default function RequestPortalPlaceholder() {
  return (
    <MascotEmptyState
      scene="sleep"
      title="Request portal offline"
      description="The online work request form is not available right now. Please check back later or contact the maintenance office for urgent needs."
    />
  );
}
