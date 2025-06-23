// This function converts json object into ical format and write it into .ics file
export function icalBlob(event, selectedReminderTime) {
    // Define the header and footer of the iCalendar
    const icalHeader = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//sycanz/schedulr//EN`;
    const icalTz = `\nBEGIN:VTIMEZONE\nTZID:Asia/Kuala_Lumpur\nBEGIN:STANDARD\nTZOFFSETFROM:+0800\nTZOFFSETTO:+0800\nTZNAME:GMT+8\nEND:STANDARD\nEND:VTIMEZONE`
    const icalFooter = `\nEND:VCALENDAR`;

    allClasses = classCalIcs(event);

    const icalContent = icalHeader + icalTz + allClasses + icalFooter;

    return icalContent
}

function classCalIcs(event) {
    // Empty string to store all class events
    let allClasses = ""
    event.forEach((classes) => {
        // Convert from 2024-09-30T10:00:00 to 19980118T073000Z
        let dtStart = classes.start.dateTime.replace(/[-:]/g, "").split("+")[0];
        let dtEnd = classes.end.dateTime.replace(/[-:]/g, "").split("+")[0];

        let { uid, dtStamp } = uidAndDtstamp();

        // Create empty string to store all events
        let classEvent = `
BEGIN:VEVENT
SUMMARY:${classes.summary}
LOCATION:${classes.location}
DTSTART;TZID=${classes.start.timeZone}:${dtStart}
DTEND;TZID=${classes.end.timeZone}:${dtEnd}
${classes.recurrence[0]}
UID:${uid}
DTSTAMP:${dtStamp}Z`


        if (selectedReminderTime !== "none") {
            classEvent += `
BEGIN:VALARM
TRIGGER:-PT${selectedReminderTime}M
DESCRIPTION:${classes.summary}
ACTION:DISPLAY
END:VALARM`;
        }

        // Close the event
        classEvent += `\nEND:VEVENT`;

        // Append the class event to allClasses
        allClasses += classEvent;
    });

    return allClasses;
}

function uidAndDtstamp() {
    // Generate and get all necessary date time
    let date = new Date();
    const year = date.getFullYear().toString();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    // Generate a short random string
    const randomStr = Math.random().toString(36).substring(2, 8);

    const dtStamp = `${year}${month}${day}T${hours}${minutes}${seconds}`;
    const uid = `${randomStr}-${dtStamp}@schedulr.com`;
    // console.log(dtStamp, uid);

    return { uid, dtStamp };
}