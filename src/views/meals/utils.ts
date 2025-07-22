import { TIMES_CHECKBOXES } from "common/constants";
import moment from "moment";

export const timezoneFormat = (startDate, endDate, tz, startTime = "00:00", endTime = "23:59") => {
  let start = moment.tz(`${startDate} ${startTime}`, "YYYY-MM-DD HH:mm", tz).utc();
  let end = moment.tz(`${endDate} ${endTime}`, "YYYY-MM-DD HH:mm", tz).utc();
  // const isEndTodaysDate = moment(endDate).isSame(new Date(), "day");
  // if (isEndTodaysDate) {
  //   end = moment().utc();
  // }

  return {
    start_date: moment(start).format("YYYY-MM-DD"),
    end_date: moment(end).format("YYYY-MM-DD"),
    start_time: moment(start).format("HH:mm"),
    end_time: moment(end).format("HH:mm"),
  };
};

export const getTimezoneFormat = (date, tz) => {
  let convertedTime = moment.tz(date + ` 00:00`, "YYYY-MM-DD HH:mm", tz).utc();
  // const isEndTodaysDate = moment(endDate).isSame(new Date(), "day");
  // if (isEndTodaysDate) {
  //   end = moment().utc();
  // }

  return moment(convertedTime).format("YYYY-MM-DD");

};

export const isFormDataSame = (formData, oldFormData) => {
  let isSame = true;
  const objectKeys = formData && Object.keys(formData);
  objectKeys?.forEach((key) => {
    if(formData[key] && oldFormData[key]) {
      if(Array.isArray(formData[key]) && Array.isArray(oldFormData[key])) {
        if(formData[key].length != oldFormData[key].length) {
          isSame = false; 
        }
      }else if(formData[key] != oldFormData[key]) {
        isSame = false;
      }
    }
  })
  return isSame
}

export const parseData = (days, timezone = 'Europe/Paris') => {
  const newDays: any[] = [];
  days?.forEach(({ details, date }) => {
    details.forEach(({ interval: intervalz, ...rest }) => {
      const currentInterval = `${date}T${intervalz}Z`;
      const getIntervalTz = () => moment.tz(currentInterval, timezone);
      const dateTz = getIntervalTz().format(`YYYY-MM-DD`);
      const interval = getIntervalTz().format(`HH:mm:ss`);
      const result = newDays.find((x) => x.date === dateTz);
      if (!result) {
        newDays.push({ date: dateTz, details: [{ ...rest, interval }] });
      } else {
        result.details.push({ ...rest, interval });
      }
    });
  });
  return newDays;
};

export const getFormattedMeal = (meal, timezone) => (
  {...meal, days: meal?.days?.map(day => ({...day, date: getTimezoneFormat(day.date,timezone)}))}
)

export const getTimeRange = (formData) => {
  let time_range: string[] = [];
  TIMES_CHECKBOXES.forEach((data) => {
    if (data.name in formData && formData[data.name]) {
      time_range.push(data.time);
    }
  });
  return time_range;
};

// check if any selected time range crosses midnight
export const checkCrossMidnight = (formData) => {
  if (!formData?.time_check_boxes) {
    return { crossesMidnight: false, startTime: null, endTime: null };
  }
  
  let crossesMidnight = false;
  let crossingEndTime = null;
  const { breakfast, lunch, afternoon, dinner, time_check_boxes } = formData;
  const areAllMealsFalse = !breakfast && !lunch && !afternoon && !dinner;

  for (const checkbox of time_check_boxes) {
    const isOutside = checkbox.name === "outsideServiceTimeslot";
    const isSelected = formData[checkbox.name];

    if ((areAllMealsFalse && !isOutside) || isSelected) {
      const timeRanges = checkbox.time.split(",");

      for (const range of timeRanges) {
        const [start, end] = range.split("-");
        const [startHour, startMinute] = start.split(":").map(Number);
        const [endHour, endMinute] = end.split(":").map(Number);

        const startTimeMoment = moment().hours(startHour).minutes(startMinute);
        const endTimeMoment = moment().hours(endHour).minutes(endMinute);

        if (startTimeMoment.isAfter(endTimeMoment)) {
          // Found a crossing
          crossesMidnight = true;
          crossingEndTime = end;
        }
      }
    }
  }

  if (crossesMidnight) {
    // Now find the first selected time slot for the next day
    for (const checkbox of time_check_boxes) {
      const isOutside = checkbox.name === "outsideServiceTimeslot";
      const isSelected = formData[checkbox.name];

      if ((areAllMealsFalse && !isOutside) || isSelected) {
        const timeRanges = checkbox.time.split(",");
        const [firstStart] = timeRanges[0].split("-"); // first range's start
        return {
          crossesMidnight: true,
          startTime: firstStart, // first available start time (e.g. breakfast)
          endTime: crossingEndTime,
        };
      }
    }
  }

  return {
    crossesMidnight: false,
    startTime: null,
    endTime: null,
  };
};