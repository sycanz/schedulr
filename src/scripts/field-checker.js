import { handleFlow } from '../popup/popup.js';

// Checks all neccessary field vary by selected option value
function getFormsValue(selectedOptionValue) {
    try{
        // Get the value of the selected radio button
        const selectedSemesterValue = document.querySelector('input[name="semester"]:checked')?.value;
        const selectedReminderTime = document.querySelector('input[name="reminder"]:checked')?.value;
        const selectedColorValue = document.querySelector('input[name="color"]:checked')?.value;
        const selectedCalendar = document.querySelector('input[name="calendar"]:checked')?.value;
        const selectedEventFormat = document.querySelector('input[name="format"]:checked')?.value;

        if (selectedOptionValue == 1 || selectedOptionValue == 2) {
            // Check if all values are selected
            if (!(selectedSemesterValue && selectedReminderTime && selectedColorValue && selectedCalendar && selectedEventFormat)) {
                window.alert('Please select all options.');
                return;
            }

            handleFlow(selectedColorValue, selectedCalendar, selectedReminderTime, selectedSemesterValue, selectedEventFormat, selectedOptionValue);

        } else if (selectedOptionValue == 3) {
            // Check if all values are selected
            if (!(selectedSemesterValue && selectedReminderTime && selectedEventFormat)) {
                window.alert('Please select all options.');
                return;
            }

            handleFlow(null, null, selectedReminderTime, selectedSemesterValue, selectedEventFormat, selectedOptionValue);
        }
    }
    catch(err) {
        console.error('An error occured: ', err);
        window.alert(`An error occured: ${err.message}`);
    }
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "going to field checker") {
        console.log("Message received in field-checker.js");
        getFormsValue(message.optVal);
    }
});
