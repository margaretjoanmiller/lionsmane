import { feedQueue } from "./queue";

export async function startScheduler() {
  await feedQueue.upsertJobScheduler(
    "updateEvery15",
    {
      every: 900000,
    },
    {
      data: {
        type: "cron",
      },
    },
  );

  await feedQueue.upsertJobScheduler(
    "reapEvery30",
    {
      every: 600000,
    },
    {
      data: {
        type: "reaper",
      },
    },
  );
}
