export function getToken() {
    return new Promise((resolve, reject) => {
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
            authUrl.searchParams.append("prompt", "consent select_account");

            console.log("Redirect URI: ", callbackUrl)
            console.log("Auth URL", authUrl)

            chrome.identity.launchWebAuthFlow(
                {
                    url: authUrl.toString(),
                    interactive: true,
                }
            )
            .then((url) => {
                console.log("Reponse URL: ", url);
                const fragment = new URLSearchParams(url.split("?")[1]);
                const responseState = fragment.get("state");
                const code = fragment.get("code");

                console.log("Orig state:", state);
                console.log("Response state", responseState);

                if (state != responseState) {
                    throw new Error("If you're not the actual user, GET OUT!")
                }

                if (!code) {
                    throw new Error("No access token found in redirect URL");
                }

                console.log("Code: ", code);
                // resolve(accessToken)
            })
            .catch((err) => console.log(err));
        } catch (error) {
            reject(new Error(`Sign-in failed: ${error.message}`));
        }
    })
}