alter table public.event_registrations
  drop constraint event_registrations_chat_id_check,
  add constraint event_registrations_chat_id_check
    check (
      (chat_platform = 'email' and char_length(chat_id) <= 320)
      or (chat_platform <> 'email' and char_length(chat_id) <= 120)
    );
