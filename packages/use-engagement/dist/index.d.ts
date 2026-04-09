declare namespace useEngagement {
    interface EngagementData {
        pageUrl: string;
        totalClicks: number;
        clickTargets: string[];
        activeTime: number;
        idleTime: number;
        scrollDepth: number;
        enteredAt: number;
        exitAt: number | null;
    }
    interface Options {
        onSync: (data: EngagementData) => void | Promise<void>;
        idleTimeout?: number;
        trackClicks?: boolean;
        trackScroll?: boolean;
        storageKey?: string;
        maxQueue?: number;
    }
    interface Return {
        data: EngagementData;
        isActive: boolean;
        flush: () => void;
    }
}
declare function useEngagement(options: useEngagement.Options): useEngagement.Return;

export { useEngagement };
