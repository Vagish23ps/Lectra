import { useEntryStore } from "@/store/entryStore";
import { Entry, WorkItem } from "@/types/entry";

export type PendingWorkItem = {
  work: WorkItem;
  entry: Entry;
  hasDeadline: boolean;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueTomorrow: boolean;
};

export function usePendingTasks() {
  const entries = useEntryStore((state) => state.entries);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendingWorks: PendingWorkItem[] = entries
    .flatMap((entry) =>
      entry.works
        .filter(
          (work) =>
            !work.completed &&
            work.task.trim() !== "" &&
            work.addToPending
        )
        .map((work) => {
          const hasDeadline =
            !!work.deadline && work.deadline.trim() !== "";

          const deadline = hasDeadline
            ? new Date(`${work.deadline}T00:00:00`)
            : null;

          if (deadline) {
            deadline.setHours(0, 0, 0, 0);
          }

          const diffDays =
            deadline === null
              ? null
              : Math.floor(
                  (deadline.getTime() - today.getTime()) /
                    (1000 * 60 * 60 * 24)
                );

          return {
            work,
            entry,
            hasDeadline,

            isOverdue: diffDays !== null && diffDays < 0,

            isDueToday: diffDays === 0,

            isDueTomorrow: diffDays === 1,
          };
        })
    )
    .sort((a, b) => {
      const aDeadline = a.work.deadline
        ? new Date(`${a.work.deadline}T00:00:00`).getTime()
        : Number.MAX_SAFE_INTEGER;

      const bDeadline = b.work.deadline
        ? new Date(`${b.work.deadline}T00:00:00`).getTime()
        : Number.MAX_SAFE_INTEGER;

      return aDeadline - bDeadline;
    });

  const overdueTasks = pendingWorks.filter((i) => i.isOverdue);

  const dueTodayTasks = pendingWorks.filter((i) => i.isDueToday);

  const tomorrowTasks = pendingWorks.filter((i) => i.isDueTomorrow);

  const remainingTasks = pendingWorks.filter(
    (i) =>
      i.hasDeadline &&
      !i.isOverdue &&
      !i.isDueToday &&
      !i.isDueTomorrow
  );

  const otherImportantTasks = pendingWorks.filter(
    (i) => !i.hasDeadline
  );

  const normalTasks = entries.flatMap((entry) =>
    entry.works
      .filter(
        (work) =>
          !work.completed &&
          !work.addToPending &&
          work.task.trim() !== ""
      )
      .map((work) => ({
        work,
        entry,
      }))
  );

  const overdueCount = overdueTasks.length;

  const dueTodayCount = dueTodayTasks.length;

  const tomorrowCount = tomorrowTasks.length;

  const remainingCount = remainingTasks.length;

  const otherTasksCount =
    otherImportantTasks.length +
    normalTasks.length;

  const totalPendingCount =
    overdueCount +
    dueTodayCount +
    tomorrowCount +
    remainingCount +
    otherTasksCount;

  return {
    overdueTasks,
    dueTodayTasks,
    tomorrowTasks,
    remainingTasks,
    otherImportantTasks,
    normalTasks,

    overdueCount,
    dueTodayCount,
    tomorrowCount,
    remainingCount,
    otherTasksCount,
    totalPendingCount,
  };
}