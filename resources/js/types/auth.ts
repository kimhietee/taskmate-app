export type User = {
    id: number;
    name: string;
    avatar?: string;
    user_type: 'student' | 'faculty_staff' | 'organization';
    is_admin: boolean;
    can_post_tasks: boolean;
    can_apply_tasks: boolean;
    can_browse_tasks?: boolean;
    can_request_student_verification?: boolean;
    verification_status: 'unverified' | 'pending' | 'verified' | 'rejected' | 'more_info_requested';
    /* @chisel-2fa */
    two_factor_enabled?: boolean;
    /* @end-chisel-2fa */
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */

/* @chisel-2fa */
export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
/* @end-chisel-2fa */
