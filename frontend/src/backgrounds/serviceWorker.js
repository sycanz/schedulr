// service-worker.js is a file that runs background scripts which does not
// require any user interaction to execute.

import { onlaunchWebAuthFlow } from '../scripts/auth/authFlow.js';
import { getCalIds } from '../scripts/calendar/calListQuery.js';
import { getCurrTab } from '../scripts/utils/progFlow.js';

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
        const token = await onlaunchWebAuthFlow()

        if (token) {
            console.log("Consent given, trying to get calendars...")
            let calJson = await getCalIds(token);

            console.log("Got calendars, updating popup option elements");
            chrome.runtime.sendMessage({
                action: "updateCalData",
                data: calJson
            });
        } else {
            console.log("Authorization failed: No token received.");
        }

        return true;
    }
});

// listener for when all options are selected and can start scraper
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === "startScraper") {
        console.log("Messaged received: startScraper");

        const currTab = await getCurrTab();

        let accessToken;
        let selectedColorValue;
        let selectedCalendar;
        let selectedReminderTime;
        let selectedSemesterValue
        let selectedEventFormat;
        let selectedOptionValue;

        await chrome.storage.local.get([
            'accessTokens', 'selectedColorValues', 'selectedCalendars', 'selectedReminderTimes',
            'selectedSemesterValues', 'selectedEventFormats', 'selectedOptionValues',
        ], (items) => {
            accessToken = items.accessTokens,
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
            console.log("Scraper's bundle updated");
            chrome.scripting.executeScript({
                target: { tabId: currTab.id },
                args: [accessToken, selectedSemesterValue, selectedReminderTime,
                    selectedColorValue, selectedCalendar, selectedEventFormat,
                    selectedOptionValue],
                func: (...args) => dataProcBundle.dataProc(...args),
            })
        });

        return true;
    }
});