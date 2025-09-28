import { showErrorNotification } from './errorNotifier.js';

// selects a specific radio button within a group
export function selectRadioButton(name, value) {
    if (!value) {
        console.log(`No value provided for radio group "${name}".`);
        return;
    }

    const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (radio) {
        radio.checked = true;
    } else {
        console.warn(`No radio button found for "${name}" with value: ${value}`);
        showErrorNotification(`Previous setting "${name}" with value "${value}" not found. Please select manually.`, "Setting Not Found", true);
        return;
    }
}