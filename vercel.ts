export const config = {
  framework: "nextjs",
  crons: [
    {
      path: "/api/cron/email-reminders",
      schedule: "0 * * * *",
    },
  ],
} as const
