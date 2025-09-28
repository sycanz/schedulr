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
    const [beforeHyphen, afterHyphen] = className.split('-');
    const trimBeforeHyphen = beforeHyphen.replace(/\s+/g, '');
    const fullClassName = `${trimBeforeHyphen} -${afterHyphen}`
    return fullClassName
}

// Reformat time. Current looks like '2:00PM - 4:00PM' and '10:00AM - 12:00PM' 
// Target format '2024-08-12T09:00:00+08:00'
export function formatTime(classTime) {
    function convertTimeFormat(timeStr) {
        const [time, period] = timeStr.split(/(AM|PM)/);

        let [hour, minute] = time.split(':');

        if (period === 'AM' && parseInt(hour) < 10) {
            hour = `0${hour}`;
        } else if (period === 'AM' && parseInt(hour) > 9) {
            hour = `${hour}`;
        } else if (period === 'PM' && parseInt(hour) < 12) {
            hour = parseInt(hour) + 12;
        }

        return `${hour}:${minute}:00+08:00`;
    }

    const [startTime, endTime] = classTime.split('-').map(t => t.trim());


    return {
        formattedStartTime: convertTimeFormat(startTime),
        formattedEndTime: convertTimeFormat(endTime)
    }
}

// Reformat date. Currently looks like '14 Aug'
// Target format '2024-08-14'
export function formatDate(classDate, yearElement) {
    // Get the correct date and month
    const [date, month] = classDate.split(' ')
    // console.log(`${date},${month}`)
    const months = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    }

    let monthValue = months[month];
    endDateYear = yearElement.substr(-4, 4);
    return `${endDateYear}-${monthValue}-${date}`
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
    const startTime = fStartTime.split(':');
    const endTime = fEndTime.split(':');

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
    for (i = 1; i < totalSpan; i++) {
        // If next row is a valid row
        if (rowIndex + i < skip.length) {
            // Edit value to 1 in row i
            skip[rowIndex + i][colIndex] = 1;

            updatePrevCol(colIndex, skip, rowIndex + i)
            let nextRow = rowIndex + i
        }
    }
}

export function updatePrevCol(colIndex, skip, nextRow) {
    // Checks the col before curr one
    let itrColIndex = colIndex - 1;
    while (itrColIndex > 0) {
        if (skip[nextRow][itrColIndex] > 0) {
            skip[nextRow][itrColIndex] += 1;
        }
        else {
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
        classInstructor
    }
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