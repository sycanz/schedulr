function setAttributes(form, calData) {
    for (let cals in calData) {
        // Create input and label tag for every index
        const input = document.createElement("input");
        const label = document.createElement("label");
        const br = document.createElement("br");

        // Set attribute for input tag
        input.setAttribute("type", "radio");
        input.setAttribute("id", `${cals}`);
        input.setAttribute("name", "calendar");
        input.setAttribute("value", `${calData[cals]}`);

        // Set attribute for label tag
        label.innerText = `${cals}`;
        label.setAttribute("for", `${cals}`);

        // Append input and label tag, then a line break after
        form.appendChild(input);
        form.appendChild(label);
        form.appendChild(br);
    }

    // Hide the loader after calendar
    document.getElementById('loader').style.display = 'none';
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "calData") {
        // Get calData and form's element so can edit them later on
        console.log("edit-cal-choice.js got the calData!")
        const calData = message.data;
        const form = document.getElementById("calendarForm");

        setAttributes(form, calData);

    } else if (message.action === "showAlert") {
        window.alert(message.error);
    }
});
