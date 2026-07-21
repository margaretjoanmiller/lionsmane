import { feedQueue } from "./queue";

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
