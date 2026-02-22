import { showErrorNotification } from "../utils/errorNotifier.js";

export async function getCalIds(sessionToken) {
    const response = await fetch(__CFW_GET_CALENDAR_ENDPOINT__, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            sessionToken: sessionToken,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Calendar fetch failed:", errorData);
        showErrorNotification(
            "Failed to fetch calendars. Please check your internet connection and try again.",
            "Calendar Error"
        );
        return {};
    }

    const calObject = await response.json();
    if (!calObject || !calObject.data || !Array.isArray(calObject.data.items)) {
        console.error("Unexpected calendar response:", calObject);
        showErrorNotification(
            "Invalid calendar data received. Please try again.",
            "Calendar Error"
        );
        return {};
    }

    return parseCalIds(calObject.data.items);
}

function parseCalIds(items) {
    let calJson = {};
    items.forEach((calendar) => {
        if (
            !calendar.summary.includes("Holidays") &&
            !calendar.summary.includes("Birthdays")
        ) {
            calJson[calendar.summary] = calendar.id;
        }
    });

    return calJson;
}
