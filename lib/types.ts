// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TimestampLike = any; // Supports Firestore Timestamp, ISO string, or {seconds, nanoseconds}

export interface Prompt {
  id: string;
  titel: string;
  beschreibung: string;
  promptText: string;
  zusatzinstruktionen?: string;
  plattformenUndModelle: { [plattform: string]: string[] };
  plattformFunktionen?: { [plattform: string]: string[] };
  outputFormate: string[];
  anwendungsfaelle: string[];
  tags: string[];
  link1: string;
  link2: string;
  bewertungen: { [emoji: string]: number };
  nutzungsanzahl: number;
  erstelltVon: string;
  erstelltVonRolle?: string;
  bildungsstufe?: string;
  erstelltAm: TimestampLike;
  deleted?: boolean;
  deletedAt?: TimestampLike;
  deletedBy?: string;
  deletionRequests?: DeletionRequest[];
  kommentare?: Kommentar[];
  kommentar?: string;
  problemausgangslage?: string;
  loesungsbeschreibung?: string;
  schwierigkeiten?: string;
  endproduktLink?: string;
}

export interface Kommentar {
  id: string;
  userCode: string;
  userName: string;
  text: string;
  timestamp: TimestampLike;
}

export interface DeletionRequest {
  userCode: string;
  userName: string;
  grund: string;
  timestamp: string;
}

export type SortOption = 'nutzung' | 'bewertung' | 'aktuell';

export interface FilterState {
  suchbegriff: string;
  filterPlattform: string;
  filterOutputFormat: string;
  filterAnwendungsfall: string;
  filterTag: string;
  filterRolle: string;
  sortierung: SortOption;
}
