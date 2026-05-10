declare namespace useRenderXray {
    type Trigger = 'state' | 'props' | 'parent' | 'mixed';
    type ChangeReason = 'value-changed' | 'object-value-changed' | 'same-value-new-reference' | 'new-function-reference' | 'added' | 'removed';
    type ChangeSource = 'prop' | 'state';
    type Severity = 'expected' | 'avoidable' | 'expensive';
    type Change = {
        source: ChangeSource;
        key: string;
        prev: unknown;
        next: unknown;
        reason: ChangeReason;
        avoidable: boolean;
        severity: Severity;
    };
    type Record = {
        component: string;
        renderCount: number;
        stableRenderCount: number;
        trigger: Trigger;
        changes: Change[];
        hasAvoidableChanges: boolean;
        duration?: number;
        timestamp: number;
        _isStrictModeReplay?: boolean;
    };
    type FilterOptions = {
        includeProps?: boolean;
        includeState?: boolean;
        includeFunctions?: boolean;
        includeParentTriggers?: boolean;
    };
    type Options = {
        log?: boolean;
        track?: boolean;
        maxHistory?: number;
        onlyAvoidable?: boolean;
        onRender?: (record: useRenderXray.Record) => void;
        filter?: FilterOptions;
    };
    type Return = {
        renderCount: number;
        stableRenderCount: number;
        history: useRenderXray.Record[];
        clearHistory: () => void;
    };
}
declare function useRenderXray(componentName: string, props: Record<string, unknown>, state?: Record<string, unknown>, options?: useRenderXray.Options): useRenderXray.Return;

export { useRenderXray };
