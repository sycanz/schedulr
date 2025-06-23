export function procClassName(className) {
    // console.log(className.trim());
    let splitClassName = className.trim().split(/\s+/);
    // console.log(splitClassName);

    let classCode = splitClassName[0] + splitClassName[1];
    let classNameOnly = "";
    for (let i = 2; i < splitClassName.length; i++) {
        classNameOnly += splitClassName[i] + " ";
    }

    classNameOnly = classNameOnly.trim();

    // console.log(classCode, ",", classNameOnly);
    return { classCode, classNameOnly };
}

export function procClassDetails(classDetails) {
    let splitClassDetails = classDetails.split(" - ");
    // console.log(splitClassDetails);

    let classType = splitClassDetails[0].split(" ")[1];
    let classSect = splitClassDetails[1].split(" ")[2];
    // console.log(splitClassType);

    return { classType, classSect };
}

export function procClassDates(classDates) {
    // console.log(classDates);
    let splitClassDates = classDates.trim().split(" - ");
    // console.log(splitClassDates[0], splitClassDates[1]);

    let startDate = splitClassDates[0].replace(/\//g, "-").split("-").reverse().join("-");
    let endDate = splitClassDates[1].replace(/\//g, "-").split("-").reverse().join("-");

    // console.log(startDate, ",", endDate);
    return { startDate, endDate };
}

export function procClassTimes(classTimes) {
    // console.log(classTimes);
    let splitClassTimes = classTimes.trim().split(" ");
    // console.log(splitClassTimes[1], ",", splitClassTimes[3]);

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

    let startTime = convertTimeFormat(splitClassTimes[1]);
    let endTime = convertTimeFormat(splitClassTimes[3]);
    // console.log(convertTimeFormat(startTime), ",", convertTimeFormat(endTime));

    return { startTime, endTime };
}