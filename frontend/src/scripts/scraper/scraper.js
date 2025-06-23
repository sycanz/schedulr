import { procClassName, procClassDetails, procClassDates, procClassTimes } from '../utils/studProc.js';
import { icalBlob } from './createIcs.js';

console.log("Script received message, going to get data from local storage")

// object for easy access to common vars
const config = {}

let classEvents = [];
let googleCalendarSuccess = false;
let icsDownloadSuccess = false;

export function dataProc(token, selectedSemesterValue, selectedReminderTime, selectedColorValue, selectedCalendar, selectedEventFormat, selectedOptionValue) {
    console.log("Execute script dataProc called");

    config.token = token;
    config.selectedSemesterValue = selectedSemesterValue;
    config.selectedReminderTime = selectedReminderTime;
    config.selectedColorValue = selectedColorValue;
    config.selectedCalendar = selectedCalendar;
    config.selectedEventFormat = selectedEventFormat;
    config.selectedOptionValue = selectedOptionValue;

    // =============== Web scrape workflow ===============
    // Declare iframe
    const iframeElement = document.querySelector("#ptifrmtgtframe");

    const lectIndicator = document.querySelector("table.ptalNoPadding.ptalPgltAreaControlsIcon a#ptalPgltAreaHide");
    
    console.log("Detecting user type");
    if (lectIndicator && iframeElement) {
        // Do the lecturer's process
        console.log("We got a lecturer here!");
        lectFlow(iframeElement);
    } else {
        // Do the student's process
        console.log("We got a student here!");
        studentFlow();
    }

    if (selectedOptionValue == 2) {
        // Create a blob file for users to download
        // console.log(classEvents);
        console.log("Creating blob");
        icalContent = icalBlob(classEvents, selectedReminderTime);

        console.log(icalContent);

        const icsContainer = document.querySelector('.ics-container');
        // if (icsContainer) {
        //     console.log("Found icsContainer", icsContainer);
        // }

        // Convert data to Blob
        const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);

        const downloadButton = document.createElement('a');
        downloadButton.href = blobUrl;
        downloadButton.download = 'schedulr.ics';
        downloadButton.innerText = 'Download .ics';
        downloadButton.classList.add('download-btn');

        console.log("Downloading ics file...");
        downloadButton.click()
        console.log("Download initiated");

        icsDownloadSuccess = true;
    }

    // =============== End of web scrape workflow ===============
    
    // Show alert only if an operation was successful
    if (googleCalendarSuccess && icsDownloadSuccess) {
        window.alert("Timetable transferred to Google Calendar and .ics file downloaded!");
    } else if (googleCalendarSuccess) {
        window.alert("Timetable successfully transferred to Google Calendar!");
    } else if (icsDownloadSuccess) {
        window.alert(".ics file downloaded! Now you can import it into a calendar of your choice.");
    } else {
        console.warn("Something went wrong");
        window.Error("Something went wrong");
    }
}

/* Start of flow types */

function studentFlow() {
    console.log("Running student process");
    let classSec = document.querySelectorAll("[id*='divSSR_SBJCT_LVL1_row']");

    // For each class sections
    classSec.forEach((element, index) => {
        // Select all class name, type, dates, times, and location
        let className = element.querySelectorAll("[id^='DERIVED_SSR_FL_SSR_SCRTAB_DTLS']");
        let classDetails = element.querySelectorAll("a[id^='DERIVED_SSR_FL_SSR_SBJ_CAT_NBR$355']");
        let classDates = element.querySelectorAll("[id^='DERIVED_SSR_FL_SSR_ST_END_DT1']");
        let classTimes = element.querySelectorAll("[id^='DERIVED_SSR_FL_SSR_DAYSTIMES1']");
        let classLoc = element.querySelectorAll("[id^='DERIVED_SSR_FL_SSR_DRV_ROOM1']");

        let maxSlots = Math.max(classDetails.length);

        for (let i = 0; i < maxSlots; i++) {
            // Get the text content of the elements
            let classNameText = className[0].textContent;
            let classDetailsText = classDetails[i].textContent.trim();
            let classDatesText = classDates[i].textContent.trim();
            let classTimesText = classTimes[i].textContent.trim();
            let classLocText = classLoc[i].textContent.trim();

            // Call function to ultimately create calendar event
            groupData(classNameText, classDetailsText, classDatesText, classTimesText, classLocText);
        }
    })

    console.log("Grouped events: ", classEvents);
    classEvents.forEach((element) => {
        if (config.selectedOptionValue == 1 && config.token) {
            createCalendarEvent(element);
        }
    })

    googleCalendarSuccess = true;
}

function lectFlow(iframeElement) {
    console.log("Running lecturer process");
    // Access the iframe's content document
    const iframeDocument = iframeElement.contentWindow.document.body;

    // Select elements in iframe
    const dayHeader = iframeDocument.querySelectorAll("th.PSLEVEL3GRIDODDROW");
    const rows = iframeDocument.querySelectorAll("table.PSLEVEL3GRIDODDROW  tr");
    const year = iframeDocument.querySelector("div#win0divDERIVED_CLASS_S_DESCR100_2 td.PSGROUPBOXLABEL.PSLEFTCORNER").textContent;
    const subjTitleVal = iframeDocument.querySelector('input[name="DERIVED_CLASS_S_SSR_DISP_TITLE$chk"][id="DERIVED_CLASS_S_SSR_DISP_TITLE$chk"]').value;
    const classInstructorVal = iframeDocument.querySelector('input[name="DERIVED_CLASS_S_SSR_DISP_ROLE$chk"][id="DERIVED_CLASS_S_SSR_DISP_ROLE$chk"]').value;

    if (!dayHeader || dayHeader.length === 0) {
        console.error("No day elements found");
        window.alert("No day elements found");
        return;
    }

    if (subjTitleVal === "N" && (selectedEventFormat === "2" || selectedEventFormat === "3")) {
        console.error('Please check "Show Class Title" box below the calendar under Display Options!');
        window.alert('Please check "Show Class Title" box below the calendar under Display Options!');
        return;
    }

    // Get the dates
    const days = []
    const dates = []
    dayHeader.forEach((element, index) => {
        if (index === 0) {
            dates.push("null");
        } else {
            const dayText = element.textContent.split("\n");
            const day = dayText[0].trim();
            let date = dayText[1]
            date = addZeroToDate(date);
            // console.log(`Day: ${day}, Date: ${date}`);
            days.push(day);
            dates.push(date);
            // console.log(`Days: ${days}, Date: ${dates}`);
        }
    });

    // days.shift();
    // dates.shift();
    // console.log(days);
    // console.log(dates);

    // Create array to store all events.
    let skip = createArray(12, 8, 0);

    // For every tr
    rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll("td.PSLEVEL3GRIDODDROW");
        // console.log(`Amount of cells: ${cells.length}`);

        // track current col skips
        let curColSkips = 0;

        // For every cell
        cells.forEach((cell, susColIndex) => {
            if (susColIndex > 0) { // Other than the first one
                let colIndex = susColIndex + curColSkips;
                // console.log(rowIndex, susColIndex);

                if (skip[rowIndex][susColIndex] > 0) {
                    curColSkips += 1;
                    colIndex += skip[rowIndex][susColIndex];
                }

                try {
                    const spanElement = cell.querySelector("span");
                    if (!spanElement) return;

                    // Get innerHTML and process data
                    const classContent = spanElement.innerHTML.split('<br>');
                    let result = procData(classContent, subjTitleVal, classInstructorVal);
                    // console.log(result);

                    const day = days[colIndex - 1];
                    const startDate = formatDate(dates[colIndex], year);
                    const endDate = formatDate(dates[colIndex], year);

                    /*
                Let user choose thier own event format:
                Subject Code - Section (Type)
                Subject Name - Section (Type)
                Subject Name - Code - Section (Type)
                */
                    let summary = `${result.subjCode} - ${result.classSect} (${result.classType})`;

                    if (selectedEventFormat === "2") {
                        summary = `${result.subjTitle} - ${result.classSect} (${result.classType})`;
                    } else if (selectedEventFormat === "3") {
                        summary = `${result.subjTitle} - ${result.subjCode} - ${result.classSect} (${result.classType})`;
                    }

                    console.log(`Summary: ${summary}, Location: ${result.classLocation}, Day: ${day}, startDateTime: ${startDate}T${result.startTime}, endDateTime: ${endDate}T${result.endTime}`);

                    // If class is 2 hours, mark slot below as "True"
                    let totalSpan = rowSpan(result.startTime, result.endTime);

                    // If the class's total span is more than an hour
                    if (totalSpan > 1) {
                        handleMultiHourClass(totalSpan, rowIndex, skip, colIndex);
                    }

                    const event = createCalEvent(summary, result.classLocation, startDate, result.startTime
                        , endDate, result.endTime, selectedSemesterValue, selectedColorValue, selectedReminderTime, selectedOptionValue);
                    // Append to array after defining events
                    // console.log('Event: ', event)

                    // classEvents.push(event);
                    // console.log(classEvents);

                    // Log the selected value
                    // console.log(`RRULE:FREQ=WEEKLY;COUNT=${selectedSemesterValue}`);
                    // console.log('Selected semester value:', selectedSemesterValue);

                    if (selectedOptionValue == 1) {
                        if (token) {
                            // console.log("Extension end");
                            createCalendarEvent(event);
                            googleCalendarSuccess = true;
                        }
                    }
                    classEvents.push(event);

                } catch (error) {
                    console.error('Error processing class data:', error);
                    window.alert('Failed to process class data:', error);
                    return;
                }
            }
        });
    });
}

/* End of flow types */

// =============== Helper functions ===============
// Function to create a calendar event
function createCalendarEvent(event) {
    console.log("Created google calendar events")
    fetch(`https://www.googleapis.com/calendar/v3/calendars/${config.selectedCalendar}/events`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
    })
        .then(response => {
            if (!response.ok) {
                console.error(`Error creating event: ${response.statusText}`);
                window.alert(`Error creating event: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Event created:', data);
        })
        .catch(error => {
            console.error('Error creating event:', error);
            window.alert(`Failed to create event: ${error.message}`);
        });
}

function createCalEvent(summary, classLocation, startDate, formattedStartTime, endDate, formattedEndTime, selectedSemesterValue, selectedColorValue, selectedReminderTime) {
    let event = {
        'summary': `${summary}`,
        'location': `${classLocation}`,
        'start': {
            'dateTime': `${startDate}T${formattedStartTime}`,
            'timeZone': 'Asia/Kuala_Lumpur'
        },
        'end': {
            'dateTime': `${endDate}T${formattedEndTime}`,
            'timeZone': 'Asia/Kuala_Lumpur'
        },
        'recurrence': [
            `RRULE:FREQ=WEEKLY;COUNT=${selectedSemesterValue}`
        ],
        'reminders': {
            'useDefault': false,
            'overrides': []
        },
    }

    if (selectedReminderTime !== "none") {
        event.reminders.overrides.push({
            'method': 'popup',
            'minutes': parseInt(selectedReminderTime)
        })
    }

    if (config.selectedOptionValue != 3) {
        event.colorId = selectedColorValue
    }

    return event;
}


function groupData(className, classDetails, classDates, classTimes, classLoc) {
    // console.log(className, classType, classDates, classTimes, classLoc);

    let { classCode, classNameOnly } = procClassName(className);
    let { classType, classSect } = procClassDetails(classDetails);
    let { startDate, endDate } = procClassDates(classDates);
    let { startTime, endTime } = procClassTimes(classTimes);

    // console.log(classCode, ",", classNameOnly, ",", classType, ",", classSect, ",", startDate, "-", endDate, ",", startTime, ",", endTime, ",", classLoc);

    /*
        Let user choose thier own event format:
        Subject Code - Section (Type)
        Subject Name - Section (Type)
        Subject Name - Code - Section (Type)
    */
    let summary = `${classCode} - ${classSect} (${classType})`;

    if (config.selectedEventFormat === "2") {
        summary = `${classNameOnly} - ${classSect} (${classType})`;
    } else if (config.selectedEventFormat === "3") {
        summary = `${classNameOnly} - ${classCode} - ${classSect} (${classType})`;
    }

    // console.log("Summary:", summary);

    const event = createCalEvent(summary, classLoc, startDate, startTime, startDate, endTime,
        config.selectedSemesterValue, config.selectedColorValue, config.selectedReminderTime, config.selectedOptionValue);

    classEvents.push(event);
}

// =============== End of helper functions ===============