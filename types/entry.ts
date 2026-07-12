export interface WorkItem {
  id: string;
  task: string;
  addToPending: boolean;
  deadline?: string;
  completed: boolean;
}

export interface Entry {
  id: string;
  entryName: string;
  subject: string;
  lesson: string;
  notes: string;
  createdAt: string;
  works: WorkItem[];
}