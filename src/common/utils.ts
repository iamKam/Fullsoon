import React, { useCallback } from "react";
import moment from "moment";
import { TIMES_CHECKBOXES, TIME_DURATIONS as TIMES } from "./constants";
import { parseData } from "views/occupancy/utils";

const TIME_FORMAT = "HH:mm:ss";

export const replaceEmojis = (meals) => {
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  if (Array.isArray(meals)) {
    return meals.map(meal => ({
      ...meal,
      meal: (meal.meal || '').replace(emojiRegex, '').trim() 
    }));
  }
  // Process the string directly if input is a string
  if (typeof meals === 'string') {
    return meals.replace(emojiRegex, '').trim();
  }

  return meals;
};

export const isBetweenTime = (time, start, end) => 
  moment(time, TIME_FORMAT).isBetween(
    moment(`${start}:00`, TIME_FORMAT),
    moment(`${end}:00`, TIME_FORMAT),
    null,
    "[]"
);

export const isMidNigthtBetweenTime = (time, start, end, currentDate, nextDate = null) => {
  // Extract just the time part if full datetime is provided
  const timePart = time.length > 8 ? time.split(' ')[1] : time;
  const timeMoment = moment(timePart, "HH:mm:ss");
  const startMoment = moment(start, "HH:mm");
  const endMoment = moment(end, "HH:mm");

  // For normal ranges (start <= end)
  if (startMoment.isSameOrBefore(endMoment)) {
    return timeMoment.isBetween(startMoment, endMoment, null, "[]");
  }
  
  // For midnight-crossing ranges (start > end)
  // Check if time is in current day's portion (start to 23:59)
  if (timeMoment.isSameOrAfter(startMoment)) {
    return true;
  }
  // Check if time is in next day's portion (00:00 to end)
  if (nextDate && timeMoment.isSameOrBefore(endMoment)) {
    return true;
  }

  return false;
};

// to manage between times when there is a possiblity of start > end
// export const isBetweenTime1 = (time, start, end) => {
//   if (moment(`${start}:00`, TIME_FORMAT).isAfter(moment(`${end}:00`, TIME_FORMAT))) {
//     return moment(time, TIME_FORMAT).isBetween(
//       moment(`${start}:00`, TIME_FORMAT),
//       moment(`23:59:00`, TIME_FORMAT),
//       null,
//       "[]"
//     ) ? 
//     moment(time, TIME_FORMAT).isBetween(
//       moment(`${start}:00`, TIME_FORMAT),
//       moment(`23:59:00`, TIME_FORMAT),
//       null,
//       "[]"
//     ) :
//     moment(time, TIME_FORMAT).isBetween(
//       moment(`00:00:00`, TIME_FORMAT),
//       moment(`${end}:00`, TIME_FORMAT),
//       null,
//       "[]"
//     );
//   } else {
//     return moment(time, TIME_FORMAT).isBetween(
//       moment(`${start}:00`, TIME_FORMAT),
//       moment(`${end}:00`, TIME_FORMAT),
//       null,
//       "[]"
//     );
//   }
// }

export const cloneDeep = (x: any = "") => JSON.parse(JSON.stringify(x));

export const customToFixed = (number: number, decimal: number = 2): string =>
  number.toFixed(decimal).replace(/[.,]00$/, "");

export const getTimeDuration = (fd) => {
  const duration = {
    breakfast: fd.breakfast,
    lunch: fd.lunch,
    afternoon: fd.afternoon,
    dinner: fd.dinner,
  };

  const selectedDurations = Object.keys(duration).filter((d) => duration[d]);
  if (selectedDurations.length < 1) {
    return;
  }

  return selectedDurations.map((d) => TIMES[d][0] + "-" + TIMES[d][1]);
};

export const getExpiryTextColor = (text) => {
  let str = "text-";
  if (text === "Expired") {
    str += "danger";
  } else if (text === "Good") {
    str += "good";
  } else if (text === "Soon") {
    str += "soon";
  } else if (text === "No stock") {
    str += "out";
  }
  return str;
};

export const timezoneFormat = (startDate, endDate, tz) => {
  let start = moment.tz(startDate + ` 00:00`, "YYYY-MM-DD HH:mm", tz).utc();
  let end = moment.tz(endDate + ` 23:59`, "YYYY-MM-DD HH:mm", tz).utc();

  return {
    start_date: moment(start).format("YYYY-MM-DD"),
    end_date: moment(end).format("YYYY-MM-DD"),
    start_time: moment(start).format("HH:mm"),
    end_time: moment(end).format("HH:mm"),
  };
};

export const utcTimezoneFormat = (startDate, endDate, tz) => {
// Your input date and time strings
let start = moment.tz(startDate + ` 00:00`, "YYYY-MM-DD HH:mm", tz).utc();
let end = moment.tz(endDate + ` 23:59`, "YYYY-MM-DD HH:mm", tz).utc();

// Combine date and time strings
const combinedStartDateTime = `${moment(start).format("YYYY-MM-DD")} ${moment(start).format("HH:mm")}`;
const combinedEndDateTime = `${moment(end).format("YYYY-MM-DD")} ${moment(end).format("HH:mm")}`;


// Create a Moment object using the combined date and time
const startDateTime = moment(combinedStartDateTime, 'YYYY-MM-DD HH:mm');
const endDateTime = moment(combinedEndDateTime, 'YYYY-MM-DD HH:mm');


// Format the date in UTC format
const utcStartDateFormatted = startDateTime.format('YYYY-MM-DDTHH:mm:ss[Z]');
const utcEndDateFormatted = endDateTime.format('YYYY-MM-DDTHH:mm:ss[Z]');

return {start_date: utcStartDateFormatted, end_date: utcEndDateFormatted}
};

export const getTimezoneFormatUtc = (startDate, endDate, tz) => {
  let start = moment.tz(startDate + ` 00:00`, "YYYY-MM-DD HH:mm", tz).utc();
  let end = moment.tz(endDate + ` 23:59`, "YYYY-MM-DD HH:mm", tz).utc();

  let formattedDatesz = {
    start_date: moment(start).format("YYYY-MM-DD"),
    end_date: moment(end).format("YYYY-MM-DD"),
    start_time: moment(start).format("HH:mm"),
    end_time: moment(end).format("HH:mm"),
  };
  return { 
    start_date: `${formattedDatesz.start_date}T${formattedDatesz.start_time}:00Z`,
    end_date: `${formattedDatesz.end_date}T${formattedDatesz.end_time}:00Z`
  }
};

export const getTimeRanges = (formData, tz) => {
  const checkboxes = formData?.time_check_boxes?.length ? formData.time_check_boxes : TIMES_CHECKBOXES;
  const normalCheckboxes = checkboxes.filter(c => c.name !== "outsideServiceTimeslot");

  const hasAnyTrue = normalCheckboxes.some(cb => formData[cb.name]);
  let time_ranges: string[] = [];

  //If NO main slots selected and "outside" is also false, include all except outsideServiceTimeslot
  if (!hasAnyTrue && !formData.outsideServiceTimeslot) {
    normalCheckboxes.forEach(data => {
      time_ranges.push(data.time);
    });
  } else {
    checkboxes.forEach((data) => {
      const isChecked = formData[data.name];
      if (isChecked) {
        if (data.name === "outsideServiceTimeslot") {
          time_ranges.push(...data.time.split(','));
        } else {
          time_ranges.push(data.time);
        }
      }
    });
  }

  const getUTCTime = (start, end, tz) => 
    `${moment.tz(start, 'HH:mm', tz).utc().format('HH:mm')}-${moment.tz(end, 'HH:mm', tz).utc().format('HH:mm')}`;

  const timeRanges = time_ranges.map((t) => {
    const [start, end] = t.split('-');
    return getUTCTime(start, end, tz);
  });

  return timeRanges;
};

export const parseTime = (tz, time) => {
  let [hour, minute] = time.split(":");
  let hourInt = parseInt(hour);

  const offset = moment.tz(tz).utcOffset();
  let newHour: number | string = hourInt + offset / 60;
  if (newHour >= 24) {
    newHour = Math.abs(newHour - 24);
  }
  if (newHour < 0) {
    newHour = Math.abs(24 + newHour);
  }

  // handle non-whole hours if found e.g offsets with additional 15/30/45 minutes 
  if (newHour % 1 !== 0) {
    let [hrs, mnts] = newHour.toString().split('.');
    let hr = parseInt(hrs);
    let mnt = parseInt(mnts);
    minute = parseInt(minute);

    if (mnt === 25)
      minute += 15; 
    if (mnt === 5)
      minute += 30; 
    if (mnt === 75)
      minute += 45; 
    
    if (minute >= 60) {
      newHour = hr + 1;
      minute = minute - 60;
      if (minute === 0)
        minute = '00';
    } else {
      newHour = hr;
    }
  }

  if (("" + newHour).length === 1) {
    newHour = `0${newHour}`;
  }
  return `${newHour}:${minute}`;
};

export const roundToTwo = (num) => +(Math.round((num + "e+2") as any) + "e-2");


export const getDummyFilteredData = (data, formData, timezone = 'Europe/Paris') => {
  const start_date = moment(formData?.start_date);
  const end_date = moment(formData?.end_date);
  const startDateLastDay = moment(start_date).endOf("month").format("DD");
  const endDateFirstDay = moment(end_date).startOf("month").format("DD");
  const startDateMonth = moment(start_date).month() + 1;
  const endDateMonth = moment(end_date).month() + 1;
  const startDateYear = moment(start_date).year();
  const endDateYear = moment(end_date).year();
  const startDateDay = +moment(start_date).format("DD");
  const endDateDay = +moment(end_date).format("DD");

  let filteredData;

  if (!data || start_date > end_date) {
    return [];
  }

  if(moment(start_date).format("YYYY-MM-DD") == moment(end_date).format("YYYY-MM-DD")) {
    filteredData = data?.filter((item) =>
      moment(item.date).isSame(
        `2023-07-${moment(start_date).format("DD")}`
      )
    );
    filteredData = filteredData?.map((item) => {
      return {
        ...item,
        date: `${startDateYear}-${
          startDateMonth < 10 ? "0" + startDateMonth : startDateMonth
        }-${moment(item.date).format("DD")}`,
      };
    });
    return filteredData
  }

  if (
    start_date < end_date
  ) {
    if (startDateMonth != endDateMonth || startDateYear != endDateYear) {
      let filteredDataStart = data.filter((item) =>
        moment(item.date).isBetween(
          `2023-07-${startDateDay}`,
          `2023-07-${startDateLastDay}`
        )
      );
      let filteredDataEnd = data.filter((item) =>
        moment(item.date).isBetween(
          `2023-07-${endDateFirstDay}`,
          `2023-07-${endDateDay}`
        )
      );
      filteredDataStart = filteredDataStart.map((item) => {
        return {
          ...item,
          date: `${startDateYear}-${
            startDateMonth < 10 ? "0" + startDateMonth : startDateMonth
          }-${moment(item.date).format("DD")}`,
        };
      });
      filteredDataEnd = filteredDataEnd.map((item) => {
        return {
          ...item,
          date: `${endDateYear}-${
            endDateMonth < 10 ? "0" + endDateMonth : endDateMonth
          }-${moment(item.date).format("DD")}`,
        };
      });
      filteredData = [
        ...filteredDataStart,
        ...filteredDataEnd,
      ];
     return parseData(filteredData, timezone);
    } 

    filteredData = data.filter((item) =>
      moment(item.date).isBetween(
        `2023-07-${startDateDay}`,
        `2023-07-${endDateDay}`
      )
    );
    filteredData = filteredData.map((item) => {
      return {
        ...item,
        date: `${startDateYear}-${
          startDateMonth < 10 ? "0" + startDateMonth : startDateMonth
        }-${moment(item.date).format("DD")}`,
      };
    });
    filteredData = parseData(filteredData, timezone);
    return filteredData
  }

   
}

export const getResponse = (response, query) => {
  if(query === 'provider-ingredients'){
    return response['provider_ingredients'];
  }
  return response[query]
}

export const useOnDropAccepted = (setFiles: Function, setError: Function, t: Function) => {
  return useCallback((_acceptedFiles: any) => {
    const fileName = _acceptedFiles[0].name;
    const fileExtension = fileName.split('.').pop();

    if (fileExtension && (fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png')) {
      setFiles(
        _acceptedFiles.map((file: any) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        )
      );
    } else {
      setError(t("ForbiddenImageType"))
      return;
    }
  }, [setFiles, setError]);
};