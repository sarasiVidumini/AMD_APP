export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'student' | 'expert' | 'admin';
  semester?: number;
  expertise?: string;
  avatarUrl?: string;
  data?:any;
}

export interface GroupMessage {
  _id?: string;
  text?: string;
  fileUrl?: string;
  fileName?: string;
  cameraSnapshot?: string;
  emoji?: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  timestamp?: string | Date;
}

export type NoteDocType = 'note' | 'paper';

export interface Note {
  _id: string;
  title: string;
  subject: string;
  subjectCode: string;
  docType: NoteDocType;
  semester: number;
  description?: string;
  files: string[];
  uploadedBy: {
    name: string;
    department?: string;
    email?: string;
    role: 'student' | 'expert' | 'admin';
  };
  downloads: number;
  averageRating: number;
  createdAt: string;
}

export interface QuizQuestion {
  q: string;
  a: string[];
  correct: number;
}

export interface WhitelistEntry {
  _id: string;
  email: string;
  grantedBy: string;
  createdAt: string;
}