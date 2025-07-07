function getStorageData(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (items) => {
            resolve(items);
        });
    });
}

function setStorageData(items) {
    return new Promise((resolve) => {
        chrome.storage.local.set(items, () => {
            resolve();
        });
    });
}

async function getExistingOrRefreshedToken() {
    try {
        const { accessTokens, refreshTokens, expiresAts } =
            await getStorageData(["accessTokens", "refreshTokens", "expiresAts"]);

        const nowInSeconds = Math.floor(Date.now() / 1000);
        const nowPlus60 = nowInSeconds + 60;

        if (accessTokens && expiresAts > nowPlus60) {
            return accessTokens;
        }

        if (refreshTokens) {
            const response = await fetch(__CFW_REFRESH_ENDPOINT__, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    refreshToken: refreshTokens,
                }),
            });

            if (response.ok) {
                const { accessToken, expiresAt } = await response.json();
                await setStorageData({
                    accessTokens: accessToken,
                    expiresAts: expiresAt
                });
                return accessToken;
            } else {
                const data = await response.json();
                console.error("Refresh token request failed: ", data);
            }
        }
        
        return null;
    } catch (error) {
        console.error("Error checking or refreshing token:", error);
        return null;
    }
}

export async function onlaunchWebAuthFlow() {
    try {
        const currentAccessToken = await getExistingOrRefreshedToken();
        if (currentAccessToken) {
            console.log("Got token by refreshing/storage")
            return currentAccessToken;
        }

        const clientId = __CLIENT_ID__;
        const state = Math.random().toString(36).substring(7)
        const scope = "openid https://www.googleapis.com/auth/calendar"
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
            __CFW_AUTH_ENDPOINT__,
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
            const errorData = await response.json();
            console.error("Token exchange failed:", errorData);
        }

        const { accessToken, expiresAt, refreshToken } = await response.json()

        if (accessToken) {
            await setStorageData({
                accessTokens: accessToken,
                refreshTokens: refreshToken,
                expiresAts: expiresAt,
            })
            return accessToken;
        } else {
            throw new Error("Access token not found in the server response.");
        }
    } catch (error) {
        console.error("Error onLaunchWebAuthFlow:", error);
    }
}