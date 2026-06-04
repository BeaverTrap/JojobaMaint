-- Optional follow-up: whether and how the issue was resolved.

alter table public.tree_assessments
  add column if not exists resolution_status text,
  add column if not exists resolution_notes text;

alter table public.tree_assessments
  drop constraint if exists tree_assessments_resolution_status_check;

alter table public.tree_assessments
  add constraint tree_assessments_resolution_status_check
  check (
    resolution_status is null
    or resolution_status in (
      'open',
      'resolved',
      'partial',
      'monitoring',
      'not-applicable'
    )
  );
