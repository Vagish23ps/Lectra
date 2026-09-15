import { CustomReminder } from "./reminder";

export interface WorkItem {
  id: string;
  task: string;
  addToPending: boolean;
  deadline?: string;
  completed: boolean;
  reminder?: CustomReminder;
}

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface Entry {
  id: string;
  entryName: string;
  subject: string;
  lesson: string;
  notes: string;
  createdAt: string;
  entryDate?: string; // "YYYY-MM-DD" — logical date of the entry (may differ from createdAt for backdated entries)
  works: WorkItem[];
  attachments?: Attachment[];
  tags?: string[];
  reminder?: CustomReminder;
}