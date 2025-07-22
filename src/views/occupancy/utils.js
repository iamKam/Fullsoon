import moment from "moment";

import { getTimeRange } from "./data";
import { isMidNigthtBetweenTime  } from "common/utils.ts";

import { TIME_DURATIONS as TIMES } from "common/constants";

export const parseData = (days, timezone) => {
  const keys = days?.length && Object.keys(days[0])
  const newDays = [];
  days?.forEach((day) => {
    day[keys[1]]?.forEach(({ interval: intervalz, ...rest }) => {
      const currentInterval = `${day[keys[0]]}T${intervalz}Z`;
      const getIntervalTz = () => moment.tz(currentInterval, timezone);
      const dateTz = getIntervalTz().format(`YYYY-MM-DD`);
      const interval = getIntervalTz().format(`HH:mm:ss`);
      const result = newDays.find((x) => x.date === dateTz);
      if (!result) {
        newDays.push({ date: dateTz, [keys[1]]: [{ ...rest, interval }] });
      } else {
        result[keys[1]]?.push({ ...rest, interval });
      }
    });
  });
  return newDays;
};

export const parseOccupancyData = (days, timezone) => {
  const newDays = [];
  days.forEach(({ occupancy, date }) => {
    occupancy.forEach(({ interval: intervalz, ...rest }) => {
      const currentInterval = `${date}T${intervalz}Z`;
      const getIntervalTz = () => moment.tz(currentInterval, timezone);
      let dateTz = getIntervalTz().format(`YYYY-MM-DD`);
      const interval = getIntervalTz().format(`HH:mm:ss`);

      /* as day starts from 05:00 (current day) and ended at 04:59 (next day),
       so adjust the next days' hours/time (00 - 04:59) with the previous day 
       to get complete one day that starts from 05:00 and ends at 04:30/59 */
      if (moment(interval, "HH:mm:ss").isBefore(moment("05:00:00", "HH:mm:ss")))
        dateTz = moment(dateTz).subtract(1, "days").format(`YYYY-MM-DD`);

      const result = newDays.find((x) => x.date === dateTz);
      if (!result) {
        newDays.push({ date: dateTz, occupancy: [{ ...rest, interval }] });
      } else {
        result.occupancy.push({ ...rest, interval });
      }
    });
  });
  return newDays;
};

export const getGuests = ({ occupancy }) => {
  let guests = { breakfast: 0, lunch: 0, afternoon: 0, dinner: 0 };

  Object.keys(TIMES)
    .filter((key) => key !== "allDay")
    .forEach((key) => {
      const [startTime, endTime] = TIMES[key];
      guests[key] = occupancy.reduce(
        (acc, obj) =>
          isMidNigthtBetweenTime(obj.interval, startTime, endTime)
            ? acc + obj.total_guests
            : acc,
        0
      );
    });
  return guests;
};

// Update getGuestsOccupancy to properly handle dinner service
export const getGuestsOccupancy = ({ date, occupancy }, timeDurations, dailyOccupancies, currentIndex) => {
  const durations = timeDurations;

  let guests = { breakfast: 0, lunch: 0, afternoon: 0, dinner: 0 };

  // Get next day's occupancy if available
  const nextDayOccupancy = currentIndex < dailyOccupancies.length - 1 
    ? dailyOccupancies[currentIndex + 1].occupancy 
    : [];

  Object.entries(durations).forEach(([key, timeRanges]) => {
    if (key === "outsideServiceTimeslot") {
      // Handle outsideServiceTimeslot separately since it has multiple ranges
      const ranges = timeRanges[0].split(',');
      ranges.forEach(range => {
        const [startTime, endTime] = range.split('-');
        const startMoment = moment(startTime, "HH:mm");
        const endMoment = moment(endTime, "HH:mm");

        guests[key] += occupancy.reduce((acc, obj) => {
          const timeMoment = moment(obj.interval, "HH:mm:ss");
          
          if (startMoment.isBefore(endMoment)) {
            if (timeMoment.isBetween(startMoment, endMoment, null, "[]")) {
              return acc + obj.occupancy;
            }
          } else {
            if (timeMoment.isSameOrAfter(startMoment)) {
              return acc + obj.occupancy;
            }
          }
          return acc;
        }, 0);

        if (startMoment.isAfter(endMoment)) {
          guests[key] += nextDayOccupancy.reduce((acc, obj) => {
            const timeMoment = moment(obj.interval, "HH:mm:ss");
            if (timeMoment.isSameOrBefore(endMoment)) {
              return acc + obj.occupancy;
            }
            return acc;
          }, 0);
        }
      });
    } else {
      // Handle regular time slots (breakfast, lunch, etc.)
      const [startTime, endTime] = timeRanges[0].split('-');
      const startMoment = moment(startTime, "HH:mm");
      const endMoment = moment(endTime, "HH:mm");

      // Calculate for current day
      guests[key] = occupancy.reduce((acc, obj) => {
        const timeMoment = moment(obj.interval, "HH:mm:ss");
        
        if (startMoment.isBefore(endMoment)) {
          // Normal time range
          if (timeMoment.isBetween(startMoment, endMoment, null, "[]")) {
            return acc + obj.occupancy;
          }
        } else {
          // Midnight-crossing range (like dinner)
          if (timeMoment.isSameOrAfter(startMoment)) {
            return acc + obj.occupancy;
          }
        }
        return acc;
      }, 0);

      // For midnight-crossing ranges, add next day's early hours
      if (startMoment.isAfter(endMoment)) {
        guests[key] += nextDayOccupancy.reduce((acc, obj) => {
          const timeMoment = moment(obj.interval, "HH:mm:ss");
          if (timeMoment.isSameOrBefore(endMoment)) {
            return acc + obj.occupancy;
          }
          return acc;
        }, 0);
      }
    }
  });

  return guests;
};

export const getOccupancy = ({ occupancy, comparisonOccupancy }) => {
  // Initialize totals for actual, predicted, and comparison occupancy
  let totalActualOccupancy = 0;
  let totalPredictedOccupancy = 0;
  let totalComparisonOccupancy = 0;

  // Sum up the actual and predicted occupancy for all intervals
  occupancy.forEach((obj) => {
    totalActualOccupancy += obj.actual_occupancy || 0;
    totalPredictedOccupancy += obj.predicted_occupancy || 0;
  });

  // Sum up the comparison occupancy for all intervals
  if (comparisonOccupancy) {
    comparisonOccupancy.forEach((obj) => {
      totalComparisonOccupancy += obj.occupancy || 0;
    });
  }
  // Return the totals
  return {
    total_actual_occupancy: totalActualOccupancy,
    total_predicted_occupancy: totalPredictedOccupancy,
    total_comparison_occupancy: totalComparisonOccupancy,
  };
};


const getDaysBetweenDates = function (startDate, endDate) {
  var now = startDate.clone(),
    dates = [];

  while (now.isSameOrBefore(endDate)) {
    dates.push(now.format("YYYY-MM-DD"));
    now.add(1, "days");
  }
  return dates;
};

export const sumDailyOccupancy = (days, formData) => {
  const duration = {
    breakfast: formData.breakfast,
    lunch: formData.lunch,
    afternoon: formData.afternoon,
    dinner: formData.dinner,
  };

  let futureDates = [];
  //skip if no days found
  // if (days.length != 0) {
  //   if (moment(formData.end_date).isAfter(moment(days[days.length - 1].date))) {
  //     futureDates = getDaysBetweenDates(
  //       moment(days[days.length - 1].date).add(1, "day"),
  //       moment(formData.end_date)
  //     );

  //     futureDates = [...futureDates, formData.end_date].map((d) => [
  //       new Date(`${d}T00:00:00.000Z`) / 1000,
  //       getRandomNumber(100, 6000),
  //     ]);
  //   }
  // }

  const dates = days.map((d) => [
    new Date(d.date) / 1000,
    d.occupancy
      .filter((o) => {
        if (Object.keys(duration).every((d) => !duration[d])) {
          return true;
        }
        const filterData = Object.keys(duration).map((ele) =>
          duration[ele]
            ? isMidNigthtBetweenTime(o.interval, TIMES[ele][0], TIMES[ele][1])
            : false
        );
        return filterData.some((f) => f === true);
      })
      .reduce((acc, obj) => acc + obj.total_guests, 0),
  ]);
  return [...dates, ...futureDates];
};

const transformIntervalTime = (days, timezone) => {
  const newDays = [];
  days.forEach(({ occupancy, date }) => {
    occupancy.forEach(({ interval: intervalz, ...rest }) => {
      const currentInterval = date.replace("00:00:00", intervalz);
      const getIntervalTz = () => moment.tz(currentInterval, timezone);
      const dateTz = getIntervalTz().format(`YYYY-MM-DD`) + "T00:00:00.000Z";
      const interval = getIntervalTz().format(`HH:mm:ss`);
      const result = newDays.find((x) => x.date === dateTz);
      if (!result) {
        newDays.push({ date: dateTz, occupancy: [{ ...rest, interval }] });
      } else {
        result.occupancy.push({ ...rest, interval });
      }
    });
  });
  return newDays;
};

export const generateAvgHourlyOccupancy = (
  days,
  formData,
  selectedRestaurant
) => {
  const duration = {
    breakfast: formData.breakfast,
    lunch: formData.lunch,
    afternoon: formData.afternoon,
    dinner: formData.dinner,
  };

  let startTime = TIMES.allDay[0];
  let endTime = TIMES.allDay[1];
  let timeRange = [];

  const selectedDurations = Object.keys(duration).filter((d) => duration[d]);
  if (selectedDurations.length === 1) {
    timeRange = getTimeRange(
      TIMES[selectedDurations][0],
      TIMES[selectedDurations][1],
      30
    );
  }
  if (selectedDurations.length > 1) {
    selectedDurations.forEach((d) => {
      timeRange.push(...getTimeRange(TIMES[d][0], TIMES[d][1], 30));
    });
  }
  if (timeRange.length === 0) {
    timeRange = getTimeRange(startTime, endTime, 30);
  }

  const timeRangeObj = timeRange.reduce(
    (a, v) => ({ ...a, [`${v}:00`]: [] }),
    {}
  );
  // const timezone = selectedRestaurant?.timezone
  //   ? selectedRestaurant.timezone
  //   : "";
  // const transformedDays = transformIntervalTime(days, timezone);

  days.forEach(({ occupancy }) =>
    occupancy.forEach(({ interval, total_guests }) => {
      if (timeRangeObj[interval]) {
        timeRangeObj[interval] = [...timeRangeObj[interval], total_guests];
      }
    })
  );

  const seriesData = Object.keys(timeRangeObj).map((t) =>
    timeRangeObj[t].reduce(
      (avg, value, _, { length }) =>
        parseFloat((parseFloat(avg) + value / days.length).toFixed(2)),
      0
    )
  );
  return { seriesData, timesData: timeRange };
};

export const timeInterval = () => {
  let x = {
    slotInterval: 30,
    openTime: "00:00:00",
    closeTime: "00:00:00",
  };

  //Format the time
  let startTime = moment(x.openTime, "HH:mm:ss");

  //Format the end time and the next day to it
  let endTime = moment(x.closeTime, "HH:mm:ss").add(1, "days");

  //Times
  let allTimes = [];

  //Loop over the times - only pushes time with 30 minutes interval
  while (startTime < endTime) {
    //Push times
    allTimes.push({
      interval: startTime.format("HH:mm:ss"),
      total_guests: Math.floor(Math.random() * 100 + 1),
    });
    //Add interval of 30 minutes
    startTime.add(x.slotInterval, "minutes");
  }
  return allTimes;
};

export const getDatesInRange = (startDate, endDate) => {
  const date = new Date(startDate.getTime());
  const dates = [];

  while (date <= endDate) {
    dates.push({
      date: new Date(date).toISOString(),
      occupancy: timeInterval(),
    });
    date.setUTCDate(date.getDate() + 1);
  }

  return dates;
};

export const dummyYearlyData = [
  [
    {
      "name": "Forecast",
      "2024-12-24": 204,
      "2024-12-25": 241,
      "2024-12-26": 218,
      "2024-12-27": 197,
      "2024-12-28": 281,
      "2024-12-29": 262,
      "2024-12-30": 200
    },
    {
      "name": "Actual",
      "2024-12-24": 195,
      "2024-12-25": 220,
      "2024-12-26": 210,
      "2024-12-27": 0,
      "2024-12-28": 0,
      "2024-12-29": 0,
      "2024-12-30": 0
    },
    {
      "name": "Year-1",
      "2024-12-24": 286,
      "2024-12-25": 243,
      "2024-12-26": 232,
      "2024-12-27": 257,
      "2024-12-28": 221,
      "2024-12-29": 232,
      "2024-12-30": 355
    }
  ]
]

export const dummyMonthlyData = [
  [
    {
      "name": "Forecast",
      "2024-12-24": 204,
      "2024-12-25": 241,
      "2024-12-26": 218,
      "2024-12-27": 197,
      "2024-12-28": 281,
      "2024-12-29": 262,
      "2024-12-30": 200
    },
    {
      "name": "Actual",
      "2024-12-24": 195,
      "2024-12-25": 220,
      "2024-12-26": 210,
      "2024-12-27": 0,
      "2024-12-28": 0,
      "2024-12-29": 0,
      "2024-12-30": 0
    },
    {
      "name": "Month-1",
      "2024-12-24": 286,
      "2024-12-25": 243,
      "2024-12-26": 232,
      "2024-12-27": 257,
      "2024-12-28": 221,
      "2024-12-29": 232,
      "2024-12-30": 355
    }
  ]
]


export const dummyWeeklyData = [
  [
    {
      "name": "Forecast",
      "2024-12-24": 204,
      "2024-12-25": 241,
      "2024-12-26": 218,
      "2024-12-27": 197,
      "2024-12-28": 281,
      "2024-12-29": 262,
      "2024-12-30": 200
    },
    {
      "name": "Actual",
      "2024-12-24": 195,
      "2024-12-25": 220,
      "2024-12-26": 210,
      "2024-12-27": 0,
      "2024-12-28": 0,
      "2024-12-29": 0,
      "2024-12-30": 0
    },
    {
      "name": "Week-1",
      "2024-12-24": 286,
      "2024-12-25": 243,
      "2024-12-26": 232,
      "2024-12-27": 257,
      "2024-12-28": 221,
      "2024-12-29": 232,
      "2024-12-30": 355
    }
  ]
]
