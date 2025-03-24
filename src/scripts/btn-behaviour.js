let selectedOptionValue;

// Function to handle event
function finalButtonClickHandler(event) {
    event.preventDefault();

    console.log("Sending message back to service worker");
    chrome.runtime.sendMessage({
        action: "back to service",
        optVal: selectedOptionValue

    });

    return true;
}

async function googleAuthentication() {
    console.log("Running google auth")
    if (selectedOptionValue == 1) {
        await chrome.runtime.sendMessage({
            action: "queryCalList"
        });
    }
}

// Listener to get selected option value
document.getElementById('optionForm').addEventListener('submit', function(event) {
    console.log("Submit button pressed");
    event.preventDefault();

    selectedOptionValue = document.querySelector('input[name="option"]:checked')?.value;
    console.log(`Received option value: ${selectedOptionValue}`);

    if (!(selectedOptionValue)) {
        window.alert('Please select an option.');
        return;
    }

    // Hide the loader after calendar
    const firstPage = document.getElementsByClassName('firstPage')[0].style.display = 'none';

    // Query all possible forms
    let generalForms = document.getElementsByClassName('generalForms')[0];
    let backButton = document.getElementById('backButton');
    let calForms = document.getElementsByClassName('calForms')[0];
    let finalButton = document.getElementsByClassName('finalButton')[0];

    generalForms.style.display = 'flex';
    backButton.style.display = 'flex';

    // Display appropriate forms
    if (selectedOptionValue == 1) {
        console.log("Option 1 selected");
        googleAuthentication();
        calForms.style.display = 'flex';
        finalButton.style.display = 'flex';
    } else if (selectedOptionValue == 2) {
        finalButton.style.display = 'flex';
    } else if (selectedOptionValue == 3) {
        finalButton.style.display = 'flex';
    }

    // Remove previously attached listener
    finalButton.removeEventListener('click', finalButtonClickHandler);

    // Attach new listener
    finalButton.addEventListener('click', finalButtonClickHandler);
});

// Event listener for the back button
document.getElementById('backButton').addEventListener('click', function() {
    console.log("Back button pressed");
    // Query all forms
    let optionForm = document.getElementsByClassName('optionForm')[0];
    let generalForms = document.getElementsByClassName('generalForms')[0];
    let calForms = document.getElementsByClassName('calForms')[0];
    let finalButton = document.getElementsByClassName('finalButton')[0];

    // Hide the second page forms
    generalForms.style.display = 'none';
    calForms.style.display = 'none';
    finalButton.style.display = 'none';

    // Clear the previous form options
    // optionForm.innerHTML = '';

    // Show the first page again
    document.getElementsByClassName('firstPage')[0].style.display = 'flex';

    // Hide the back button itself since we're back on the first page
    document.getElementById('backButton').style.display = 'none';
});
