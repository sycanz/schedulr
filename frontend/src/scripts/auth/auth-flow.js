export async function getToken() {
    try {
        const client_id = "CLIENT_ID"
        const state = Math.random().toString(36).substring(7)
        const scope = "https://www.googleapis.com/auth/calendar"
        const callbackUrl = chrome.identity.getRedirectURL("oauth");

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
        authUrl.searchParams.append("client_id", client_id);
        authUrl.searchParams.append("redirect_uri", callbackUrl);
        authUrl.searchParams.append("response_type", "code");
        authUrl.searchParams.append("access_type", "offline");
        authUrl.searchParams.append("scope", scope);
        authUrl.searchParams.append("state", state);
        authUrl.searchParams.append("include_granted_scopes", "true");
        authUrl.searchParams.append("prompt", "consent");

        console.log("Redirect URI: ", callbackUrl)
        console.log("Auth URL", authUrl)

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
            'CLOUDFLARE_WORKERS_ENDPOINT',
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
            console.log("got access token: ", accessToken)
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
        alert("There's an error in the authentication flow:", error)
    }
}