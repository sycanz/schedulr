// service-worker.js is a file that runs background scripts which does not
// require any user interaction to execute.

import { getToken } from '../scripts/auth/auth-flow.js';
import { getCalIds } from '../scripts/cal-list-query.js';

// Navigate user to 'schedulr' website's usage part when 
// the extension is first installed
chrome.runtime.onInstalled.addListener(() => {
    if (reason === "install") {
        chrome.tabs.create({
            url: "https://www.mmuschedulr.com/#usage",
        });
    }
});

// Listener to know when to query for user's calendar list
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === "queryCalList") {
        console.log("Received message in service worker");

        await getToken()
            .then((token) => {
                console.log("received token, calling calID")
                return getCalIds(token);
            })
            .then((calJson) => {
                console.log("Sending message to edit-cal-choice.js");
                chrome.runtime.sendMessage({
                    action: "calData",
                    data: calJson
                });
            })
            .catch((error) => {
                console.log("Error querying calendars:", error);
            });

        return true;
    }
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "back to service") {
        console.log("Message received in service worker again");
        console.log("Sending message to field-checker.js");
        chrome.runtime.sendMessage({
            action: "going to field checker",
            optVal: message.optVal
        });
    }
});