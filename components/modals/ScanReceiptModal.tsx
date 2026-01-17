'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Upload, Camera, Check } from 'lucide-react';
import { Category, categoryConfig } from '@/types/finance';

interface ReceiptData {
    storeName: string;
    date: string;
    total: number;
    category?: string;
}

interface ScanReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: ReceiptData) => void;
}

export function ScanReceiptModal({ isOpen, onClose, onSuccess }: ScanReceiptModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState<string | null>(null);
    const [scannedData, setScannedData] = useState<ReceiptData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show preview
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);

        // Scan receipt
        setIsLoading(true);
        setError('');
        setScannedData(null);

        try {
            const formData = new FormData();
            formData.append('receipt', file);

            const res = await fetch('/api/ai/scan-receipt', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to scan receipt');
            }

            const data = await res.json();
            setScannedData(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        if (scannedData) {
            onSuccess(scannedData);
            handleClose();
        }
    };

    const handleClose = () => {
        setPreview(null);
        setScannedData(null);
        setError('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="card p-6 w-full max-w-md"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-[var(--dc-text-primary)]">
                                    Scan Receipt
                                </h2>
                                <button
                                    onClick={handleClose}
                                    className="w-8 h-8 rounded-lg bg-[var(--dc-bg-secondary)] flex items-center justify-center hover:bg-[var(--dc-bg-elevated)] transition-colors"
                                >
                                    <X className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                                </button>
                            </div>

                            {/* Upload Area */}
                            {!preview && !scannedData && (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-[var(--dc-border)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--dc-primary)] transition-colors"
                                >
                                    <div className="w-16 h-16 rounded-full bg-[var(--dc-primary)]/20 flex items-center justify-center mx-auto mb-4">
                                        <Camera className="w-8 h-8 text-[var(--dc-primary)]" />
                                    </div>
                                    <p className="text-[var(--dc-text-primary)] font-medium mb-2">
                                        Upload a receipt
                                    </p>
                                    <p className="text-sm text-[var(--dc-text-muted)]">
                                        Take a photo or select an image
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>
                            )}

                            {/* Preview & Loading */}
                            {preview && !scannedData && (
                                <div className="space-y-4">
                                    <div className="relative rounded-xl overflow-hidden">
                                        <img
                                            src={preview}
                                            alt="Receipt preview"
                                            className="w-full max-h-64 object-contain bg-[var(--dc-bg-secondary)]"
                                        />
                                        {isLoading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="text-center">
                                                    <Loader2 className="w-8 h-8 text-[var(--dc-primary)] animate-spin mx-auto mb-2" />
                                                    <p className="text-white text-sm">Scanning with AI...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Scanned Results */}
                            {scannedData && (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Check className="w-5 h-5 text-green-400" />
                                            <p className="text-green-400 font-medium">Receipt scanned successfully!</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="p-3 rounded-lg bg-[var(--dc-bg-secondary)]">
                                            <p className="text-xs text-[var(--dc-text-muted)] mb-1">Store</p>
                                            <p className="text-[var(--dc-text-primary)] font-medium">
                                                {scannedData.storeName}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 rounded-lg bg-[var(--dc-bg-secondary)]">
                                                <p className="text-xs text-[var(--dc-text-muted)] mb-1">Date</p>
                                                <p className="text-[var(--dc-text-primary)] font-medium">
                                                    {scannedData.date}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-[var(--dc-bg-secondary)]">
                                                <p className="text-xs text-[var(--dc-text-muted)] mb-1">Total</p>
                                                <p className="text-[var(--dc-text-primary)] font-medium">
                                                    R {scannedData.total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>

                                        {scannedData.category && (
                                            <div className="p-3 rounded-lg bg-[var(--dc-bg-secondary)]">
                                                <p className="text-xs text-[var(--dc-text-muted)] mb-1">Category</p>
                                                <p className="text-[var(--dc-text-primary)] font-medium">
                                                    {categoryConfig[scannedData.category as Category]?.label || scannedData.category}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm mt-4">
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                                {scannedData ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setScannedData(null);
                                                setPreview(null);
                                                fileInputRef.current?.click();
                                            }}
                                            className="flex-1 py-3 px-4 rounded-xl bg-[var(--dc-bg-secondary)] text-[var(--dc-text-secondary)] font-semibold hover:bg-[var(--dc-bg-elevated)] transition-colors"
                                        >
                                            Rescan
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[var(--dc-primary)] to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity"
                                        >
                                            Use This Data
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleClose}
                                        className="w-full py-3 px-4 rounded-xl bg-[var(--dc-bg-secondary)] text-[var(--dc-text-secondary)] font-semibold hover:bg-[var(--dc-bg-elevated)] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
