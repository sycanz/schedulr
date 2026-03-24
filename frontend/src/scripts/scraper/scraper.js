import { studentFlow } from "../utils/studProc.js";
import { icalBlob } from "./createIcs.js";
import { showErrorNotification, showSuccessNotification } from "../utils/msgNotifier.js";
import { lectFlow } from "../utils/lectProc.js";

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
    try {
        if (lectIndicator && iframeElement) {
            await lectFlow(iframeElement, config, classEvents);
        } else {
            await studentFlow(config, classEvents);
        }
    } catch (error) {
        console.error("Scraping failed:", error);
        showErrorNotification(error.message || "An error occurred during scraping.");
        return;
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
    } else if (!googleCalendarSuccess && !icsDownloadSuccess) {
        showErrorNotification("No data was processed. Please make sure you're on the correct page and try again.");
    }

    // Notify popup that processing is complete
    try {
        chrome.runtime.sendMessage({ action: "importComplete" });
    } catch (err) {
        console.log("Popup likely closed, skipping message");
    }
}

// =============== Helper functions ===============

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
