alter table public.profiles
  add column notifications_enabled boolean not null default true;

alter table public.tasks
  add column due_time time,
  add column delay_reason text,
  add column alarm_acknowledged boolean not null default false;
