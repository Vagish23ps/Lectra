import { Entry } from "@/types/entry";

export interface OverdueTask {
  entryId: string;
  entryName: string;
  taskId: string;
  task: string;
  deadline: string;
}

export function getOverdueTasks(entries: Entry[]): OverdueTask[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue: OverdueTask[] = [];

  for (const entry of entries) {
    for (const work of entry.works) {
      if (
        work.addToPending &&
        !work.completed &&
        work.deadline
      ) {
        const deadline = new Date(work.deadline);
        deadline.setHours(0, 0, 0, 0);

        if (deadline < today) {
          overdue.push({
            entryId: entry.id,
            entryName: entry.entryName,
            taskId: work.id,
            task: work.task,
            deadline: work.deadline,
          });
        }
      }
    }
  }

  return overdue;
}