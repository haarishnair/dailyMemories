import axios from 'axios';
import type { DailyEntry } from '../db'; // We'll keep the interface but decouple from Dexie

// TODO: Replace with your actual Cloudinary details
export const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dip9ilgql';
export const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'daily-memories';
export const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
export const API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET;

const BASE_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
const DESTROY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`;
const LIST_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/list`;

async function generateSignature(params: Record<string, string>, apiSecret: string): Promise<string> {
    const sortedKeys = Object.keys(params).sort();
    const stringToSign = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + apiSecret;

    // Hash with SHA-1 using Web Crypto API
    const msgBuffer = new TextEncoder().encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const CloudinaryService = {
    /**
     * Deletes an image from Cloudinary using a signed request.
     */
    async deleteImage(publicId: string): Promise<void> {
        if (!API_KEY || !API_SECRET) {
            throw new Error("Missing Cloudinary API Key or Secret in .env");
        }

        const timestamp = Math.round(new Date().getTime() / 1000).toString();
        const params = {
            public_id: publicId,
            timestamp: timestamp
        };

        const signature = await generateSignature(params, API_SECRET);

        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('timestamp', timestamp);
        formData.append('api_key', API_KEY);
        formData.append('signature', signature);

        try {
            await axios.post(DESTROY_URL, formData);
        } catch (error) {
            console.error("Cloudinary Delete Error:", error);
            throw error;
        }
    },

    /**
     * Uploads an image to Cloudinary with metadata tags.
     */
    async uploadImage(file: File, date: string, caption: string): Promise<void> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);

        // Extract year for folder organization
        const year = date.split('-')[0];

        // Use deterministic ID with year folder, appending timestamp to allow multiple photos per day
        // Path: <preset_folder>/<year>/memory_<date>_<timestamp>
        const timestamp = Date.now();
        formData.append('public_id', `${year}/memory_${date}_${timestamp}`);

        // Add Tags: "daily_memory" for filtering, "date_YYYY-MM-DD" for querying specific days
        const tags = ['daily_memory', `date_${date}`, `year_${year}`];
        formData.append('tags', tags.join(','));

        // Add Context: Store caption and date in metadata
        formData.append('context', `caption=${caption}|date=${date}|timestamp=${timestamp}`);

        try {
            await axios.post(BASE_URL, formData);
        } catch (error) {
            console.error("Cloudinary Upload Error:", error);
            throw error;
        }
    },

    /**
     * Fetches all daily memories using the Client-Side Resource List (JSON).
     * Note: You must enable "Resource list" in Cloudinary Settings -> Security.
     */
    async fetchMemories(): Promise<DailyEntry[]> {
        try {
            // Fetch list of resources tagged 'daily_memory'
            // URL: https://res.cloudinary.com/<cloud_name>/image/list/daily_memory.json
            const response = await axios.get(`${LIST_URL}/daily_memory.json`);

            const resources = response.data.resources || [];

            // Transform Cloudinary resources to DailyEntry format
            return resources.map((res: any) => {
                // Parse "date_YYYY-MM-DD" from tags
                // res.context might not be available in the simple list JSON.
                // The simple list JSON (p-json) returns: { public_id, version, format, width, height, type, created_at, context: { custom: { my_key: "value" } } }
                // We need to ensure "context" is requested or available.
                // Actually, the standard /list/tag.json endpoint contains limited info.
                // Let's verify context availability or usage of context. 
                // If context isn't returned, we might resort to parsing logic or assume the user is okay with limited info for now.
                // HOWEVER, the standard list JSON *does* include context if set.

                // Extract date from tags (convention: date_YYYY-MM-DD)
                // Cloudinary list response usually doesn't return tags in the root object, we might have to rely on context or separate fetch if needed.
                // BUT, `context.custom` should contain our data if we sent it.

                const context = res.context?.custom || {};

                // Fallback for Date if not in tags (though we can't see tags in simple list?)
                // Let's rely on Context for date too if possible, or parse unique ID if we named it? No.
                // WAIT: The /list/tag.json endpoint DOES return `context`.
                // It DOES NOT return `tags`. 
                // So we should verify if we can store date in context. Yes we can.

                // Let's rely on parsing the Context we sent: "caption=...|timestamp=..."
                // Cloudinary context is key-value. 

                return {
                    id: res.public_id,
                    date: context.date || res.created_at.split('T')[0], // Fallback to created_at
                    photoBlob: new Blob(), // We don't have the blob, we have the URL. We need to update DailyEntry to support URL.
                    photoUrl: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v${res.version}/${res.public_id}.${res.format}`,
                    caption: context.caption || '',
                    timestamp: context.timestamp ? parseInt(context.timestamp) : new Date(res.created_at).getTime()
                };
            });
        } catch (error) {
            console.error("Cloudinary Fetch Error:", error);
            // Fallback or empty list
            return [];
        }
    }
};
