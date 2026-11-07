import { craftCalEvent } from "./eventUtils.js";

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

    let startTime = convertTimeFormat(splitClassTimes[1]);
    let endTime = convertTimeFormat(splitClassTimes[3]);
    // console.log(convertTimeFormat(startTime), ",", convertTimeFormat(endTime));

    return { startTime, endTime };
}

export function procClassDay(classDay) {
    let classDayText = classDay.split(":")[1].trim();
    return { classDayText };
}

function correctKnownDefectedCliCDate(startDate, classDayText) {
    const classDayNumbers = {
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
    };
    const classDayNumber = classDayNumbers[classDayText];
    if (classDayNumber === undefined) {
        return startDate;
    }

    const [year, month, day] = startDate.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const isValidDate =
        Number.isInteger(year) &&
        Number.isInteger(month) &&
        Number.isInteger(day) &&
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;

    if (!isValidDate) {
        console.warn("[CLiC date check] Could not parse start date:", startDate);
        return startDate;
    }

    const sourceWeekday = date.getUTCDay();
    if (sourceWeekday === classDayNumber) {
        return startDate;
    }

    // Known CLiC defect: the date is Monday while the class day is Tuesday-Friday.
    if (sourceWeekday !== 1 || classDayNumber < 2 || classDayNumber > 5) {
        console.warn("[CLiC date check] Unexpected date/day mismatch; leaving date unchanged:", {
            startDate,
            classDayText,
        });
        return startDate;
    }

    date.setUTCDate(date.getUTCDate() + classDayNumber - 1);
    const correctedDate = date.toISOString().slice(0, 10);
    console.info("[CLiC date correction] Adjusted class start date:", {
        classDayText,
        originalStartDate: startDate,
        correctedStartDate: correctedDate,
    });
    return correctedDate;
}

export async function studentFlow(config, classEvents) {
    console.log("Running student process");
    let classSec = document.querySelectorAll("[id*='divSSR_SBJCT_LVL1_row']");

    if (classSec.length === 0) {
        throw new Error(
            "No class data found. Please make sure you're on the student timetable page and the page has loaded completely."
        );
    }

    for (const element of classSec) {
        // Get all the rows within this class section
        let classRows = element.querySelectorAll("tr[id*='STDNT_ENRL_SSVW$'][id*='_row_']");

        for (const row of classRows) {
            // For each row, get the class details (this will be consistent per row)
            let classDetails = row.querySelectorAll("a[id^='DERIVED_SSR_FL_SSR_SBJ_CAT_NBR$355']");
            let classDates = row.querySelectorAll("[id^='DERIVED_SSR_FL_SSR_ST_END_DT']");
            let classDays = row.querySelectorAll("[id^='DERIVED_SSR_FL_SSR_DAYS']");
            let classTimes = row.querySelectorAll("[id^='DERIVED_SSR_FL_SSR_DAYSTIMES']");
            let classLoc = row.querySelectorAll("[id^='DERIVED_SSR_FL_SSR_DRV_ROOM']");

            // Now loop through the time slots for this specific class type
            for (let i = 0; i < classDates.length; i++) {
                let classNameText = element.querySelector("[id^='DERIVED_SSR_FL_SSR_SCRTAB_DTLS']").textContent;
                let classDetailsText = classDetails[0].textContent.trim(); // Use the first (and likely only) class detail for this row
                let classDatesText = classDates[i].textContent.trim();
                let classDaysText = classDays[i].textContent.trim();
                let classTimesText = classTimes[i].textContent.trim();
                let classLocText = classLoc[i].textContent.trim();

                await groupData(
                    config,
                    classEvents,
                    classNameText,
                    classDetailsText,
                    classDatesText,
                    classDaysText,
                    classTimesText,
                    classLocText
                );
            }
        }
    }
}

async function groupData(config, classEvents, className, classDetails, classDates, classDay, classTimes, classLoc) {
    let { classCode, classNameOnly } = procClassName(className);
    let { classType, classSect } = procClassDetails(classDetails);
    let { startDate } = procClassDates(classDates);
    let { startTime, endTime } = procClassTimes(classTimes);
    let { classDayText } = procClassDay(classDay);

    startDate = correctKnownDefectedCliCDate(startDate, classDayText);

    let summary = `${classCode} - ${classSect} (${classType})`;

    if (config.selectedEventFormat === "2") {
        summary = `${classNameOnly} - ${classSect} (${classType})`;
    } else if (config.selectedEventFormat === "3") {
        summary = `${classNameOnly} - ${classCode} - ${classSect} (${classType})`;
    }

    const event = craftCalEvent(config, summary, classLoc, startDate, startTime, startDate, endTime);

    classEvents.push(event);
}
