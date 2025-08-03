export async function getCalIds(sessionToken) {
    const response = await fetch(__CFW_GET_CALENDAR_ENDPOINT_DEV__, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            sessionToken: sessionToken,
        })
    })

    if (response.ok) {
        console.log("Response:", response);
        const calObject = await response.json();
        if (calObject && calObject.data && Array.isArray(calObject.data.items)) {
            return parseCalIds(calObject.data.items);
        } else {
            console.error("Unexpected calendar response:", calObject);
            return {};
        }
    }
}

function parseCalIds(items) {
    let calJson = {};
    items.forEach((calendar) => {
        if (!calendar.summary.includes("Holidays") &&
            !calendar.summary.includes("Birthdays")) {
            calJson[calendar.summary] = calendar.id;
        }
    });

    return calJson;
}
