import { Hono } from "hono";
import { cors } from "hono/cors";
import { v4 as uuidv4 } from "uuid";
import {
    exchangeCodeForToken,
    decodeJwtPayload,
    getNewValidAuthToken,
} from "../dist/googleAuth.bundle.js";
import {
    getUserId,
    getUserIdWithSessionToken,
    getUserOAuthDetails,
    getUserSessionDetails,
    insertUserDetails,
    insertOAuthDetails,
    insertSessionDetails,
    updateExpiredOAuthDetails,
} from "./lib/db";
import { getSupabaseClient } from "../../db/supabase.js";

type Env = {
    CLIENT_ID: string;
    CLIENT_SECRET: string;
    REDIRECT_URI: string;
    CFW_REFRESH_ENDPOINT: string;
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
};

type OAuthTokenResponse = {
    access_token: string;
    expires_in: number;
    id_token: string;
    scope: string;
    token_type: string;
    refresh_token?: string;
};

type JWTTokenContent = {
    sub: string;
    name: string;
    email: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use(
    "*",
    cors({
        origin: "https://clic.mmu.edu.my",
        allowMethods: ["GET", "POST"],
        allowHeaders: ["Content-Type", "Authorization"],
    })
);

app.post("/api/auth/return-user", async (c) => {
    const {
        CFW_REFRESH_ENDPOINT: authRefreshEndpointDev,
        SUPABASE_URL: supabaseUrl,
        SUPABASE_KEY: supabaseKey,
    } = c.env;
    const supabase = getSupabaseClient(supabaseUrl, supabaseKey);
    const body = await c.req.json();

    const userId = await getUserIdWithSessionToken(supabase, body.sessionToken);
    const userSession = await getUserSessionDetails(supabase, userId);
    if (!userSession) {
        return c.json(
            { error: "No session details found for this user!" },
            400
        );
    }

    const { expires_at: sessionTokenExpiresAt } = userSession;

    let tokenExpired;
    const timeNow = new Date().toISOString();
    if (timeNow > sessionTokenExpiresAt) {
        tokenExpired = true;
        // get new token and update oauth table
        const userOAuth = await getUserOAuthDetails(supabase, userId);
        if (!userOAuth) {
            return c.json({ error: "No OAuth details found!" }, 400);
        }

        const { refresh_token: refreshToken } = userOAuth;
        const refreshed = await getNewValidAuthToken(
            refreshToken,
            authRefreshEndpointDev
        );
        await updateExpiredOAuthDetails(
            supabase,
            userId,
            refreshed.accessToken,
            refreshed.authExpiresAtISO
        );

        // update session table
        const sessionToken = uuidv4();
        const sessionExpiresAtISO = new Date(
            Date.now() + 30 * 60 * 1000
        ).toISOString();
        const userIpAddr = c.req.header("CF-Connecting-IP") || "";
        const userAgent = c.req.header("User-Agent") || "";
        await insertSessionDetails(
            supabase,
            userId,
            sessionToken,
            sessionExpiresAtISO,
            userIpAddr,
            userAgent
        );

        // return data to update local storage
        return c.json({ tokenExpired, sessionToken, sessionExpiresAtISO }, 200);
    } else if (timeNow < sessionTokenExpiresAt) {
        tokenExpired = false;
        return c.json({ tokenExpired }, 200);
    }
});

app.post("/api/auth/token", async (c) => {
    const {
        CLIENT_ID: clientId,
        CLIENT_SECRET: clientSecret,
        REDIRECT_URI: redirectUri,
        SUPABASE_URL: supabaseUrl,
        SUPABASE_KEY: supabaseKey,
    } = c.env;
    const supabase = getSupabaseClient(supabaseUrl, supabaseKey);
    const body = await c.req.json();

    try {
        const data = await exchangeCodeForToken(
            body.code,
            clientId,
            clientSecret,
            redirectUri
        );

        const {
            access_token: accessToken,
            expires_in: expiresIn,
            refresh_token: refreshToken,
            id_token: idToken,
        } = data as OAuthTokenResponse;

        const decodedIdToken = decodeJwtPayload(idToken);
        const { email, sub, name } = decodedIdToken as JWTTokenContent;
        let userId = await getUserId(supabase, sub);
        if (userId == null) {
            await insertUserDetails(supabase, email, sub, name);
        }

        const now = Math.floor(Date.now() / 1000);
        const authExpiresAtISO = new Date(
            (now + expiresIn) * 1000
        ).toISOString();

        userId = await getUserId(supabase, sub);
        await insertOAuthDetails(
            supabase,
            userId,
            accessToken,
            refreshToken || "",
            authExpiresAtISO
        );

        const sessionToken = uuidv4();
        const sessionExpiresAtISO = new Date((now + 1800) * 1000).toISOString();
        const userIpAddr = c.req.header("CF-Connecting-IP") || "";
        const userAgent = c.req.header("User-Agent") || "";
        await insertSessionDetails(
            supabase,
            userId,
            sessionToken,
            sessionExpiresAtISO,
            userIpAddr,
            userAgent
        );

        return c.json({ sessionToken, sessionExpiresAtISO }, 200);
    } catch (error) {
        console.error("Error with authorization_code request: ", error);
        return c.json({ error }, 400);
    }
});

app.post("/api/auth/refresh", async (c) => {
    const {
        CLIENT_ID: clientId,
        CLIENT_SECRET: clientSecret,
        SUPABASE_URL: supabaseUrl,
        SUPABASE_KEY: supabaseKey,
    } = c.env;
    const supabase = getSupabaseClient(supabaseUrl, supabaseKey);

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
                200
            );
        }

        const data = await response.json();
        console.error("request failed:", data);
        return c.json({ data }, 400);
    } catch (error) {
        console.error("Error with refresh token's request: ", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});

app.post("/api/calendar/add-events", async (c) => {
    const { SUPABASE_URL: supabaseUrl, SUPABASE_KEY: supabaseKey } = c.env;
    const body = await c.req.json();
    const supabase = getSupabaseClient(supabaseUrl, supabaseKey);

    const userId = await getUserIdWithSessionToken(supabase, body.sessionToken);
    const userSession = await getUserSessionDetails(supabase, userId);
    if (!userSession) {
        return c.json(
            { error: "No session details found for this user!" },
            400
        );
    }
    const { expires_at: sessionTokenExpiresAt } = userSession;

    if (sessionTokenExpiresAt < new Date().toISOString()) {
        return c.json(
            { error: "Session expired, please reauthenticate!" },
            400
        );
    }

    const userOAuth = await getUserOAuthDetails(supabase, userId);
    if (!userOAuth) {
        return c.json({ error: "No OAuth details found!" }, 400);
    }
    const { access_token: accessToken } = userOAuth;

    try {
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${body.selectedCalendar}/events`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body.event),
            }
        );

        if (response.ok) {
            const data = await response.json();
            console.log("Event created:", data);
            return c.json({ data }, 200);
        }

        const data = await response.json();
        console.error("request failed:", data);
        return c.json({ data }, 400);
    } catch (error) {
        console.error("Error with add-events request: ", error);
        return c.json({ error: "Failed to add events" }, 500);
    }
});

app.post("/api/calendar/get-calendar-list", async (c) => {
    const { SUPABASE_URL: supabaseUrl, SUPABASE_KEY: supabaseKey } = c.env;
    const body = await c.req.json();
    const supabase = getSupabaseClient(supabaseUrl, supabaseKey);

    const userId = await getUserIdWithSessionToken(supabase, body.sessionToken);
    const userOAuth = await getUserOAuthDetails(supabase, userId);
    if (!userOAuth) {
        return c.json({ error: "No OAuth details found!" }, 400);
    }
    const { access_token: accessToken } = userOAuth;

    try {
        const response = await fetch(
            "https://www.googleapis.com/calendar/v3/users/me/calendarList",
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.ok) {
            const data = await response.json();
            return c.json({ data }, 200);
        }

        const data = await response.json();
        console.error("request failed:", data);
        return c.json({ data }, 400);
    } catch (error) {
        console.error("Error with get-calendar-list request: ", error);
        return c.json({ error: "Failed to get calendar list" }, 500);
    }
});

export default app;
