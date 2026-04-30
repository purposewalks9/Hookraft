import * as react_jsx_runtime from 'react/jsx-runtime';
import { CSSProperties } from 'react';

declare const THEMES: Record<Exclude<useGithubContributions.Theme, "custom">, useGithubContributions.CustomColors>;
declare namespace useGithubContributions {
    interface ContributionDay {
        date: string;
        count: number;
        level: 0 | 1 | 2 | 3 | 4;
    }
    interface ContributionWeek {
        days: ContributionDay[];
    }
    interface ContributionData {
        weeks: ContributionWeek[];
        totalContributions: number;
        longestStreak: number;
        currentStreak: number;
    }
    type Theme = "github" | "halloween" | "winter" | "pink" | "dracula" | "custom";
    interface CustomColors {
        empty: string;
        level1: string;
        level2: string;
        level3: string;
        level4: string;
    }
    interface Options {
        username: string;
        theme?: Theme;
        customColors?: CustomColors;
        year?: number;
        proxyUrl?: string;
        onLoad?: (data: ContributionData) => void;
        onError?: (error: Error) => void;
    }
    interface Return {
        data: ContributionData | null;
        loading: boolean;
        error: Error | null;
        refetch: () => void;
    }
}
declare function useGithubContributions(options: useGithubContributions.Options): useGithubContributions.Return;

interface ContributionCalendarProps {
    username: string;
    year?: number;
    theme?: useGithubContributions.Theme;
    customColors?: useGithubContributions.CustomColors;
    blockSize?: number;
    blockGap?: number;
    showMonthLabels?: boolean;
    showDayLabels?: boolean;
    showThemeSwitcher?: boolean;
    className?: string;
    style?: CSSProperties;
    onContributionClick?: (day: useGithubContributions.ContributionDay) => void;
    proxyUrl?: string;
}
declare function ContributionCalendar({ username, year, theme: themeProp, customColors, blockSize, blockGap, showMonthLabels, showDayLabels, showThemeSwitcher, className, style, onContributionClick, proxyUrl, }: ContributionCalendarProps): react_jsx_runtime.JSX.Element | null;

export { ContributionCalendar, THEMES, useGithubContributions };
