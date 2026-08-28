alter table public.event_registrations
  drop constraint event_registrations_chat_platform_check,
  add constraint event_registrations_chat_platform_check
    check (chat_platform in ('none', 'email', 'whatsapp', 'wechat'));
