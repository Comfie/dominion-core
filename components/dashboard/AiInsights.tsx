'use client';

import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface SpendingInsight {
    summary: string;
    highlights: string[];
    recommendations: string[];
    trend: 'improving' | 'stable' | 'concerning';
}

export function AiInsights() {
    const [insights, setInsights] = useState<SpendingInsight | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchInsights = async (forceString: boolean = false) => {
        // Check cache first if not forced
        if (!forceString) {
            const cached = localStorage.getItem('dc_insights_cache');
            if (cached) {
                try {
                    const { data, timestamp } = JSON.parse(cached);
                    // Cache valid for 1 hour
                    if (Date.now() - timestamp < 60 * 60 * 1000) {
                        setInsights(data);
                        return;
                    }
                } catch (e) {
                    localStorage.removeItem('dc_insights_cache');
                }
            }
        }

        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/ai/insights');
            if (res.ok) {
                const data = await res.json();
                setInsights(data);
                // Save to cache
                localStorage.setItem('dc_insights_cache', JSON.stringify({
                    data,
                    timestamp: Date.now()
                }));
            } else {
                throw new Error('Failed to fetch insights');
            }
        } catch (err) {
            setError('Unable to load insights');
            // Set default insights on error
            setInsights({
                summary: 'Add your income and obligations to get personalized AI insights.',
                highlights: ['Track your monthly expenses', 'Set up your financial profile'],
                recommendations: ['Start by adding your regular obligations'],
                trend: 'stable',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    const getTrendIcon = () => {
        switch (insights?.trend) {
            case 'improving':
                return <TrendingUp className="w-4 h-4 text-green-400" />;
            case 'concerning':
                return <TrendingDown className="w-4 h-4 text-red-400" />;
            default:
                return <Minus className="w-4 h-4 text-yellow-400" />;
        }
    };

    const getTrendColor = () => {
        switch (insights?.trend) {
            case 'improving':
                return 'text-green-400';
            case 'concerning':
                return 'text-red-400';
            default:
                return 'text-yellow-400';
        }
    };

    return (
        <GlassCard
            className="p-6"
            delay={0.5}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[var(--dc-text-primary)]">AI Monthly Insights</p>
                        <p className="text-xs text-[var(--dc-text-muted)]">Powered by Claude</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchInsights(true)}
                    disabled={isLoading}
                    className="p-2 rounded-lg hover:bg-[var(--dc-bg-secondary)] transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 text-[var(--dc-text-muted)] ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Content */}
            {isLoading && !insights ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-[var(--dc-primary)] animate-spin" />
                </div>
            ) : insights ? (
                <div className="space-y-4">
                    {/* Summary with trend */}
                    <div className="p-3 rounded-lg bg-[var(--dc-bg-secondary)]">
                        <div className="flex items-center gap-2 mb-2">
                            {getTrendIcon()}
                            <span className={`text-xs font-medium capitalize ${getTrendColor()}`}>
                                {insights.trend}
                            </span>
                        </div>
                        <p className="text-sm text-[var(--dc-text-primary)]">
                            {insights.summary}
                        </p>
                    </div>

                    {/* Highlights */}
                    {insights.highlights.length > 0 && (
                        <div>
                            <p className="text-xs text-[var(--dc-text-muted)] mb-2">Key Observations</p>
                            <ul className="space-y-1">
                                {insights.highlights.slice(0, 3).map((highlight, idx) => (
                                    <li
                                        key={idx}
                                        className="text-sm text-[var(--dc-text-secondary)] flex items-start gap-2"
                                    >
                                        <span className="text-[var(--dc-primary)]">•</span>
                                        {highlight}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Recommendations */}
                    {insights.recommendations.length > 0 && (
                        <div>
                            <p className="text-xs text-[var(--dc-text-muted)] mb-2">Recommendations</p>
                            <ul className="space-y-1">
                                {insights.recommendations.slice(0, 2).map((rec, idx) => (
                                    <li
                                        key={idx}
                                        className="text-sm text-[var(--dc-text-secondary)] flex items-start gap-2"
                                    >
                                        <span className="text-green-400">→</span>
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-sm text-[var(--dc-text-muted)] text-center py-4">
                    {error || 'No insights available'}
                </p>
            )}
        </GlassCard>
    );
}
