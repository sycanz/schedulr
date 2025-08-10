// service-worker.js is a file that runs background scripts which does not
// require any user interaction to execute.

import { onLaunchWebAuthFlow } from '../../dist/authFlow.bundle.js';
import { getCalIds } from '../../dist/calListQuery.bundle.js';
import { getCurrTab } from '../scripts/utils/progFlow.js';
import { showErrorNotification } from '../scripts/utils/errorNotifier.js';

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
        console.log("Authorizing user for OAuth consent");
        const sessionToken = await onLaunchWebAuthFlow()

        if (!sessionToken) {
            showErrorNotification("Authorization failed. Please try again.", "Authentication Error");
            return true;
        }

        console.log("Consent given, trying to get calendars...")
        let calJson = await getCalIds(sessionToken);

        if (!calJson || Object.keys(calJson).length === 0) {
            showErrorNotification("No calendars found. Please make sure you have at least one calendar in your Google account.", "Calendar Error");
            return true;
        }

        console.log("Got calendars, updating popup option elements");
        chrome.runtime.sendMessage({
            action: "updateCalData",
            data: calJson
        });

        return true;
    }
});

// listener for when all options are selected and can start scraper
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === "startScraper") {
        console.log("Messaged received: startScraper");
        const currTab = await getCurrTab();

        if (!currTab) {
            showErrorNotification("No active tab found. Please make sure you're on the correct page.", "Tab Error");
            return true;
        }

        let sessionToken, selectedColorValue, selectedCalendar, selectedReminderTime,
            selectedSemesterValue, selectedEventFormat, selectedOptionValue;

        await chrome.storage.local.get([
            'session_token', 'selectedColorValues', 'selectedCalendars', 'selectedReminderTimes',
            'selectedSemesterValues', 'selectedEventFormats', 'selectedOptionValues',
        ], (items) => {
            sessionToken = items.session_token,
            selectedColorValue = items.selectedColorValues,
            selectedCalendar = items.selectedCalendars,
            selectedReminderTime = items.selectedReminderTimes,
            selectedSemesterValue = items.selectedSemesterValues,
            selectedEventFormat = items.selectedEventFormats,
            selectedOptionValue = items.selectedOptionValues
        });

        console.log("Executing script...");
        // Execute dataProc in the current tab
        chrome.scripting.executeScript({
            target: { tabId: currTab.id },
            files: ["frontend/dist/scraper.bundle.js"],
        }, () => {
            if (chrome.runtime.lastError) {
                showErrorNotification(chrome.runtime.lastError.message, "Script Execution Error");
                return;
            }
            
            console.log("Scraper's bundle updated");
            chrome.scripting.executeScript({
                target: { tabId: currTab.id },
                args: [sessionToken, selectedSemesterValue, selectedReminderTime,
                    selectedColorValue, selectedCalendar, selectedEventFormat,
                    selectedOptionValue],
                func: (...args) => scraperBundle.dataProc(...args),
            }, () => {
                if (chrome.runtime.lastError) {
                    showErrorNotification(chrome.runtime.lastError.message, "Script Execution Error");
                }
            });
        });

        return true;
    }
});
