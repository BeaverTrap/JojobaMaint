-- Clarify optional note: how the issue was discovered (not only resident inquiries).

alter table public.tree_assessments
  rename column resident_note to how_found;
