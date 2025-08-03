export async function exchangeCodeForToken(code: string, clientId: string, clientSecret: string, redirectUri: string) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            code: code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(JSON.stringify(data));
    }

    return data;
}

export function decodeJwtPayload(token: string): any {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');

    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');

    const decoded = atob(padded);
    return JSON.parse(decoded);
}

export async function getNewValidAuthToken(refreshToken: string, authRefreshEndpointDev: string) {
    // refresh oauth token then store it in db
    console.log("Refresh endpoint:", authRefreshEndpointDev);
    const response = await fetch(
        authRefreshEndpointDev,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                refreshToken,
            }),
        },
    );

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Session Token Validity Check failed:", errorData);
        throw new Error("Failed to refresh token");
    }

    const { accessToken, expires } = await response.json()
    const authExpiresAtISO = new Date((expires) * 1000).toISOString();
    return { accessToken, authExpiresAtISO };
}
