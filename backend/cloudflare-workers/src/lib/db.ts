import { SupabaseClient } from "@supabase/supabase-js";

export async function getUserId(supabase: SupabaseClient, sub: string) {
    const { data, error: getUserIdError } = await supabase.from("users").select("id").eq("sub", sub).limit(1);

    if (getUserIdError || !data || data.length == 0) {
        return null;
    } else {
        return data[0].id;
    }
}

export async function getUserIdWithSessionToken(supabase: SupabaseClient, sessionToken: string) {
    // check whether session token exists in any row
    const { data, error: getUserIdError } = await supabase
        .from("sessions")
        .select("user_id")
        .eq("session_token", sessionToken)
        .limit(1);

    if (getUserIdError || !data || data.length == 0) {
        return null;
    } else {
        return data[0].user_id;
    }
}

export async function getUserOAuthDetails(supabase: SupabaseClient, userId: string) {
    const { data, error: getUserOAuthError } = await supabase
        .from("oauth_tokens")
        .select("access_token, refresh_token")
        .eq("user_id", userId)
        .limit(1);

    if (getUserOAuthError || !data || data.length == 0) {
        return null;
    }

    let accessToken, refreshToken;
    return ({ access_token: accessToken, refresh_token: refreshToken } = data[0]);
}

export async function getUserEmail(supabase: SupabaseClient, userId: string) {
    const { data, error: getUserOAuthError } = await supabase.from("users").select("email").eq("id", userId).single();

    if (getUserOAuthError || !data) {
        return null;
    }

    return data.email;
}

export async function getUserSessionDetails(supabase: SupabaseClient, userId: string) {
    const { data, error: getUserSessionError } = await supabase
        .from("sessions")
        .select("expires_at")
        .eq("user_id", userId)
        .limit(1);

    if (getUserSessionError || !data || data.length == 0) {
        return null;
    }

    const { expires_at } = data[0];
    return { expires_at };
}

export async function insertUserDetails(supabase: SupabaseClient, email: string, sub: string, name: string) {
    const { error: userInsertError } = await supabase.from("users").upsert(
        {
            email: email,
            sub: sub,
            name: name,
        },
        {
            onConflict: "sub",
            ignoreDuplicates: false,
        }
    );

    if (userInsertError) {
        throw new Error(JSON.stringify(userInsertError));
    }
}

export async function insertOAuthDetails(
    supabase: SupabaseClient,
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresAtISO: string
) {
    const { error: tokenInsertError } = await supabase.from("oauth_tokens").upsert(
        {
            user_id: userId,
            access_token: accessToken,
            refresh_token: refreshToken,
            access_token_expires_at: expiresAtISO,
            scope: "openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar",
        },
        {
            onConflict: "user_id",
            ignoreDuplicates: false,
        }
    );

    if (tokenInsertError) {
        throw new Error(JSON.stringify(tokenInsertError));
    }
}

export async function insertSessionDetails(
    supabase: SupabaseClient,
    userId: string,
    sessionToken: string,
    sessionExpiresAtISO: string,
    userIpAddr: string,
    userAgent: string
) {
    const now = new Date().toISOString();

    const { error: sessionInsertError } = await supabase.from("sessions").upsert(
        {
            user_id: userId,
            session_token: sessionToken,
            expires_at: sessionExpiresAtISO,
            last_accessed_at: now,
            ip_address: userIpAddr,
            user_agent: userAgent,
        },
        {
            onConflict: "user_id",
            ignoreDuplicates: false,
        }
    );

    if (sessionInsertError) {
        throw new Error(JSON.stringify(sessionInsertError));
    }
}

export async function updateExpiredOAuthDetails(
    supabase: SupabaseClient,
    userId: string,
    accessToken: string,
    expires: string
) {
    const { error: updateExpiredOAuthError } = await supabase
        .from("oauth_tokens")
        .update({
            access_token: accessToken,
            access_token_expires_at: expires,
            updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

    if (updateExpiredOAuthError) {
        throw new Error(JSON.stringify(updateExpiredOAuthError));
    }
}
