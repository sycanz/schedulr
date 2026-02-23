// service-worker.js is a file that runs background scripts which does not
// require any user interaction to execute.

import {
    checkSessionTokenValidity,
    onLaunchWebAuthFlow,
} from "../../dist/authFlow.bundle.js";
import { getCalIds } from "../../dist/calListQuery.bundle.js";
import { getCurrTab } from "../scripts/utils/progFlow.js";
import { showErrorNotification } from "../scripts/utils/msgNotifier.js";

// navigate user to 'schedulr' website's usage part when
// the extension is first installed
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason == "install") {
        chrome.tabs.create({
            url: "https://www.mmuschedulr.com/#usage",
        });
    }
});

// listener to know when to query for user's calendar list
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === "authoriseUser") {
        console.log("Checking session token validity");
        const validSessionToken = await checkSessionTokenValidity();
        let sessionToken = validSessionToken;
        let isNewSession = false;

        if (!validSessionToken) {
            console.log("Authorizing user for OAuth consent");
            sessionToken = await onLaunchWebAuthFlow();
            isNewSession = true;
        }

        if (!sessionToken) {
            showErrorNotification(
                "Authorization failed. Please try again.",
                "Authentication Error"
            );
            return true;
        }

        console.log("Consent given, trying to get calendars...");
        let calJson = await getCalIds(sessionToken);

        if (!calJson || Object.keys(calJson).length === 0) {
            showErrorNotification(
                "No calendars found. Please make sure you have at least one calendar in your Google account.",
                "Calendar Error"
            );
            return true;
        }

        console.log("Got calendars, updating popup option elements");

        chrome.runtime.sendMessage(
            {
                action: "updateCalData",
                data: calJson,
            },
            () => {
                // check for error which happens if the popup is closed
                if (chrome.runtime.lastError) {
                    console.log(
                        "Popup is closed, calendar data saved to storage."
                    );

                    if (isNewSession) {
                        console.log(
                            "Showing authentication complete notification."
                        );
                        chrome.notifications.create({
                            type: "basic",
                            iconUrl: "/images/magnify128.png",
                            title: "Authentication Complete",
                            message:
                                "Please re-open the extension to import to calendar",
                            priority: 2,
                        });
                    }
                } else {
                    console.log("Popup is open, data updated directly.");
                }
            }
        );

        return true;
    }
});

// listener for when all options are selected and can start scraper
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === "startScraper") {
        console.log("Messaged received: startScraper");
        const currTab = await getCurrTab();

        if (!currTab) {
            showErrorNotification(
                "No active tab found. Please make sure you're on the correct page.",
                "Tab Error"
            );
            return true;
        }

        const items = await chrome.storage.local.get([
            "session_token",
            "selectedColorValues",
            "selectedCalendars",
            "selectedReminderTimes",
            "selectedSemesterValues",
            "selectedEventFormats",
            "selectedDefects",
            "selectedOptionValues",
        ]);

        const {
            session_token: sessionToken,
            selectedColorValues: selectedColorValue,
            selectedCalendars: selectedCalendar,
            selectedReminderTimes: selectedReminderTime,
            selectedSemesterValues: selectedSemesterValue,
            selectedEventFormats: selectedEventFormat,
            selectedDefects: selectedDefect,
            selectedOptionValues: selectedOptionValue,
        } = items;

        console.log("Executing script...");
        // Execute dataProc in the current tab
        chrome.scripting.executeScript(
            {
                target: { tabId: currTab.id },
                files: ["frontend/dist/scraper.bundle.js"],
            },
            () => {
                if (chrome.runtime.lastError) {
                    showErrorNotification(
                        chrome.runtime.lastError.message,
                        "Script Execution Error"
                    );
                    return;
                }

                console.log("Scraper's bundle updated");
                chrome.scripting.executeScript(
                    {
                        target: { tabId: currTab.id },
                        args: [
                            sessionToken,
                            selectedSemesterValue,
                            selectedReminderTime,
                            selectedColorValue,
                            selectedCalendar,
                            selectedEventFormat,
                            selectedDefect,
                            selectedOptionValue,
                        ],
                        func: (...args) => scraperBundle.dataProc(...args),
                    },
                    () => {
                        if (chrome.runtime.lastError) {
                            showErrorNotification(
                                chrome.runtime.lastError.message,
                                "Script Execution Error"
                            );
                        }
                    }
                );
            }
        );

        return true;
    }
});
