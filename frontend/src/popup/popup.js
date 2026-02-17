import { selectRadioButton } from "../scripts/utils/autoSelect.js";
import { isNotANewcomer } from "../scripts/utils/firstTimer.js";
import { showErrorNotification } from "../scripts/utils/errorNotifier.js";
import { setStorageData } from "../scripts/auth/authFlow.js";

// program starts here
console.log("Starting schedulr");

// common variables
let selectedOptionValue;
let isCalendarFetched = false;

//////////// start of listeners //////////////

// 1st page: listener for submit button
document.getElementById("optionForm").addEventListener("submit", (event) => {
    console.log("Submit button pressed");
    event.preventDefault();
    updatePopup();
});

// starting from 2nd page: listener for "back" button
document.getElementById("backButton").addEventListener("click", function () {
    console.log("Back button pressed");
    showPreviousPage();
});

// starting from 2nd page: listener for "previous settings" button
document
    .getElementById("fillPreviousSettings")
    .addEventListener("click", function () {
        console.log("Previous Settings button pressed");
        checkForPreference();
    });

// 2nd page: listener for when user's calendar is queried
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === "updateCalData") {
        const calData = message.data;
        setAttributes(calData);
    } else if (message.action === "showAlert") {
        window.alert(message.error);
    }
});

// 2nd page: listener for when final submit button is clicked
function finalButtonClickHandler(event) {
    event.preventDefault();
    console.log("Submit button clicked, getting selected values...");
    getFormsValue(selectedOptionValue);
}

//////////// end of listeners //////////////

//////////// start of functions //////////////

function showPreviousPage() {
    // query all forms
    let previousSettingButton = document.getElementsByClassName(
        "previousSettingsButton"
    )[0];
    let generalForms = document.getElementsByClassName("generalForms")[0];
    let calForms = document.getElementsByClassName("calForms")[0];
    let finalButton = document.getElementsByClassName("finalButton")[0];

    // hide the second page forms
    previousSettingButton.style.display = "none";
    generalForms.style.display = "none";
    calForms.style.display = "none";
    finalButton.style.display = "none";

    // Clear the previous form options
    // optionForm.innerHTML = '';

    // show the first page again
    document.getElementsByClassName("firstPage")[0].style.display = "flex";

    // hide the back button itself since we're back on the first page
    document.getElementById("backButton").style.display = "none";
}

async function updatePopup() {
    selectedOptionValue = document.querySelector(
        'input[name="option"]:checked'
    )?.value;
    // console.log(`Received option value: ${selectedOptionValue}`);

    if (!selectedOptionValue) {
        showErrorNotification(
            "Please select an option.",
            "Selection Required",
            true
        );
        return;
    }

    await setStorageData({
        selectedOptionValues: selectedOptionValue,
    });

    // hide the "1st page" after user chooses an option
    document.getElementsByClassName("firstPage")[0].style.display = "none";

    // query all possible forms
    let previousSettingButton = document.getElementsByClassName(
        "previousSettingsButton"
    )[0];
    let generalForms = document.getElementsByClassName("generalForms")[0];
    let backButton = document.getElementById("backButton");
    let calForms = document.getElementsByClassName("calForms")[0];
    let finalButton = document.getElementsByClassName("finalButton")[0];

    generalForms.style.display = "flex";
    backButton.style.display = "flex";

    // check if they're a first timer, if so then show previous settings button
    const returningUser = await isNotANewcomer();

    // display appropriate forms according to selected option
    switch (selectedOptionValue) {
        case "1":
            if (!isCalendarFetched) {
                await chrome.runtime.sendMessage({
                    action: "authoriseUser",
                });
            }

            if (returningUser) {
                previousSettingButton.style.display = "flex";
            }
            calForms.style.display = "flex";
            finalButton.style.display = "flex";
            break;
        case "2":
            if (returningUser) {
                previousSettingButton.style.display = "flex";
            }
            previousSettingButton.style.display = "flex";
            finalButton.style.display = "flex";
            break;
    }

    // remove previously attached listener add a new one
    finalButton.removeEventListener("click", finalButtonClickHandler);
    finalButton.addEventListener("click", finalButtonClickHandler);
}

// update option element after queried user's calendars
function setAttributes(calData) {
    const calendarList = document.getElementById("calendarList");

    // clear previous entries to prevent duplication
    calendarList.innerHTML = "";

    for (let cals in calData) {
        // create input and label tag for every index
        const input = document.createElement("input");
        const label = document.createElement("label");
        const br = document.createElement("br");

        // set attribute for input tag
        input.setAttribute("type", "radio");
        input.setAttribute("id", `${cals}`);
        input.setAttribute("name", "calendar");
        input.setAttribute("value", `${calData[cals]}`);

        // set attribute for label tag
        label.innerText = `${cals}`;
        label.setAttribute("for", `${cals}`);

        // append input and label tag, then a line break after
        calendarList.appendChild(input);
        calendarList.appendChild(label);
        calendarList.appendChild(br);
    }

    // hide the loader after option elements updated
    document.getElementById("loader").style.display = "none";
    isCalendarFetched = true;
    console.log("Calendar options updated");
}

// if user had previously used schedulr,
// it'll automatically select their previous option
function checkForPreference() {
    chrome.storage.local.get(
        [
            "selectedCalendars",
            "selectedColorValues",
            "selectedEventFormats",
            "selectedReminderTimes",
            "selectedSemesterValues",
            "selectedOptionValues",
            "selectedDefects",
        ],
        (items) => {
            const {
                selectedCalendars,
                selectedColorValues,
                selectedEventFormats,
                selectedReminderTimes,
                selectedSemesterValues,
                selectedOptionValues,
                selectedDefects,
            } = items;

            if (!selectedSemesterValues) {
                return;
            }

            switch (selectedOptionValues) {
                case "1":
                    selectRadioButton("semester", selectedSemesterValues);
                    selectRadioButton("format", selectedEventFormats);
                    selectRadioButton("reminder", selectedReminderTimes);
                    selectRadioButton("calendar", selectedCalendars);
                    selectRadioButton("color", selectedColorValues);
                    selectRadioButton("defected", selectedDefects);
                    break;
                case "2":
                    selectRadioButton("semester", selectedSemesterValues);
                    selectRadioButton("format", selectedEventFormats);
                    selectRadioButton("reminder", selectedReminderTimes);
                    selectRadioButton("defected", selectedDefects);
                    break;
            }
        }
    );
}

// checks all neccessary field vary by selected option value
async function getFormsValue(selectedOptionValue) {
    try {
        // get the value of the selected radio button
        const selectedSemesterValue = document.querySelector(
            'input[name="semester"]:checked'
        )?.value;
        const selectedEventFormat = document.querySelector(
            'input[name="format"]:checked'
        )?.value;
        const selectedReminderTime = document.querySelector(
            'input[name="reminder"]:checked'
        )?.value;
        const selectedCalendar = document.querySelector(
            'input[name="calendar"]:checked'
        )?.value;
        const selectedDefect = document.querySelector(
            'input[name="defected"]:checked'
        )?.value;
        const selectedColorValue = document.querySelector(
            'input[name="color"]:checked'
        )?.value;

        if (selectedOptionValue == 1) {
            // check if all values are selected
            if (
                !(
                    selectedSemesterValue &&
                    selectedEventFormat &&
                    selectedReminderTime &&
                    selectedCalendar &&
                    selectedDefect &&
                    selectedColorValue
                )
            ) {
                showErrorNotification(
                    "Please select all options.",
                    "Selection Required",
                    true
                );
                return;
            }

            await setStorageData({
                selectedSemesterValues: selectedSemesterValue,
                selectedEventFormats: selectedEventFormat,
                selectedReminderTimes: selectedReminderTime,
                selectedCalendars: selectedCalendar,
                selectedDefects: selectedDefect,
                selectedColorValues: selectedColorValue,
                selectedOptionValues: selectedOptionValue,
            });
        } else if (selectedOptionValue == 2) {
            // check if all values are selected
            if (
                !(
                    selectedSemesterValue &&
                    selectedEventFormat &&
                    selectedReminderTime &&
                    selectedDefect
                )
            ) {
                showErrorNotification(
                    "Please select all options.",
                    "Selection Required",
                    true
                );
                return;
            }

            await setStorageData({
                selectedSemesterValues: selectedSemesterValue,
                selectedEventFormats: selectedEventFormat,
                selectedReminderTimes: selectedReminderTime,
                selectedCalendars: null,
                selectedDefects: selectedDefect,
                selectedColorValues: null,
                selectedOptionValues: selectedOptionValue,
            });
        }

        chrome.runtime.sendMessage({
            action: "startScraper",
        });
    } catch (err) {
        console.error("An error occured: ", err);
        showErrorNotification(
            err.message || "An unexpected error occurred",
            "Form Submission Error",
            true
        );
    }
}

//////////// end of functions //////////////
