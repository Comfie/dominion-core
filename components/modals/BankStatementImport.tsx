'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    FileSpreadsheet,
    X,
    Check,
    AlertCircle,
    Loader2,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    Download,
    Filter,
    TrendingDown,
    TrendingUp,
    ArrowLeftRight,
    CreditCard,
    CheckCircle2,
} from 'lucide-react';
import {
    parseBankStatement,
    ParsedTransaction,
    getTransactionSummary,
    BankFormat,
    categorizeTransaction,
} from '@/lib/bankStatementParser';
import { categoryConfig, Category } from '@/types/finance';
import { format } from 'date-fns';

interface BankStatementImportProps {
    onSuccess: () => void;
    onClose: () => void;
}

type ImportStep = 'upload' | 'processing' | 'preview' | 'importing' | 'complete';

const BANK_NAMES: Record<BankFormat, string> = {
    fnb: 'FNB',
    standard_bank: 'Standard Bank',
    nedbank: 'Nedbank',
    capitec: 'Capitec',
    absa: 'ABSA',
    generic: 'Generic CSV',
};

// Keywords to detect internal transfers
const TRANSFER_KEYWORDS = [
    'transfer', 'contra', 'internal', 'savings', 'moving', 'between accounts',
    'from savings', 'to savings', 'self transfer', 'inter account',
];

export function BankStatementImport({ onSuccess, onClose }: BankStatementImportProps) {
    const [step, setStep] = useState<ImportStep>('upload');
    const [isDragging, setIsDragging] = useState(false);
    const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
    const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
    const [bankFormat, setBankFormat] = useState<BankFormat>('generic');
    const [parseErrors, setParseErrors] = useState<string[]>([]);
    const [importResult, setImportResult] = useState<{
        imported: number;
        skipped: number;
        errors: string[];
        obligationsMarked?: number;
    } | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isProcessingPdf, setIsProcessingPdf] = useState(false);
    const [showAllTransactions, setShowAllTransactions] = useState(false);
    const [fileType, setFileType] = useState<'csv' | 'pdf' | null>(null);
    const [importMode, setImportMode] = useState<'expenses' | 'income' | 'all'>('expenses');
    const [showTransfers, setShowTransfers] = useState(false);
    const [obligationMatches, setObligationMatches] = useState<Array<{
        transactionIndex: number;
        obligationId: string;
        obligationName: string;
        provider: string;
        expectedAmount: number;
        actualAmount: number;
        confidence: 'high' | 'medium' | 'low';
        matchReason: string;
        selected: boolean;
    }>>([]);
    const [showObligationMatches, setShowObligationMatches] = useState(true);
    const [customKeywords, setCustomKeywords] = useState<{ added?: Record<string, string[]>; removed?: Record<string, string[]> } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch custom keywords on mount
    useEffect(() => {
        const fetchKeywords = async () => {
            try {
                const res = await fetch('/api/settings/category-keywords');
                if (res.ok) {
                    const data = await res.json();
                    setCustomKeywords({
                        added: data.added || {},
                        removed: data.removed || {},
                    });
                }
            } catch (err) {
                console.error('Error fetching custom keywords:', err);
            }
        };
        fetchKeywords();
    }, []);

    // Detect if a transaction is an internal transfer
    const isTransfer = (description: string): boolean => {
        const lowerDesc = description.toLowerCase();
        return TRANSFER_KEYWORDS.some(keyword => lowerDesc.includes(keyword));
    };

    // Fetch obligation matches for transactions
    const fetchObligationMatches = async (txs: ParsedTransaction[]) => {
        try {
            const res = await fetch('/api/import/match-obligations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactions: txs.map(t => ({
                        date: t.date.toISOString(),
                        description: t.description,
                        amount: t.amount,
                        type: t.type,
                    })),
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setObligationMatches(
                    data.matches.map((m: any) => ({ ...m, selected: m.confidence !== 'low' }))
                );
            }
        } catch (err) {
            console.error('Error fetching obligation matches:', err);
        }
    };

    // Filter transactions based on import mode and transfer setting
    const filteredTransactions = transactions.filter(t => {
        // Filter by type based on import mode
        if (importMode === 'expenses' && t.type !== 'debit') return false;
        if (importMode === 'income' && t.type !== 'credit') return false;
        // Filter transfers if not showing them
        if (!showTransfers && isTransfer(t.description)) return false;
        return true;
    });

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleFile = async (file: File) => {
        const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
        const isCsv = file.name.toLowerCase().endsWith('.csv');
        const isImage = file.type.startsWith('image/');

        if (!isPdf && !isCsv && !isImage) {
            setParseErrors(['Please upload a CSV, PDF, or image file']);
            return;
        }

        setParseErrors([]);

        if (isPdf || isImage) {
            // Process PDF/image with Claude Vision
            setFileType('pdf');
            setStep('processing');
            setIsProcessingPdf(true);

            try {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch('/api/import/pdf', {
                    method: 'POST',
                    body: formData,
                });

                const result = await res.json();

                if (!res.ok) {
                    throw new Error(result.error || 'Failed to process file');
                }

                if (!result.transactions || result.transactions.length === 0) {
                    throw new Error('No transactions found in the document');
                }

                // Convert to ParsedTransaction format
                const parsedTransactions: ParsedTransaction[] = result.transactions.map((t: any) => ({
                    date: new Date(t.date),
                    description: t.description,
                    amount: t.amount,
                    type: t.type,
                    category: t.category || 'OTHER',
                }));

                setTransactions(parsedTransactions);
                setBankFormat('generic');

                // Select all debit transactions by default
                const debitIndices = parsedTransactions
                    .map((t, i) => (t.type === 'debit' ? i : -1))
                    .filter(i => i !== -1);
                setSelectedTransactions(new Set(debitIndices));

                // Fetch obligation matches
                fetchObligationMatches(parsedTransactions);

                setStep('preview');
            } catch (err: any) {
                setParseErrors([err.message]);
                setStep('upload');
            } finally {
                setIsProcessingPdf(false);
            }
        } else {
            // Process CSV locally
            setFileType('csv');
            try {
                const content = await file.text();
                const result = parseBankStatement(content, undefined, customKeywords || undefined);

                setTransactions(result.transactions);
                setBankFormat(result.bankFormat);
                setParseErrors(result.errors);

                // Select all debit transactions by default
                const debitIndices = result.transactions
                    .map((t, i) => (t.type === 'debit' ? i : -1))
                    .filter(i => i !== -1);
                setSelectedTransactions(new Set(debitIndices));

                // Fetch obligation matches
                fetchObligationMatches(result.transactions);

                setStep('preview');
            } catch (err: any) {
                setParseErrors([`Failed to parse file: ${err.message}`]);
            }
        }
    };

    const handleToggleTransaction = (index: number) => {
        const newSelected = new Set(selectedTransactions);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedTransactions(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedTransactions.size === filteredTransactions.length) {
            setSelectedTransactions(new Set());
        } else {
            setSelectedTransactions(new Set(filteredTransactions.map((_, i) => i)));
        }
    };

    const handleUpdateCategory = (index: number, category: string) => {
        const newTransactions = [...transactions];
        newTransactions[index] = { ...newTransactions[index], category };
        setTransactions(newTransactions);
    };

    const handleImport = async () => {
        setIsImporting(true);
        setStep('importing');

        const selectedTxs = filteredTransactions.filter((_, i) => selectedTransactions.has(i));

        try {
            // Import expenses (debits)
            const expenses = selectedTxs.filter(t => t.type === 'debit');
            // Import income (credits)
            const income = selectedTxs.filter(t => t.type === 'credit');

            let totalImported = 0;
            let totalSkipped = 0;
            let obligationsMarked = 0;
            const allErrors: string[] = [];

            // Import expenses
            if (expenses.length > 0) {
                const res = await fetch('/api/import/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        transactions: expenses.map(t => ({
                            date: t.date.toISOString(),
                            description: t.description,
                            amount: t.amount,
                            type: t.type,
                            category: t.category,
                        })),
                        importAsExpenses: true,
                    }),
                });
                const result = await res.json();
                if (res.ok) {
                    totalImported += result.imported;
                    totalSkipped += result.skipped;
                    allErrors.push(...(result.errors || []));
                }
            }

            // Import income
            if (income.length > 0) {
                const res = await fetch('/api/import/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        transactions: income.map(t => ({
                            date: t.date.toISOString(),
                            description: t.description,
                            amount: t.amount,
                            type: t.type,
                            category: t.category,
                        })),
                        importAsExpenses: false,
                    }),
                });
                const result = await res.json();
                if (res.ok) {
                    totalImported += result.imported;
                    totalSkipped += result.skipped;
                    allErrors.push(...(result.errors || []));
                }
            }

            // Record matched obligation payments
            const selectedMatches = obligationMatches.filter(m => m.selected);
            if (selectedMatches.length > 0) {
                const matchRes = await fetch('/api/import/match-obligations', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        matches: selectedMatches.map(m => ({
                            obligationId: m.obligationId,
                            amount: m.actualAmount,
                            date: transactions[m.transactionIndex].date.toISOString(),
                        })),
                    }),
                });
                const matchResult = await matchRes.json();
                if (matchRes.ok) {
                    obligationsMarked = matchResult.recorded;
                }
            }

            setImportResult({
                imported: totalImported,
                skipped: totalSkipped,
                errors: allErrors,
                obligationsMarked,
            });
            setStep('complete');
        } catch (err: any) {
            setImportResult({
                imported: 0,
                skipped: 0,
                errors: [err.message],
            });
            setStep('complete');
        } finally {
            setIsImporting(false);
        }
    };

    // Calculate summary based on selected filtered transactions
    const selectedFiltered = filteredTransactions.filter((_, i) => selectedTransactions.has(i));
    const summary = getTransactionSummary(selectedFiltered);
    const displayTransactions = showAllTransactions ? filteredTransactions : filteredTransactions.slice(0, 10);

    // Count transfers for display
    const transferCount = transactions.filter(t => isTransfer(t.description)).length;

    return (
        <AnimatePresence>
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <div key="modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    key="modal-content"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="card p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[var(--dc-text-primary)]">
                                    Import Bank Statement
                                </h2>
                                <p className="text-xs text-[var(--dc-text-muted)]">
                                    {step === 'upload' && 'Upload your CSV or PDF statement'}
                                    {step === 'processing' && 'Extracting transactions with AI...'}
                                    {step === 'preview' && `${fileType === 'pdf' ? 'AI Extracted' : BANK_NAMES[bankFormat]} - ${transactions.length} transactions`}
                                    {step === 'importing' && 'Importing transactions...'}
                                    {step === 'complete' && 'Import complete'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-[var(--dc-bg-secondary)] flex items-center justify-center hover:bg-[var(--dc-bg-elevated)] transition-colors"
                        >
                            <X className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                        </button>
                    </div>

                    {/* Upload Step */}
                    {step === 'upload' && (
                        <div className="space-y-4">
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragging
                                    ? 'border-[var(--dc-primary)] bg-[var(--dc-primary)]/10'
                                    : 'border-[var(--dc-border)] hover:border-[var(--dc-primary)]/50 hover:bg-[var(--dc-bg-secondary)]'
                                    }`}
                            >
                                <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-[var(--dc-primary)]' : 'text-[var(--dc-text-muted)]'}`} />
                                <p className="text-lg font-medium text-[var(--dc-text-primary)] mb-2">
                                    Drop your bank statement here
                                </p>
                                <p className="text-sm text-[var(--dc-text-muted)] mb-2">
                                    or click to browse
                                </p>
                                <p className="text-xs text-[var(--dc-text-muted)]">
                                    Supports CSV, PDF, and images
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.pdf,image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>

                            <div className="text-center">
                                <p className="text-xs text-[var(--dc-text-muted)] mb-2">Supported banks (CSV auto-detect):</p>
                                <div className="flex flex-wrap justify-center gap-2 mb-3">
                                    {Object.values(BANK_NAMES).filter(n => n !== 'Generic CSV').map(name => (
                                        <span
                                            key={name}
                                            className="px-2 py-1 text-xs rounded-lg bg-[var(--dc-bg-secondary)] text-[var(--dc-text-secondary)]"
                                        >
                                            {name}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-blue-400">
                                    💡 PDF statements are processed using AI for accurate extraction
                                </p>
                            </div>

                            {parseErrors.length > 0 && (
                                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                                    {parseErrors.map((error, i) => (
                                        <p key={i} className="text-sm text-red-400">{error}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Processing Step (PDF/Image) */}
                    {step === 'processing' && (
                        <div className="py-12 text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-[var(--dc-text-primary)]">
                                Extracting transactions...
                            </p>
                            <p className="text-sm text-[var(--dc-text-muted)] mb-4">
                                AI is reading your bank statement
                            </p>
                            <p className="text-xs text-blue-400">
                                This may take 10-30 seconds depending on the document size
                            </p>
                        </div>
                    )}

                    {/* Preview Step */}
                    {step === 'preview' && (
                        <div className="space-y-4">
                            {/* Import Mode Toggle */}
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-[var(--dc-bg-secondary)]">
                                <button
                                    onClick={() => setImportMode('expenses')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${importMode === 'expenses'
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'text-[var(--dc-text-secondary)] hover:bg-[var(--dc-bg-elevated)]'
                                        }`}
                                >
                                    <TrendingDown className="w-4 h-4" />
                                    Expenses
                                </button>
                                <button
                                    onClick={() => setImportMode('income')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${importMode === 'income'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'text-[var(--dc-text-secondary)] hover:bg-[var(--dc-bg-elevated)]'
                                        }`}
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    Income
                                </button>
                                <button
                                    onClick={() => setImportMode('all')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${importMode === 'all'
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'text-[var(--dc-text-secondary)] hover:bg-[var(--dc-bg-elevated)]'
                                        }`}
                                >
                                    <Filter className="w-4 h-4" />
                                    All
                                </button>
                            </div>

                            {/* Transfer Filter */}
                            {transferCount > 0 && (
                                <button
                                    onClick={() => setShowTransfers(!showTransfers)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${showTransfers
                                        ? 'bg-amber-500/10 border-amber-500/30'
                                        : 'bg-[var(--dc-bg-secondary)] border-[var(--dc-border)]'
                                        }`}
                                >
                                    <span className="flex items-center gap-2 text-sm">
                                        <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                                        <span className="text-[var(--dc-text-secondary)]">
                                            {transferCount} internal transfers detected
                                        </span>
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded ${showTransfers ? 'bg-amber-500/20 text-amber-400' : 'bg-[var(--dc-bg-elevated)] text-[var(--dc-text-muted)]'
                                        }`}>
                                        {showTransfers ? 'Included' : 'Excluded'}
                                    </span>
                                </button>
                            )}

                            {/* Matched Obligations */}
                            {obligationMatches.length > 0 && (
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setShowObligationMatches(!showObligationMatches)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30"
                                    >
                                        <span className="flex items-center gap-2 text-sm">
                                            <CreditCard className="w-4 h-4 text-indigo-400" />
                                            <span className="text-indigo-300 font-medium">
                                                {obligationMatches.length} debit order{obligationMatches.length > 1 ? 's' : ''} matched
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-400">
                                                {obligationMatches.filter(m => m.selected).length} selected
                                            </span>
                                            {showObligationMatches ? (
                                                <ChevronUp className="w-4 h-4 text-indigo-400" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-indigo-400" />
                                            )}
                                        </span>
                                    </button>

                                    {showObligationMatches && (
                                        <div className="space-y-2 pl-2">
                                            {obligationMatches.map((match, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        setObligationMatches(prev =>
                                                            prev.map((m, i) => i === idx ? { ...m, selected: !m.selected } : m)
                                                        );
                                                    }}
                                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${match.selected
                                                        ? 'bg-indigo-500/10 border-indigo-500/30'
                                                        : 'bg-[var(--dc-bg-secondary)] border-[var(--dc-border)] opacity-60'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${match.selected
                                                            ? 'bg-indigo-500 border-indigo-500'
                                                            : 'border-[var(--dc-border)]'
                                                            }`}>
                                                            {match.selected && (
                                                                <Check className="w-3 h-3 text-white" />
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-[var(--dc-text-primary)]">
                                                                    {match.obligationName}
                                                                </p>
                                                                <span className={`text-xs px-1.5 py-0.5 rounded ${match.confidence === 'high'
                                                                    ? 'bg-green-500/20 text-green-400'
                                                                    : match.confidence === 'medium'
                                                                        ? 'bg-amber-500/20 text-amber-400'
                                                                        : 'bg-gray-500/20 text-gray-400'
                                                                    }`}>
                                                                    {match.confidence}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-[var(--dc-text-muted)]">
                                                                {match.provider} • {match.matchReason}
                                                            </p>
                                                        </div>

                                                        <div className="text-right">
                                                            <p className="text-sm font-semibold text-indigo-400">
                                                                R {match.actualAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                                            </p>
                                                            {match.actualAmount !== match.expectedAmount && (
                                                                <p className="text-xs text-[var(--dc-text-muted)]">
                                                                    Expected: R {match.expectedAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 rounded-xl bg-[var(--dc-bg-secondary)]">
                                    <p className="text-xs text-[var(--dc-text-muted)]">Showing</p>
                                    <p className="text-lg font-bold text-[var(--dc-text-primary)]">
                                        {filteredTransactions.length} / {transactions.length}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-red-500/10">
                                    <p className="text-xs text-[var(--dc-text-muted)]">Debits</p>
                                    <p className="text-lg font-bold text-red-400">
                                        R {summary.totalDebits.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-500/10">
                                    <p className="text-xs text-[var(--dc-text-muted)]">Credits</p>
                                    <p className="text-lg font-bold text-emerald-400">
                                        R {summary.totalCredits.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>

                            {/* Select all */}
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={handleSelectAll}
                                    className="text-sm text-[var(--dc-primary)] hover:underline"
                                >
                                    {selectedTransactions.size === filteredTransactions.length ? 'Deselect all' : 'Select all'}
                                </button>
                                {summary.dateRange && (
                                    <p className="text-xs text-[var(--dc-text-muted)]">
                                        {format(summary.dateRange.start, 'dd MMM')} - {format(summary.dateRange.end, 'dd MMM yyyy')}
                                    </p>
                                )}
                            </div>

                            {/* Transaction list */}
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                                {displayTransactions.map((tx, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleToggleTransaction(index)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedTransactions.has(index)
                                            ? 'bg-[var(--dc-primary)]/10 border-[var(--dc-primary)]/30'
                                            : 'bg-[var(--dc-bg-secondary)] border-[var(--dc-border)] opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selectedTransactions.has(index)
                                                ? 'bg-[var(--dc-primary)] border-[var(--dc-primary)]'
                                                : 'border-[var(--dc-border)]'
                                                }`}>
                                                {selectedTransactions.has(index) && (
                                                    <Check className="w-3 h-3 text-white" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-[var(--dc-text-primary)] truncate">
                                                    {tx.description}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-[var(--dc-text-muted)]">
                                                    <span>{format(tx.date, 'dd MMM yyyy')}</span>
                                                    <span>•</span>
                                                    <select
                                                        value={tx.category}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateCategory(index, e.target.value);
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="bg-transparent text-[var(--dc-text-secondary)] focus:outline-none cursor-pointer"
                                                    >
                                                        {Object.entries(categoryConfig).map(([key, config]) => (
                                                            <option key={key} value={key}>{config.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <span className={`text-sm font-semibold ${tx.type === 'debit' ? 'text-red-400' : 'text-emerald-400'
                                                }`}>
                                                {tx.type === 'debit' ? '-' : '+'}R {tx.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {transactions.length > 10 && (
                                <button
                                    onClick={() => setShowAllTransactions(!showAllTransactions)}
                                    className="w-full py-2 text-sm text-[var(--dc-text-secondary)] hover:text-[var(--dc-text-primary)] flex items-center justify-center gap-1"
                                >
                                    {showAllTransactions ? (
                                        <>Show less <ChevronUp className="w-4 h-4" /></>
                                    ) : (
                                        <>Show all {transactions.length} transactions <ChevronDown className="w-4 h-4" /></>
                                    )}
                                </button>
                            )}

                            {parseErrors.length > 0 && (
                                <div className="p-3 rounded-lg bg-amber-500/20 border border-amber-500/50">
                                    <div className="flex items-center gap-2 text-amber-400 mb-1">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-sm font-medium">{parseErrors.length} rows had issues</span>
                                    </div>
                                    <p className="text-xs text-[var(--dc-text-muted)]">
                                        Some rows couldn't be parsed and were skipped
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setStep('upload');
                                        setTransactions([]);
                                        setSelectedTransactions(new Set());
                                    }}
                                    className="flex-1 py-3 px-4 rounded-xl bg-[var(--dc-bg-secondary)] text-[var(--dc-text-secondary)] font-semibold hover:bg-[var(--dc-bg-elevated)] transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={selectedTransactions.size === 0}
                                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Import {selectedTransactions.size} Transactions
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Importing Step */}
                    {step === 'importing' && (
                        <div className="py-12 text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-[var(--dc-primary)] mx-auto mb-4" />
                            <p className="text-lg font-medium text-[var(--dc-text-primary)]">
                                Importing transactions...
                            </p>
                            <p className="text-sm text-[var(--dc-text-muted)]">
                                This may take a moment
                            </p>
                        </div>
                    )}

                    {/* Complete Step */}
                    {step === 'complete' && importResult && (
                        <div className="py-8 text-center">
                            {importResult.imported > 0 ? (
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-8 h-8 text-emerald-400" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle className="w-8 h-8 text-red-400" />
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-[var(--dc-text-primary)] mb-2">
                                {importResult.imported > 0 ? 'Import Complete!' : 'Import Failed'}
                            </h3>

                            <div className="space-y-2 mb-6">
                                <p className="text-[var(--dc-text-secondary)]">
                                    <span className="font-semibold text-emerald-400">{importResult.imported}</span> transactions imported
                                </p>
                                {importResult.obligationsMarked && importResult.obligationsMarked > 0 && (
                                    <p className="text-[var(--dc-text-secondary)]">
                                        <span className="font-semibold text-indigo-400">{importResult.obligationsMarked}</span> debit orders marked as paid
                                    </p>
                                )}
                                {importResult.skipped > 0 && (
                                    <p className="text-sm text-[var(--dc-text-muted)]">
                                        {importResult.skipped} duplicates skipped
                                    </p>
                                )}
                                {importResult.errors.length > 0 && (
                                    <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-left">
                                        {importResult.errors.slice(0, 3).map((error, i) => (
                                            <p key={i} className="text-xs text-red-400">{error}</p>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    onSuccess();
                                    onClose();
                                }}
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:opacity-90 transition-opacity"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
