// service-worker.js is a file that runs background scripts which does not
// require any user interaction to execute.

import { getToken } from '../scripts/auth/auth-flow.js';
import { getCalIds } from '../scripts/calendar/cal-list-query.js';

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
        const token = await getToken()

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
chrome.runtime.onMessage.addListener((message) =>{
    if (message.action === "startScraper") {
        (async function () {
            let token = null;
            // Only try to get token if the selected options require Google account access
            if (message.selectedOptionValue == 1) {
                // Get Oauth token
                token = await getToken();
            }

            // Get the current active tab
            const currTab = await getCurrTab();

            token, currTab = getNecessarryKeys();

            await chrome.storage.local.set({
                accessToken: token,
                selectedColorValue: message.colorValue,
                selectedCalendar: message.calendar,
                selectedReminderTime: message.reminderTime,
                selectedSemesterValue: message.semesterValue,
                selectedEventFormat: message.eventFormat,
                selectedOptionValue: message.optionValue
            });

            // Execute dataProc in the current tab
            chrome.scripting.executeScript({
                target: { tabId: currTab.id },
                file: ["src/scripts/scraper/scraper.js"]
            });
        })();

        return true;
    }
});