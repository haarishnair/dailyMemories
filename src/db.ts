import Dexie, { type Table } from 'dexie';

export interface DailyEntry {
    id?: number | string; // Support string IDs for Cloudinary
    date: string; // YYYY-MM-DD
    photoBlob?: Blob; // Optional now
    photoUrl?: string; // New field for remote URL
    caption?: string;
    timestamp: number;
}

export class DailyMemoriesDB extends Dexie {
    dailyEntries!: Table<DailyEntry>;

    constructor() {
        super('DailyMemoriesDB');
        this.version(1).stores({
            dailyEntries: '++id, date, timestamp'
        });
    }
}

export const db = new DailyMemoriesDB();
