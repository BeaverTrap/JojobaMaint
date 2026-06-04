-- Optional references block at the end of articles and tree assessments.

alter table public.articles
  add column if not exists reference_list text;

alter table public.tree_assessments
  add column if not exists reference_list text;
