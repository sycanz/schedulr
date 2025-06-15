export async function onlaunchWebAuthFlow() {
    try {
        const clientId = "CLIENT_ID"
        // const clientId = "879287591532-uga057u09bnhd4o1kv48kpacbjg2aqlf.apps.googleusercontent.com"
        const state = Math.random().toString(36).substring(7)
        const scope = "https://www.googleapis.com/auth/calendar"
        const redirectUri = chrome.identity.getRedirectURL("oauth");

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
        authUrl.searchParams.append("client_id", clientId);
        authUrl.searchParams.append("redirect_uri", redirectUri);
        authUrl.searchParams.append("response_type", "code");
        authUrl.searchParams.append("scope", scope);
        authUrl.searchParams.append("access_type", "offline");
        authUrl.searchParams.append("state", state);
        authUrl.searchParams.append("include_granted_scopes", "true");
        authUrl.searchParams.append("prompt", "consent");

        const url = await new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow(
                {
                    url: authUrl.toString(),
                    interactive: true,
                },
                (redirectUrl) => {
                    if (chrome.runtime.lastError || !redirectUrl) {
                        throw new Error (
                            `WebAuthFlow failed: ${chrome.runtime.lastError.message}`,
                        )
                    }
                    resolve(redirectUrl);
                }
            );
        });

        const fragment = new URLSearchParams(url.split("?")[1]);
        const responseState = fragment.get("state");
        const code = fragment.get("code");

        if (state != responseState) {
            throw new Error("If you're not the actual user, GET OUT!")
        }

        if (!code) {
            throw new Error("No access token found in redirect URL");
        }

        const response = await fetch(
            // 'CLOUDFLARE_WORKER_ENDPOINT,'
            // 'http://localhost:8787/api/auth/token',
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    code,
                }),
            },
        );

        if (!response.ok) {
            console.log(response)
        }

        const { accessToken, expiresAt, refreshToken } = await response.json()

        if (accessToken) {
            await chrome.storage.local.set({
                accessTokens: accessToken,
                refreshTokens: refreshToken,
                expiresAts: expiresAt,
            })
            return accessToken;
        } else {
            throw new Error("Access token not found in the server response.");
        }
    } catch (error) {
        console.error("Error in getToken:", error);
    }
}