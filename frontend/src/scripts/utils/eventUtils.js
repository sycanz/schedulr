export function craftCalEvent(
    config,
    summary,
    classLocation,
    startDate,
    formattedStartTime,
    endDate,
    formattedEndTime
) {
    let event = {
        summary: `${summary}`,
        location: `${classLocation}`,
        start: {
            dateTime: `${startDate}T${formattedStartTime}`,
            timeZone: "Asia/Kuala_Lumpur",
        },
        end: {
            dateTime: `${endDate}T${formattedEndTime}`,
            timeZone: "Asia/Kuala_Lumpur",
        },
        recurrence: [`RRULE:FREQ=WEEKLY;COUNT=${config.selectedSemesterValue}`],
        reminders: {
            useDefault: false,
            overrides: [],
        },
    };

    if (config.selectedReminderTime !== "none") {
        event.reminders.overrides.push({
            method: "popup",
            minutes: parseInt(config.selectedReminderTime),
        });
    }

    if (config.selectedOptionValue != 2 && config.selectedColorValue !== "default") {
        event.colorId = config.selectedColorValue;
    }

    return event;
}
