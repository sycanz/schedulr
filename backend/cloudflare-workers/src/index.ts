import { Hono } from 'hono'

type Env = {
    CLIENT_ID: string;
    CLIENT_SECRET: string;
    REDIRECT_URI: string;
};

type OAuthTokenResponse = {
    access_token: string;
    expires_in: number;
    id_token: string;
    scope: string;
    token_type: string;
    refresh_token?: string;
}

const app = new Hono<{ Bindings: Env }>()

app.post("/api/auth/token", async (c) => {
    const clientId = c.env.CLIENT_ID;
    const clientSecret = c.env.CLIENT_SECRET;
    const redirectUri = c.env.REDIRECT_URI;

    const body = await c.req.json();
    const now = Math.floor(Date.now() / 1000);

    try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                code: body.code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        if (response.ok) {
            const {
                access_token: accessToken,
                expires_in: expiresIn,
                refresh_token: refreshToken,
            } = (await response.json()) as OAuthTokenResponse;

            return c.json(
                {
                    accessToken,
                    expiresAt: now + expiresIn,
                    refreshToken,
                },
                200,
            );
        }

        const data = await response.json();
        console.error("request failed: ", data);
        return c.json({ data }, 400);
    } catch (error) {
        console.error("Error with authorization_code request: ", error);
        return c.json({ error }, 400)
    }
});

app.post("/api/auth/refresh", async (c) => {
    const clientId = c.env.CLIENT_ID;
    const clientSecret = c.env.CLIENT_SECRET;

    const body = await c.req.json();
    const now = Math.floor(Date.now() / 1000);
    
    try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: "refresh_token",
                refresh_token: body.refreshToken,
            }),
        });

        if (response.ok) {
            const { access_token: accessToken, expires_in: expiresIn } =
                (await response.json()) as OAuthTokenResponse;

            return c.json(
                {
                    accessToken,
                    expires: now + expiresIn,
                },
                200,
            );
        }

        const data = await response.json();
        console.error("request failed:", data)
        return c.json({ data }, 400);
    } catch (error) {
        console.error("Error with refresh token's request: ", error);
    }
});

export default app