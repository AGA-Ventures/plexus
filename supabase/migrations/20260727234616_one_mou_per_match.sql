alter table public.deals
  add constraint deals_match_id_key unique (match_id);
