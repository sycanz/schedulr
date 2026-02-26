import { showErrorNotification } from "../utils/msgNotifier.js";

export function getStorageData(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (items) => {
            resolve(items);
        });
    });
}

export function setStorageData(items) {
    return new Promise((resolve) => {
        chrome.storage.local.set(items, () => {
            resolve();
        });
    });
}

export async function checkSessionTokenValidity() {
    const { session_token: sessionToken, session_expires_at_iso: sessionExpiresAtISO } = await getStorageData([
        "session_token",
        "session_expires_at_iso",
    ]);

    const now = new Date().toISOString();
    if (!sessionToken || !sessionExpiresAtISO || sessionExpiresAtISO < now) {
        return false;
    }

    // crosscheck with session token stored in db
    const response = await fetch(__CFW_CHECK_RETURN_USER_ENDPOINT__, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            sessionToken,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Session Token Validity Check failed:", errorData);
        showErrorNotification("Session validation failed. Please re-authenticate.", "Authentication Error");
        return null;
    }

    const data = await response.json();
    if (data.tokenExpired) {
        await setStorageData({
            session_token: data.sessionToken,
            session_expires_at_iso: data.sessionExpiresAtISO,
            user_email: data.email,
        });
        return data.sessionToken;
    } else {
        if (data.email) {
            await setStorageData({ user_email: data.email });
        }
        return sessionToken;
    }
}

export async function onLaunchWebAuthFlow() {
    const clientId = __CLIENT_ID__;
    const state = Math.random().toString(36).substring(7);
    const scope =
        "openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar";
    const redirectUri = chrome.identity.getRedirectURL("oauth");

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", scope);
    authUrl.searchParams.append("access_type", "offline");
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("include_granted_scopes", "true");
    authUrl.searchParams.append("prompt", "consent");

    // retrieve authentication code
    const url = await new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
            {
                url: authUrl.toString(),
                interactive: true,
            },
            (redirectUrl) => {
                if (chrome.runtime.lastError || !redirectUrl) {
                    const errorMessage = chrome.runtime.lastError
                        ? chrome.runtime.lastError.message
                        : "Authentication was cancelled";
                    reject(new Error(`WebAuthFlow failed: ${errorMessage}`));
                } else {
                    resolve(redirectUrl);
                }
            }
        );
    });

    const fragment = new URLSearchParams(url.split("?")[1]);
    const responseState = fragment.get("state");
    const code = fragment.get("code");

    if (state != responseState) {
        showErrorNotification("Authentication state mismatch. Please try again.", "Authentication Error");
        return null;
    }

    if (!code) {
        showErrorNotification("No authorization code received. Please try again.", "Authentication Error");
        return null;
    }

    const response = await fetch(__CFW_AUTH_ENDPOINT__, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            code,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Token exchange failed:", errorData);
        showErrorNotification("Failed to exchange authorization code. Please try again.", "Authentication Error");
        return null;
    }

    const { sessionToken, sessionExpiresAtISO, email } = await response.json();

    if (sessionToken && sessionExpiresAtISO) {
        await setStorageData({
            session_token: sessionToken,
            session_expires_at_iso: sessionExpiresAtISO,
            user_email: email,
        });
        return sessionToken;
    } else {
        showErrorNotification("Session token not found in the server response.", "Authentication Error");
        return null;
    }
}
