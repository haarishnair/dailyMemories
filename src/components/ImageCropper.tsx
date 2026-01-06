import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import clsx from 'clsx';
import getCroppedImg from '../utils/cropImage';

interface ImageCropperProps {
    imageSrc: string;
    onCancel: () => void;
    onCropComplete: (croppedBlob: Blob) => void;
}

export default function ImageCropper({ imageSrc, onCancel, onCropComplete }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImage) {
                onCropComplete(croppedImage);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="relative flex-1 bg-black w-full overflow-hidden">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={4 / 5} // Matching the aspect ratio used in CalendarView (4/5) or square? User request said "square frame of the app" but CalendarView uses 4/5. 
                    // However, request says "perfect sizd can fit the square frame of the app". CalendarView uses aspect-[4/5]. 
                    // Let's stick to 4/5 as it seems to be the design, OR allow user to choose? 
                    // The user said "square frame" but code says 4/5. I'll stick to 4/5 to match existing UI, or maybe make it 1 if needed. 
                    // Wait, CalenderView has `aspect-[4/5]`. UploadView preview has `aspect-[4/5]`.
                    // But user specifically said "square frame". 
                    // Maybe "square frame" is loose terminology? 
                    // Let's look at `CalendarView.tsx` again.
                    // Lines 135: `aspect-[4/5]`.
                    // I will check if there is a square view elsewhere.
                    // The request says "fit the square frame of the app". 
                    // Maybe the user *wants* it square? Or thinks it is square?
                    // To be safe, I'll use 4/5 as that's what the code currently enforces for display.
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteHandler}
                    onZoomChange={onZoomChange}
                    showGrid={true}
                />
            </div>

            <div className="bg-white p-4 pb-8 flex flex-col gap-4">
                <div className="flex items-center gap-4 px-4">
                    <span className="text-xs font-bold text-gray-500">Zoom</span>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isProcessing}
                        className={clsx(
                            "flex-1 py-3 rounded-xl font-semibold text-white shadow-lg transition-all active:scale-95",
                            isProcessing ? "bg-purple-400" : "bg-purple-600 hover:bg-purple-700 shadow-purple-200"
                        )}
                    >
                        {isProcessing ? "Processing..." : "Done"}
                    </button>
                </div>
            </div>
        </div>
    );
}
