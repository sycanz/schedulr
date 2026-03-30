import { craftCalEvent } from "./eventUtils.js";

// Remove unnecessary prefix
export function truncLocation(location) {
    const prefix = "Common Lecture Complex &amp; ";
    if (location.startsWith(prefix)) {
        return location.slice(prefix.length).trim();
    }
    return location;
}

// Remove unnecessary spaces for class. Currently looks like 'LM     PU3192 - FCI4'
export function truncClassSpace(className) {
    const [beforeHyphen, afterHyphen] = className.split("-");
    const trimBeforeHyphen = beforeHyphen.replace(/\s+/g, "");
    const fullClassName = `${trimBeforeHyphen} -${afterHyphen}`;
    return fullClassName;
}

// Reformat time. Current looks like '2:00PM - 4:00PM' and '10:00AM - 12:00PM'
// Target format '2024-08-12T09:00:00+08:00'
export function formatTime(classTime) {
    function convertTimeFormat(timeStr) {
        const [time, period] = timeStr.split(/(AM|PM)/);

        let [hour, minute] = time.split(":");

        if (period === "AM" && parseInt(hour) < 10) {
            hour = `0${hour}`;
        } else if (period === "AM" && parseInt(hour) > 9) {
            hour = `${hour}`;
        } else if (period === "PM" && parseInt(hour) < 12) {
            hour = parseInt(hour) + 12;
        }

        return `${hour}:${minute}:00+08:00`;
    }

    const [startTime, endTime] = classTime.split("-").map((t) => t.trim());

    return {
        formattedStartTime: convertTimeFormat(startTime),
        formattedEndTime: convertTimeFormat(endTime),
    };
}

// Reformat date. Currently looks like '14 Aug'
// Target format '2024-08-14'
export function formatDate(classDate, yearElement) {
    // Get the correct date and month
    const [date, month] = classDate.split(" ");
    // console.log(`${date},${month}`)
    const months = {
        Jan: "01",
        Feb: "02",
        Mar: "03",
        Apr: "04",
        May: "05",
        Jun: "06",
        Jul: "07",
        Aug: "08",
        Sep: "09",
        Oct: "10",
        Nov: "11",
        Dec: "12",
    };

    let monthValue = months[month];
    const endDateYear = yearElement.substr(-4, 4);
    return `${endDateYear}-${monthValue}-${date}`;
}

export function createArray(rows, cols, value = 0) {
    let arr = new Array(rows);
    for (let i = 0; i < rows; i++) {
        arr[i] = new Array(cols).fill(value);
    }

    // console.log(arr);
    return arr;
}

export function rowSpan(fStartTime, fEndTime) {
    // Parse formatted time
    const startTime = fStartTime.split(":");
    const endTime = fEndTime.split(":");

    // Get hour/min
    const startHour = parseInt(startTime[0]);
    const endHour = parseInt(endTime[0]);
    const endMin = parseInt(endTime[1]);

    let hourSpan = endHour - startHour;
    let totalSpan;
    if (endMin > 0) {
        let minSpan = 1;
        totalSpan = hourSpan + minSpan;
    } else {
        totalSpan = hourSpan;
    }
    // console.log(totalSpan);

    return totalSpan;
}

export function handleMultiHourClass(totalSpan, rowIndex, skip, colIndex) {
    // For every total - 1 span
    for (let i = 1; i < totalSpan; i++) {
        // If next row is a valid row
        if (rowIndex + i < skip.length) {
            // Edit value to 1 in row i
            skip[rowIndex + i][colIndex] = 1;

            updatePrevCol(colIndex, skip, rowIndex + i);
        }
    }
}

export function updatePrevCol(colIndex, skip, nextRow) {
    // Checks the col before curr one
    let itrColIndex = colIndex - 1;
    while (itrColIndex > 0) {
        if (skip[nextRow][itrColIndex] > 0) {
            skip[nextRow][itrColIndex] += 1;
        } else {
            break;
        }
        itrColIndex -= 1;
    }
}

export function procData(classContent, subjTitleVal, classInstructorVal) {
    const subjCodeAndClassSect = truncClassSpace(classContent[0]);
    const subjCode = subjCodeAndClassSect.split("-")[0].trim();
    const classSect = subjCodeAndClassSect.split("-")[1].trim();

    let baseIndex = 1;
    let subjTitle = null;
    let classInstructor = null;

    if (subjTitleVal === "Y") {
        subjTitle = classContent[baseIndex];
        baseIndex += 1;
    }

    // Abbreviate the class types
    let classType = classContent[baseIndex];
    if (classType === "Lecture") {
        classType = "Lec";
    } else if (classType === "Tutorial") {
        classType = "Tut";
    } else if (classType === "Laboratory") {
        classType = "Lab";
    }

    const classTime = classContent[baseIndex + 1];
    const { formattedStartTime, formattedEndTime } = formatTime(classTime);
    const classLocation = truncLocation(classContent[baseIndex + 2]);

    if (classInstructorVal === "Y") {
        classInstructor = classContent[baseIndex + 4];
    }

    return {
        subjCode,
        classSect,
        subjTitle,
        classType,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        classLocation,
        classInstructor,
    };
}

export function addZeroToDate(date) {
    // Split date string to date and month
    const splitDate = date.split(" ");

    // Get date string
    const parseDate = parseInt(splitDate[0]);
    const parseMonth = splitDate[1];

    // Add 0 to date if it's 1 digit
    let formattedDate;
    if (parseDate > 0 && parseDate < 10) {
        formattedDate = `0${parseDate}`;
    } else {
        formattedDate = parseDate.toString();
    }

    // Combine date month
    const realDate = `${formattedDate} ${parseMonth}`;

    return realDate;
}

export async function lectFlow(iframeElement, config, classEvents) {
    console.log("Running lecturer process");
    // Access the iframe's content document
    const iframeDocument = iframeElement.contentWindow.document.body;

    // Select elements in iframe
    const dayHeader = iframeDocument.querySelectorAll("th.PSLEVEL3GRIDODDROW");
    const rows = iframeDocument.querySelectorAll("table.PSLEVEL3GRIDODDROW  tr");
    const year = iframeDocument.querySelector(
        "div#win0divDERIVED_CLASS_S_DESCR100_2 td.PSGROUPBOXLABEL.PSLEFTCORNER"
    ).textContent;
    const subjTitleVal = iframeDocument.querySelector(
        'input[name="DERIVED_CLASS_S_SSR_DISP_TITLE$chk"][id="DERIVED_CLASS_S_SSR_DISP_TITLE$chk"]'
    ).value;
    const classInstructorVal = iframeDocument.querySelector(
        'input[name="DERIVED_CLASS_S_SSR_DISP_ROLE$chk"][id="DERIVED_CLASS_S_SSR_DISP_ROLE$chk"]'
    ).value;

    if (!dayHeader || dayHeader.length === 0) {
        console.error("No day elements found");
        throw new Error("No day elements found. Please make sure you're on the lecturer timetable page.");
    }

    if (subjTitleVal === "N" && (config.selectedEventFormat === "2" || config.selectedEventFormat === "3")) {
        console.error('Please check "Show Class Title" box below the calendar under Display Options!');
        throw new Error('Please check "Show Class Title" box below the calendar under Display Options!');
    }

    // Get the dates
    const days = [];
    const dates = [];
    dayHeader.forEach((element, index) => {
        if (index === 0) {
            dates.push("null");
        } else {
            const dayText = element.textContent.split("\n");
            const day = dayText[0].trim();
            let date = dayText[1];
            date = addZeroToDate(date);
            days.push(day);
            dates.push(date);
        }
    });

    // Create array to store all events.
    let skip = createArray(12, 8, 0);

    // For every tr
    rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll("td.PSLEVEL3GRIDODDROW");

        // track current col skips
        let curColSkips = 0;

        // For every cell
        cells.forEach((cell, susColIndex) => {
            if (susColIndex > 0) {
                // Other than the first one
                let colIndex = susColIndex + curColSkips;

                if (skip[rowIndex][susColIndex] > 0) {
                    curColSkips += 1;
                    colIndex += skip[rowIndex][susColIndex];
                }

                try {
                    const spanElement = cell.querySelector("span");
                    if (!spanElement) return;

                    // Get innerHTML and process data
                    const classContent = spanElement.innerHTML.split("<br>");
                    let result = procData(classContent, subjTitleVal, classInstructorVal);

                    const day = days[colIndex - 1];
                    const startDate = formatDate(dates[colIndex], year);
                    const endDate = formatDate(dates[colIndex], year);

                    let summary = `${result.subjCode} - ${result.classSect} (${result.classType})`;

                    if (config.selectedEventFormat === "2") {
                        summary = `${result.subjTitle} - ${result.classSect} (${result.classType})`;
                    } else if (config.selectedEventFormat === "3") {
                        summary = `${result.subjTitle} - ${result.subjCode} - ${result.classSect} (${result.classType})`;
                    }

                    console.log(
                        `Summary: ${summary}, Location: ${result.classLocation}, Day: ${day}, startDateTime: ${startDate}T${result.startTime}, endDateTime: ${endDate}T${result.endTime}`
                    );

                    // If class is 2 hours, mark slot below as "True"
                    let totalHourSpan = rowSpan(result.startTime, result.endTime);

                    // If the class's total span is more than an hour
                    if (totalHourSpan > 1) {
                        handleMultiHourClass(totalHourSpan, rowIndex, skip, colIndex);
                    }

                    const event = craftCalEvent(
                        config,
                        summary,
                        result.classLocation,
                        startDate,
                        result.startTime,
                        endDate,
                        result.endTime
                    );

                    classEvents.push(event);
                } catch (error) {
                    console.error("Error processing class data:", error);
                    throw error;
                }
            }
        });
    });
}
