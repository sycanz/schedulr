export async function getCalIds(token) {
    const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    })

    if (response.ok) {
        const calObject = await response.json();
        return parseCalIds(calObject);
    }
}

function parseCalIds(calObject) {
    // console.log("Parsing calendars");

    let calJson = {};
    calObject.items.forEach((calendar) => {
        if (!calendar.summary.includes("Holidays") &&
            !calendar.summary.includes("Birthdays")) {
            calJson[calendar.summary] = calendar.id;
        }
    });

    // console.log("Got calendars, returning to service worker");
    return calJson;
}
