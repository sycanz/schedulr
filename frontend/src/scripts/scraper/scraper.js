import { procClassName, procClassDetails, procClassDates, procClassTimes, procClassDay } from "../utils/studProc.js";
import { icalBlob } from "./createIcs.js";
import { showErrorNotification, showSuccessNotification } from "../utils/msgNotifier.js";
import { getStorageData } from "../auth/authFlow.js";
import { addZeroToDate, createArray, procData, formatDate, rowSpan, handleMultiHourClass } from "../utils/lectProc.js";

// object for easy access to common vars
let config = {};
let classEvents = [];
let googleCalendarSuccess = false;
let icsDownloadSuccess = false;

export async function dataProc(
    sessionToken,
    selectedSemesterValue,
    selectedReminderTime,
    selectedColorValue,
    selectedCalendar,
    selectedEventFormat,
    selectedDefect,
    selectedOptionValue
) {
    console.log("Execute script dataProc called");

    config.sessionToken = sessionToken;
    config.selectedSemesterValue = selectedSemesterValue;
    config.selectedReminderTime = selectedReminderTime;
    config.selectedColorValue = selectedColorValue;
    config.selectedCalendar = selectedCalendar;
    config.selectedEventFormat = selectedEventFormat;
    config.selectedDefect = selectedDefect;
    config.selectedOptionValue = selectedOptionValue;

    // =============== Web scrape workflow ===============
    // Declare iframe
    const iframeElement = document.querySelector("#ptifrmtgtframe");
    const lectIndicator = document.querySelector("table.ptalNoPadding.ptalPgltAreaControlsIcon a#ptalPgltAreaHide");

    console.log("Detecting user type");
    // lecturers and students have different UI, need to execute appropriate flow
    if (lectIndicator && iframeElement) {
        await lectFlow(iframeElement);
    } else {
        await studentFlow();
    }

    if (selectedOptionValue == 1 && sessionToken) {
        await syncGoogleCalendar();
    } else if (selectedOptionValue == 2) {
        downloadICS();
    }

    // =============== End of web scrape workflow ===============

    // Show alert only if an operation was successful
    if (googleCalendarSuccess && icsDownloadSuccess) {
        showSuccessNotification(
            "Timetable transferred to Google Calendar and .ics file downloaded!",
            "Schedulr Success",
            false,
            true
        );
    } else if (googleCalendarSuccess) {
        showSuccessNotification(
            "Timetable successfully transferred to Google Calendar!",
            "Schedulr Success",
            false,
            true
        );
    } else if (icsDownloadSuccess) {
        showSuccessNotification(
            ".ics file downloaded! Now you can import it into a calendar of your choice.",
            "Schedulr Success",
            false,
            true
        );
    } else {
        showErrorNotification("No data was processed. Please make sure you're on the correct page and try again.");
    }

    // Notify popup that processing is complete
    try {
        chrome.runtime.sendMessage({ action: "importComplete" });
    } catch (err) {
        console.log("Popup likely closed, skipping message");
    }
}

/* Start of flow types */

async function studentFlow() {
    console.log("Running student process");
    let classSec = document.querySelectorAll("[id*='divSSR_SBJCT_LVL1_row']");

    if (classSec.length === 0) {
        showErrorNotification(
            "No class data found. Please make sure you're on the student timetable page and the page has loaded completely."
        );
        return;
    }

    for (const element of classSec) {
        // Get all the rows within this class section
        let classRows = element.querySelectorAll("tr[id*='STDNT_ENRL_SSVW$'][id*='_row_']");

        for (const row of classRows) {
            // For each row, get the class details (this will be consistent per row)
            let classDetails = row.querySelectorAll("a[id^='DERIVED_SSR_FL_SSR_SBJ_CAT_NBR$355']");
            let classDates = row.querySelectorAll("[id^='DERIVED_SSR_FL_SSR_ST_END_DT']");
            let classDays = row.querySelectorAll("[id^='DERIVED_SSR_FL_SSR_DAYS']");
            let classTimes = row.querySelectorAll("[id^='DERIVED_SSR_FL_SSR_DAYSTIMES']");
            let classLoc = row.querySelectorAll("[id^='DERIVED_SSR_FL_SSR_DRV_ROOM']");

            // Now loop through the time slots for this specific class type
            for (let i = 0; i < classDates.length; i++) {
                let classNameText = element.querySelector("[id^='DERIVED_SSR_FL_SSR_SCRTAB_DTLS']").textContent;
                let classDetailsText = classDetails[0].textContent.trim(); // Use the first (and likely only) class detail for this row
                let classDatesText = classDates[i].textContent.trim();
                let classDaysText = classDays[i].textContent.trim();
                let classTimesText = classTimes[i].textContent.trim();
                let classLocText = classLoc[i].textContent.trim();

                await groupData(
                    classNameText,
                    classDetailsText,
                    classDatesText,
                    classDaysText,
                    classTimesText,
                    classLocText
                );
            }
        }
    }
}

function lectFlow(iframeElement) {
    console.log("Running lecturer process");
    // Access the iframe's content document
    const iframeDocument = iframeElement.contentWindow.document.body;

    // Select elements in iframe
    const dayHeader = iframeDocument.querySelectorAll("th.PSLEVEL3GRIDODDROW");
    const rows = iframeDocument.querySelectorAll("table.PSLEVEL3GRIDODDROW  tr");
    const year = iframeDocument.querySelector(
        "div#win0divDERIVED_CLASS_S_DESCR100_2 td.PSGROUPBOXLABEL.PSLEFTCORNER"
    ).textContent;
    const subjTitleVal = iframeDocument.querySelector(
        'input[name="DERIVED_CLASS_S_SSR_DISP_TITLE$chk"][id="DERIVED_CLASS_S_SSR_DISP_TITLE$chk"]'
    ).value;
    const classInstructorVal = iframeDocument.querySelector(
        'input[name="DERIVED_CLASS_S_SSR_DISP_ROLE$chk"][id="DERIVED_CLASS_S_SSR_DISP_ROLE$chk"]'
    ).value;

    if (!dayHeader || dayHeader.length === 0) {
        console.error("No day elements found");
        showErrorNotification("No day elements found. Please make sure you're on the lecturer timetable page.");
        return;
    }

    if (subjTitleVal === "N" && (config.selectedEventFormat === "2" || config.selectedEventFormat === "3")) {
        console.error('Please check "Show Class Title" box below the calendar under Display Options!');
        showErrorNotification('Please check "Show Class Title" box below the calendar under Display Options!');
        return;
    }

    // Get the dates
    const days = [];
    const dates = [];
    dayHeader.forEach((element, index) => {
        if (index === 0) {
            dates.push("null");
        } else {
            const dayText = element.textContent.split("\n");
            const day = dayText[0].trim();
            let date = dayText[1];
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
            if (susColIndex > 0) {
                // Other than the first one
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
                    const classContent = spanElement.innerHTML.split("<br>");
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

                    if (config.selectedEventFormat === "2") {
                        summary = `${result.subjTitle} - ${result.classSect} (${result.classType})`;
                    } else if (config.selectedEventFormat === "3") {
                        summary = `${result.subjTitle} - ${result.subjCode} - ${result.classSect} (${result.classType})`;
                    }

                    console.log(
                        `Summary: ${summary}, Location: ${result.classLocation}, Day: ${day}, startDateTime: ${startDate}T${result.startTime}, endDateTime: ${endDate}T${result.endTime}`
                    );

                    // If class is 2 hours, mark slot below as "True"
                    let totalSpan = rowSpan(result.startTime, result.endTime);

                    // If the class's total span is more than an hour
                    if (totalSpan > 1) {
                        handleMultiHourClass(totalSpan, rowIndex, skip, colIndex);
                    }

                    const event = craftCalEvent(
                        summary,
                        result.classLocation,
                        startDate,
                        result.startTime,
                        endDate,
                        result.endTime
                    );
                    // Append to array after defining events
                    // console.log('Event: ', event)

                    // classEvents.push(event);
                    // console.log(classEvents);

                    // Log the selected value
                    // console.log(`RRULE:FREQ=WEEKLY;COUNT=${selectedSemesterValue}`);
                    // console.log('Selected semester value:', selectedSemesterValue);

                    if (config.selectedOptionValue == 1) {
                        // console.log("Extension end");
                        // createCalendarEvent(event); // This function doesn't exist and syncGoogleCalendar handles all events
                        // googleCalendarSuccess = true; // This should be set after syncGoogleCalendar completes
                    }
                    classEvents.push(event);
                } catch (error) {
                    console.error("Error processing class data:", error);
                    showErrorNotification("Failed to process class data: " + error.message);
                    return;
                }
            }
        });
    });
}

/* End of flow types */

// =============== Helper functions ===============
async function groupData(className, classDetails, classDates, classDay, classTimes, classLoc) {
    let { classCode, classNameOnly } = procClassName(className);
    let { classType, classSect } = procClassDetails(classDetails);
    let { startDate } = procClassDates(classDates);
    let { startTime, endTime } = procClassTimes(classTimes);
    let { classDayText } = procClassDay(classDay);

    const { selectedDefects: selectedDefect } = await getStorageData(["selectedDefects"]);
    let parsedStartDate = startDate.split("-");
    if (selectedDefect == "yes") {
        let updatedDate;
        switch (classDayText) {
            case "Monday":
                updatedDate = parsedStartDate[2];
                break;
            case "Tuesday":
                updatedDate = (parseInt(parsedStartDate[2]) + 1).toString();
                break;
            case "Wednesday":
                updatedDate = (parseInt(parsedStartDate[2]) + 2).toString();
                break;
            case "Thursday":
                updatedDate = (parseInt(parsedStartDate[2]) + 3).toString();
                break;
            case "Friday":
                updatedDate = (parseInt(parsedStartDate[2]) + 4).toString();
                break;
            default:
                updatedDate = parsedStartDate[2];
        }

        startDate = `${parsedStartDate[0]}-${parsedStartDate[1]}-${updatedDate}`;
    }

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

    const event = craftCalEvent(summary, classLoc, startDate, startTime, startDate, endTime);

    classEvents.push(event);
}

function craftCalEvent(summary, classLocation, startDate, formattedStartTime, endDate, formattedEndTime) {
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

async function syncGoogleCalendar() {
    if (classEvents.length === 0) {
        showErrorNotification("No events to sync. Please make sure timetable data was loaded correctly.");
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    // create calendar events
    for (const newEvent of classEvents) {
        const response = await fetch(__CFW_ADD_NEW_EVENT_ENDPOINT__, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                event: newEvent,
                selectedCalendar: config.selectedCalendar,
                sessionToken: config.sessionToken,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Event added successfully:", data);
            successCount++;
        } else {
            const errorData = await response.json();
            console.error("Error adding event:", errorData);
            errorCount++;
        }
    }

    if (errorCount > 0) {
        showErrorNotification(
            `${errorCount} out of ${classEvents.length} events failed to sync. Please check your internet connection and try again.`
        );
    } else if (successCount > 0) {
        googleCalendarSuccess = true;
    }
}

function downloadICS() {
    if (classEvents.length === 0) {
        showErrorNotification("No events to download. Please make sure timetable data was loaded correctly.");
        return;
    }

    const icalContent = icalBlob(classEvents, config.selectedReminderTime);

    // Convert data to Blob
    const blob = new Blob([icalContent], {
        type: "text/calendar;charset=utf-8",
    });
    const blobUrl = URL.createObjectURL(blob);

    // Create download link and trigger download
    const downloadButton = document.createElement("a");
    downloadButton.href = blobUrl;
    downloadButton.download = "schedulr.ics";
    downloadButton.innerText = "Download .ics";
    downloadButton.classList.add("download-btn");

    console.log("Downloading ics file...");
    downloadButton.click();

    // Set success flag since download was initiated
    icsDownloadSuccess = true;
}

// =============== End of helper functions ===============
