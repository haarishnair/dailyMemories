import Dexie, { type Table } from 'dexie';

export interface DailyEntry {
    id?: number;
    date: string; // YYYY-MM-DD
    photoBlob: Blob;
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
