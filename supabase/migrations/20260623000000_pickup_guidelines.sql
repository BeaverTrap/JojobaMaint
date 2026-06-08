-- Staff-editable pickup guidelines shown on /pickup-guidelines and linked from the feed banner.

create table if not exists public.pickup_guidelines (
  id                 text primary key default 'default',
  title              text not null,
  body               text not null,
  is_summer_schedule boolean not null default true,
  updated_at         timestamptz not null default now()
);

comment on table public.pickup_guidelines is
  'Singleton row with resident-facing green/cactus waste pickup instructions.';

drop trigger if exists pickup_guidelines_set_updated_at on public.pickup_guidelines;
create trigger pickup_guidelines_set_updated_at
  before update on public.pickup_guidelines
  for each row execute function public.set_updated_at();

alter table public.pickup_guidelines enable row level security;

create policy "Pickup guidelines are publicly viewable"
  on public.pickup_guidelines for select
  to anon, authenticated
  using (true);

create policy "Authorized staff can update pickup guidelines"
  on public.pickup_guidelines for update
  to authenticated
  using (public.is_authorized())
  with check (public.is_authorized());

insert into public.pickup_guidelines (id, title, body, is_summer_schedule)
values (
  'default',
  'Weekly Green Waste & Cactus Pickup Guidelines',
  $markdown$## Pickup Schedules

Our pickup schedule fluctuates based on park occupancy throughout the year:

**Regular Schedule:** Pickups occur on **Mondays and Thursdays**. This twice-a-week schedule operates for the majority of the year (our regular season) when the park is full.

**Summer Schedule:** Pickups occur on **Mondays only**. Summer is our slow season. We drop down to a one-day-a-week schedule during these months because many residents leave the park for cooler areas.

## Placement Requirements

### Visibility

Place your piles at the edge of your lot where they are easily seen from the road. Do not hide waste behind hedges where our crew might drive past without seeing it.

### Clearances

Never place waste in front of utility boxes (always leave a clear space around them) or in front of fire hydrants.

## How to Prepare Your Waste

### Separate Your Piles

Green waste and cactus waste must be kept clearly separated. Do not pile them on top of each other.

### Manageable Loads

Please do not overload your tarps with too much weight. While there are no strict size limits for branches, ensure the pile is manageable and can be easily picked up by the crew.

### Tarps Are Highly Preferred

We will pick up your yard waste without a tarp, but using one is strongly recommended. It makes the pickup process significantly faster and easier on us.

### Tarp Recommendations

If purchasing a tarp specifically for pickups, please buy heavy-duty or extra-strength tarps. Thin, cheap blue tarps rip easily under the weight of yard waste.

### The "Retired Tarp" Policy

If your tarp is old, worn out, or full of holes, we will not keep using it. Our crew will "retire" it (throw it away). If your tarp is missing after a pickup, it means it was retired and you will need to replace it.

## What Belongs in the Piles?

### Green Waste

This includes standard yard trimmings, leaves, and branches bound for the chipping pits.

**Note on Oleander:** Oleander does go into the green waste pile. Once it dries out, it is no longer poisonous to animals and is perfectly safe for us to chip.

### Cactus Waste

This includes anything that will poke you. Any type of cactus, thorny flowers, prickly bushes, or anything sharp that requires careful handling goes into this pile so our crew knows to watch their hands.

## What DOES NOT Belong in the Piles?

### Unacceptable Items

Do not mix garbage (like plastic wrappers or general trash), rocks, dog waste, or treated lumber into either the green waste or cactus waste piles. Finding trash hidden in or under the yard waste piles is unacceptable.

### No Household Trash

Maintenance does not pick up regular trash. Residents are responsible for bringing their own trash to the dumpsters, unless a special pickup has been explicitly scheduled with the office.$markdown$,
  true
)
on conflict (id) do nothing;
