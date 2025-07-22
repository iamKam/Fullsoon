import moment from "moment";
import { TIME_DURATIONS } from "common/constants";
import { DummyCompetitiveSetData } from "views/settings/utils";
import tableMealsDummy from "../../data/meals.json";

export const occupancyTableColumns = [
  {
    dataField: "date",
    caption: "Date",
    style: { width: "150px" },
    headerStyle: { width: "150px" },
  },
  {
    dataField: "breakfast",
    caption: "Breakfast",
    className: "text-center",
    headerClassName: "text-center",
    isLower: (params) => (params < 10 ? "text-danger" : ""),
    isHigher: (params) => (params > 50 ? "text-success" : ""),
  },
  {
    dataField: "lunch",
    caption: "Lunch",
    className: "text-center",
    headerClassName: "text-center",
    isLower: (params) => (params < 10 ? "text-danger" : ""),
    isHigher: (params) => (params > 50 ? "text-success" : ""),
  },
  {
    dataField: "afternoon",
    caption: "Afternoon",
    className: "text-center",
    headerClassName: "text-center",
    isLower: (params) => (params < 10 ? "text-danger" : ""),
    isHigher: (params) => (params > 50 ? "text-success" : ""),
  },
  {
    dataField: "dinner",
    caption: "Dinner",
    className: "text-center",
    headerClassName: "text-center",
    isLower: (params) => (params < 10 ? "text-danger" : ""),
    isHigher: (params) => (params > 50 ? "text-success" : ""),
  },
];

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

export function getDates(startDate, stopDate) {
  var dateArray = new Array();
  var currentDate = startDate;
  while (currentDate <= stopDate) {
    dateArray.push(new Date(currentDate).getTime());
    currentDate = currentDate.addDays(1);
  }
  return dateArray;
}

export const getRandomNumber = (min = 0, max = 100) => {
  // min = Math.ceil(min);
  // max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export function getTimeRange(openTime, closeTime, slotInterval) {
  const format = "HH:mm";
  let startTime = moment(openTime, format);
  let endTime = moment(closeTime, format);
  // If endTime is before or equal to startTime, it means the range crosses midnight
  if (endTime.isSameOrBefore(startTime)) {
    endTime.add(1, 'day'); // move endTime to next day
  }

  const allTimes = [];

  // Loop over the times - only pushes time with 30 minutes interval
  while (startTime <= endTime) {
    //Push times
    allTimes.push(startTime.format(format));
    //Add interval of 30 minutes
    startTime.add(slotInterval, "minutes");
  }

  return allTimes;
}
export function getDateRange(startDate, endDate) {
  const start = moment(startDate);
  const end = moment(endDate);
  const allDates = [];

  // Loop over the dates
  while (start <= end) {
    // Push dates
    allDates.push(start.format("YYYY-MM-DD"));
    // Increment to the next day
    start.add(1, "day");
  }

  return allDates;
}
// to manage timeRange when there is a possiblity of openTime > closeTime as well
// export function getTimeRange1(openTime, closeTime, slotInterval) {
//   let allTimes = [];

//   const startTime = moment(openTime, "HH:mm");
//   const endTime = moment(closeTime, "HH:mm");

//   if (moment(openTime, "HH:mm").isAfter(moment(closeTime, "HH:mm"))) {
//     allTimes = getIntervals(startTime, moment("23:59", "HH:mm"), slotInterval);
//     allTimes.push(...getIntervals(moment("00:00", "HH:mm"), endTime, slotInterval));
//   } else {
//     allTimes = getIntervals(startTime, endTime, slotInterval);
//   }

//   return allTimes;
// }

// const getIntervals = (startTime, endTime, slotInterval) => {
//   let allTimes = [];
//   // Loop over the times - only pushes time with 30 minutes interval
//   while (startTime <= endTime) {
//     //Push times
//     allTimes.push(startTime.format("HH:mm"));
//     //Add interval of 30 minutes
//     startTime.add(slotInterval, "minutes");
//   }
//   return allTimes;
// }

export const generateBarChartRawData = (formData) => {
  const {
    breakfast: isBreakfast,
    lunch: isLunch,
    afternoon: isAfternoon,
    dinner: isDinner,
  } = formData;

  const timer = {
    isBreakfast,
    isLunch,
    isAfternoon,
    isDinner,
  };
  let timesData = [];

  const selected = Object.keys(timer).filter((x) => timer[x]);

  if (selected.length === 1) {
    const ele = selected[0].replace("is", "").toLowerCase();
    timesData = getTimeRange(
      TIME_DURATIONS[ele][0],
      TIME_DURATIONS[ele][1],
      30
    );
  } else if (selected.length > 1) {
    selected.forEach((d) => {
      d = d.replace("is", "").toLowerCase();
      timesData.push(
        ...getTimeRange(TIME_DURATIONS[d][0], TIME_DURATIONS[d][1], 30)
      );
    });
  }

  if (timesData.length === 0) {
    timesData = getTimeRange(
      TIME_DURATIONS.allDay[0],
      TIME_DURATIONS.allDay[1],
      30
    );
  }

  const seriesData = timesData.map((x) => getRandomNumber());
  return { timesData, seriesData };
};

export const generateServiceLineChartRawData = (formData) => {
  const timesData = serviceGetTimeData(formData);
  const finalSeries = [];
  formData?.meals.forEach((ele) => {
    finalSeries.push({
      name: ele,
      data: timesData.map((d) => {
        const [hh, mm] = d.split(":");
        return [`${hh}:${mm}`, getRandomNumber()];
      }),
    });
  });
  return finalSeries;
};

export const generateLineChartRawData = (formData) => {
  const datesData = getDates(
    new Date(formData.start_date),
    new Date(formData.end_date)
  );
  return datesData.map((d) => [Math.floor(d / 1000), getRandomNumber()]);
};

export const generateTableRawData = (formData) => {
  const datesData = getDates(
    new Date(formData.start_date),
    new Date(formData.end_date)
  );
  return datesData.map((d) => ({
    date: moment(d).format("DD MMMM YYYY"),
    breakfast: getRandomNumber(),
    lunch: getRandomNumber(),
    afternoon: getRandomNumber(),
    dinner: getRandomNumber(),
  }));
};

export const serviceTableData = [
  {
    meal: "Pizza",
    "9:00": 2,
    "9:30": 4,
    "10:00": 6,
    "10:30": 6,
  },
  {
    meal: "Orange juice",
    "9:00": 2,
    "9:30": 4,
    "10:00": 6,
    "10:30": 6,
  },
  {
    meal: "Apple juice",
    "9:00": 2,
    "9:30": 4,
    "10:00": 6,
    "10:30": 6,
  },
  {
    meal: "Grape juice",
    "9:00": 2,
    "9:30": 4,
    "10:00": 6,
    "10:30": 6,
  },
];

const serviceGetTimeData = (formData, slotInterval = 30, type = "minute") => {
  const {
    breakfast: isBreakfast,
    lunch: isLunch,
    afternoon: isAfternoon,
    dinner: isDinner,
    outsideServiceTimeslot: isOutsideServiceTimeslot,
    start_date,
    end_date,
    time_check_boxes,
  } = formData;

  if(type === "daily") {
    const startDate =  moment(start_date, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD')
    return getDateRange(
      moment(startDate, 'YYYY-MM-DD').add(1, 'day').format('YYYY-MM-DD'),
      moment(start_date, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD'),
    );
  }

  // Determine all checkbox names from time_check_boxes
  const allCheckboxNames = Array.isArray(time_check_boxes)
    ? time_check_boxes.map(cb => cb.name)
    : [];

  // Construct selected checkboxes (only those that are true)
  let selected = allCheckboxNames.filter(name => formData[name]);

  // If none are selected and checkboxes exist → include all EXCEPT "outsideServiceTimeslot"
  if (selected.length === 0 && allCheckboxNames.length > 0) {
    selected = allCheckboxNames.filter(name => name !== "outsideServiceTimeslot");
  }

  let timeRange = [];

  // Handle time ranges based on selected checkboxes
  if (Array.isArray(time_check_boxes) && time_check_boxes.length > 0) {
    selected.forEach((key) => {
      const matched = time_check_boxes.find((item) => item.name === key);
      if (matched?.time) {
        const ranges = matched.time.split(',');
        ranges.forEach((range) => {
          const [start, end] = range.split('-');
          const fullRange = getTimeRange(start, end, slotInterval);
          timeRange.push(...fullRange);
        });
      }
    });
  } else {
    // fallback to TIME_DURATIONS if no time_check_boxes
    if (selected.length === 1) {
      const ele = selected[0];
      timeRange = getTimeRange(
        TIME_DURATIONS[ele][0],
        TIME_DURATIONS[ele][1],
        slotInterval
      );
    } else if (selected.length > 1) {
      selected.forEach((key) => {
        timeRange.push(
          ...getTimeRange(TIME_DURATIONS[key][0], TIME_DURATIONS[key][1], slotInterval)
        );
      });
    }
  }

  // If nothing at all was selected and no default found, use full day range
  if (timeRange.length === 0) {
    timeRange = getTimeRange(
      TIME_DURATIONS.allDay[0],
      TIME_DURATIONS.allDay[1],
      slotInterval
    );
  }

  return timeRange;
};

const getServiceTableData = (timesData) => {
  const seriesData = timesData.map((x) => ({ [x]: getRandomNumber(5, 20) }));
  return seriesData.reduce(
    (obj, item) => (
      (obj[Object.keys(item)[0]] = item[Object.keys(item)[0]]), obj
    ),
    {}
  );
};

export const generateServiceTableRawData = (formData, type = "minute", slotInterval = 30) => {
  const newData = [];
  const timesData = serviceGetTimeData(formData, slotInterval, type)
  let it = "";
  if (formData.meals) {
    it = "meal";
  }
  if (formData.noOfPeople) {
    it = "noOfPeople";
  }

  let rows = formData.meals ?? formData.noOfPeople;
  if (formData.meals?.length === 0) {
    rows = meals;
  }

  rows.forEach((m) => {
    newData.push({ [it]: m, ...getServiceTableData(timesData) });
  });
  return { timesData, data: newData };
};

export const generateOccupancyTableRawData = (formData, timeDurations, type = "minute", slotInterval = 30) => {
  // Generate the time intervals using serviceGetTimeData
  const timesData = serviceGetTimeData(formData, slotInterval, type);
  const newData = [];

  // If no rows (e.g., meals or noOfPeople), create a default structure using timesData
  timesData.forEach((time) => {
    newData.push({ time, value: getRandomNumber(5, 20) });
  });

  // Return the calculated timesData and data
  return { timesData, data: newData };
};


const getFinanceTableData = (cols) => {
  const dataFields = cols.map((f) => f.dataField);
  const newData = {};
  dataFields.forEach((ele) => {
    newData[ele] = getRandomNumber();
  });
  return newData;
};

export const generateFinanceTableRawData = (formData, cols) => {
  const newData = [];
  let options = formData.meals;

  if (!formData.noOfPeople && formData.meals.length === 0) {
    options = tableMealsDummy.meals.map((i) => i?.name);
  }

  (options ?? formData.noOfPeople ?? []).forEach((m) => {
    newData.push({ name: m, ...getFinanceTableData(cols) });
  });
  return newData;
};

export const generateTotalEarnings = (formData) => {
  const newData = [];
  let options = formData.meals;

  if (!formData.noOfPeople && formData.meals.length === 0) {
    options = tableMealsDummy.meals.map((i) => i?.name);
  }

  (options ?? formData.noOfPeople ?? []).forEach((m) => {
    newData.push({ name: m, y: getRandomNumber() });
  });

  return newData;
};

export const meals = [
  "MAMMARGHERITA",
  "4 CHEESE ET UN JEAN",
  "LA VITA IN VERDE",
  "CERTIFIED CALZONE LOVERS",
  "HOT THE ROAD JACK",
  "MOMENT OF TRUFFE",
  "CRAZY SAN MARZANO",
  "PIATTO DI NATALE - CULURGIONES DI SARDEGNA",
  "GNOCCHETTI SARDI",
  "SPAGHETTI ALLA CARBONARA",
  "LA FAMEUSE PÂTE À LA TRUFFE",
  "PASTA BAMBINI",
];

export const myResturants = [
  {
    id: 1,
    name: "Mezzo",
    latitude: 48.92119,
    longitude: 2.35597,
    address: "6 Rue Jean-Philippe Rameau, 93200 Saint-Denis, France",
  },
  {
    id: 2,
    name: "G la dalle",
    latitude: 48.88346,
    longitude: 2.32056,
    address: "160 Rue Oberkampf, 75011 Paris, France",
  },
  {
    id: 3,
    name: "Libertino",
    latitude: 48.87553,
    longitude: 2.35012,
    address: "44 Rue de Paradis, 75010 Paris, France",
  },
  {
    id: 4,
    name: "Popolare",
    latitude: 48.86813,
    longitude: 2.34329,
    address: "111 Rue Réaumur, 75002 Paris, France",
  },
  {
    id: 5,
    name: "Ober Mamma",
    latitude: 48.86446,
    longitude: 2.37018,
    address: " 107 Bd Richard-Lenoir, 75011 Paris, France",
  },
];

export const competitors = [
  { name: "Mamma Primi" },
  { name: "Pizza Hut" },
  { name: "Domino's Pizza" },
  { name: "Peppe Pizza" },
  { name: "Vapinao" },
  { name: "Da Giuseppe" },
  { name: "Daroco" },
  { name: "Competitive set (average)" },
];

export const generateCompetitorsTableData = (formData) => {
  const newData = [];
  if (formData.competitors.length) {
    DummyCompetitiveSetData.map((item) => {
      formData.competitors.map((i) => {
        if (item.id === i) {
          newData.push({
            name: item.name,
            occupancy: getRandomNumber(),
            occupancy_percentage: getRandomNumber(),
            revenue: getRandomNumber(),
            benefit: getRandomNumber(),
          });
        }
      });
    });
    return newData;
  }
  let options = DummyCompetitiveSetData;
  options.forEach((ele) => {
    newData.push({
      name: ele.name,
      occupancy: getRandomNumber(),
      occupancy_percentage: getRandomNumber(),
      revenue: getRandomNumber(),
      benefit: getRandomNumber(),
    });
  });
  return newData;
};

export const generatemyResturantTableData = (formData) => {
  const newData = [];
  if (formData.myRestaurants.length) {
    myResturants.map((item) => {
      formData.myRestaurants.map((i) => {
        if (item.id === i.id) {
          newData.push({
            name: item.name,
            occupancy: getRandomNumber(),
            occupancy_percentage: getRandomNumber(),
            revenue: getRandomNumber(),
            benefit: getRandomNumber(),
          });
        }
      });
    });
    return newData;
  }
  myResturants.forEach((ele) => {
    newData.push({
      name: ele.name,
      occupancy: getRandomNumber(),
      occupancy_percentage: getRandomNumber(),
      revenue: getRandomNumber(),
      benefit: getRandomNumber(),
    });
  });
  return newData;
};

export const generateMarketViewPieCharts = (formData) => {
  const newData = [];

  [""].forEach((m) => {
    newData.push({ name: m, y: getRandomNumber() });
  });
  return newData;
};

export const generateLineChartForecastData = (val = "") => {
  const breakfast = val === "breakfast";
  const lunch = val === "lunch";
  const dinner = val === "dinner";
  const allDay = val === "" || val === "all_day";

  const items = [];
  if (allDay) {
    new Array(24).fill().forEach((acc, index) => {
      items.push(moment({ hour: index }).unix());
      items.push(moment({ hour: index, minute: 30 }).unix());
    });
  } else if (breakfast) {
    [6, 7, 8, 9, 10, 11].forEach((hour) => {
      items.push(moment({ hour }).unix());
      items.push(moment({ hour, minute: 30 }).unix());
    });
  } else if (lunch) {
    [12, 13, 14].forEach((hour) => {
      items.push(moment({ hour }).unix());
      items.push(moment({ hour, minute: 30 }).unix());
    });
  } else if (dinner) {
    [18, 19, 20, 21, 22, 23].forEach((hour) => {
      items.push(moment({ hour }).unix());
      items.push(moment({ hour, minute: 30 }).unix());
    });
  }

  return items.map((i) => [i, getRandomNumber()]);
};
