import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';

declare namespace useAuth {
    type Status = "idle" | "loading" | "authenticated" | "locked" | "error";
    type LockoutReason = "max_attempts" | "bot_detection";
    type StorageType = "localStorage" | "sessionStorage" | "memory";
    interface TokenPayload {
        sub?: string;
        exp?: number;
        iat?: number;
        [key: string]: unknown;
    }
    interface LockoutState {
        reason: LockoutReason;
        lockedUntil: Date;
    }
    interface Options<C = unknown, U = unknown> {
        onLogin: (credentials: C) => Promise<{
            token: string;
            user?: U;
        }>;
        onLogout?: () => Promise<void> | void;
        onRefresh?: () => Promise<string>;
        onError?: (error: unknown) => void;
        decodeToken?: boolean;
        onTokenExpired?: () => void;
        storage?: StorageType;
        storageKey?: string;
        maxAttempts?: number;
        lockoutDuration?: number;
        minAttemptInterval?: number;
    }
    interface Return<C = unknown, U = unknown> {
        status: Status;
        is: (s: Status) => boolean;
        user: U | undefined;
        token: string | null;
        login: (credentials: C) => Promise<void>;
        logout: () => Promise<void>;
        tokenPayload: TokenPayload | null;
        tokenExpiresAt: Date | null;
        attempts: number;
        lockout: LockoutState | null;
        remainingTime: number;
        lockoutReason: LockoutReason | null;
    }
}
declare function useAuth<C = unknown, U = unknown>(options: useAuth.Options<C, U>): useAuth.Return<C, U>;

interface AuthProps {
    when: Auth.Status;
    children?: ReactNode;
    fallback?: ReactNode;
    onAuthenticated?: () => void;
    onLoading?: () => void;
    onLocked?: () => void;
    onError?: () => void;
    onIdle?: () => void;
}
declare function AuthRoot({ when, children, fallback, onAuthenticated, onLoading, onLocked, onError, onIdle, }: AuthProps): react_jsx_runtime.JSX.Element;
declare function Authenticated({ when, children }: {
    when: Auth.Status;
    children: ReactNode;
}): react_jsx_runtime.JSX.Element | null;
declare function Loading({ when, children }: {
    when: Auth.Status;
    children: ReactNode;
}): react_jsx_runtime.JSX.Element | null;
declare function Locked({ when, children }: {
    when: Auth.Status;
    children: ReactNode;
}): react_jsx_runtime.JSX.Element | null;
declare function Error({ when, children }: {
    when: Auth.Status;
    children: ReactNode;
}): react_jsx_runtime.JSX.Element | null;
declare namespace Auth {
    type Status = useAuth.Status;
    type LockoutReason = useAuth.LockoutReason;
    type LockoutState = useAuth.LockoutState;
    type StorageType = useAuth.StorageType;
    type TokenPayload = useAuth.TokenPayload;
}
declare const Auth: typeof AuthRoot & {
    Authenticated: typeof Authenticated;
    Loading: typeof Loading;
    Locked: typeof Locked;
    Error: typeof Error;
};

export { Auth, useAuth };
