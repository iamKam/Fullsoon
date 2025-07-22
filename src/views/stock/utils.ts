import { DUMMY_INGREDIENTS, EXPIRY_OPTIONS, UNITS } from "common/constants";
import moment from "moment";
import momentTimezone from "moment-timezone";

import { getRandomNumber } from "views/occupancy/data";
import { getDummyProviders } from "views/settings/utils";

/**
 * Mapping of days for moment
 */
const DAY_MAPPING = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};


export const getFormattedTime = (time: string) : string => {
  return moment(time, "HH:mm").tz("Europe/Paris").format("HH:mm")
}

/**
 * Extract day from provider and creating the expected date
 *
 * @param {Object} deliveryFrequency
 * @returns string
 */

export const getDeliveryDate = (deliveryFrequency, format = "MM-DD-YYYY") => {
  let purchasing_days = deliveryFrequency.delivery_days?.settings?.sort((a, b) => DAY_MAPPING[a.purchasing_day] - DAY_MAPPING[b.purchasing_day])
  let dateObject = {...deliveryFrequency.delivery_days, settings: purchasing_days}
  // let delivery_days = deliveryFrequency.delivery_days?.settings?.map(d => d.delivery_day)
  const currentDay = (x = null): any =>
    x !== null ? moment().day(x) : moment().day();
  
  let dDate = "";
  if (purchasing_days?.length) {
    // first check for remaining days of week for delivery
    for (const it of dateObject.settings) {
      if(getFormattedTime(moment().format('HH:mm')) <= dateObject.purchasing_time_limit && DAY_MAPPING[it.purchasing_day] == currentDay()) {
        if(DAY_MAPPING[it.delivery_day] < DAY_MAPPING[it.purchasing_day]) {
          dDate = moment().add(1, "weeks").day(DAY_MAPPING[it.delivery_day])?.format(format);
        } else {
          dDate = currentDay(DAY_MAPPING[it.delivery_day])?.format(format);
        }
        break;
      } else if(getFormattedTime(moment().format('HH:mm')) >= dateObject.purchasing_time_limit && DAY_MAPPING[it.purchasing_day] == currentDay()){
        dateObject = {...deliveryFrequency.delivery_days, settings: dateObject.settings.filter(d => (d.delivery_day !== it.delivery_day && d.purchasing_day !== it.purchasing_day))}
      }
    }

    if (dDate === "") {
      for (const it of dateObject.settings) {
        if (DAY_MAPPING[it.purchasing_day] >= currentDay() && DAY_MAPPING[it.delivery_day] > DAY_MAPPING[it.purchasing_day]) {
          dDate = currentDay(DAY_MAPPING[it.delivery_day])?.format(format);
          break;
        }
      }
    }

    if (dDate === "") {
      // else check for next week
      for (const it of dateObject.settings) {
        if(DAY_MAPPING[it.purchasing_day] > currentDay() && DAY_MAPPING[it.delivery_day] < DAY_MAPPING[it.purchasing_day]) {
          dDate = moment().add(1, "weeks").day(DAY_MAPPING[it.delivery_day])?.format(format);
          break;
        }
        if (DAY_MAPPING[it.purchasing_day] > currentDay() && DAY_MAPPING[it.delivery_day] > DAY_MAPPING[it.purchasing_day]) {
          dDate = currentDay(DAY_MAPPING[it.delivery_day])?.format(format);
          break;
        }
      }
    }
    if (dDate === "") {
      // else check for next week
      for (const it of dateObject.settings) {
          if (DAY_MAPPING[it.purchasing_day] >= 1) {
          dDate = moment().add(1, "weeks").day(DAY_MAPPING[it.delivery_day])?.format(format);
          break;
        }
      }
    }
  }
  return dDate;
};

export const getAllPossibleDeliveryDates = (deliveryFrequency, format = "MM-DD-YYYY") => {
  const settings = deliveryFrequency.delivery_days?.settings || [];
  const dateObjects: moment.Moment[] = [];

  for (const it of settings) {
    const purchasingDay = DAY_MAPPING[it.purchasing_day];
    const deliveryDay = DAY_MAPPING[it.delivery_day];
    const now = moment();
    const currentDay = now.day();
    const currentTime = getFormattedTime(now.format("HH:mm"));
    const limitTime = deliveryFrequency.delivery_days.purchasing_time_limit;

    let deliveryDate;

    if (currentTime <= limitTime && currentDay === purchasingDay) {
      if (deliveryDay < purchasingDay) {
        deliveryDate = moment().add(1, "weeks").day(deliveryDay);
      } else {
        deliveryDate = moment().day(deliveryDay);
      }
    } else {
      if (deliveryDay <= currentDay) {
        deliveryDate = moment().add(1, "weeks").day(deliveryDay);
      } else {
        deliveryDate = moment().day(deliveryDay);
      }
    }

    // Avoid duplicates
    if (!dateObjects.some(d => d.isSame(deliveryDate, 'day'))) {
      dateObjects.push(deliveryDate);
    }
  }

  // Sort dates in descending order (latest first)
  const sortedDates = dateObjects.sort((a, b) => a.diff(b));

  // Format after sorting
  return sortedDates.map(date => date.format(format));
};

export const parseEvolutionData = (days:any, timezone:any) => {
  const newDays:any = [];
  days.forEach(({ predictions, date }) => {
    predictions.forEach(({ interval: intervalz, ...rest }) => {
      const currentInterval = `${date}T${intervalz}Z`;
      const getIntervalTz = () => moment.tz(currentInterval, timezone);
      const dateTz = getIntervalTz().format(`YYYY-MM-DD`);
      const interval = getIntervalTz().format(`HH:mm:ss`);
      const result = newDays.find((x) => x.date === dateTz);
      if (!result) {
        newDays.push({ date: dateTz, predictions: [{ ...rest, interval }] });
      } else {
        result.predictions.push({ ...rest, interval });
      }
    });
  });
  return newDays;
}

export const getRandomStock = () => {
  const data = {
    ingredient_stock: [] as any,
    limit: 25,
    order_by: "ASC",
    page: 1,
    sort_by: "name",
    total_pages: 1,
    total_results: 15,
  };

  const providers = getDummyProviders();
  DUMMY_INGREDIENTS.forEach((value) => {
    data.ingredient_stock.push({
      provider: providers[Math.floor(Math.random() * providers.length)],
      format: getRandomNumber(1, 100),
      id: getRandomNumber(1, 10000),
      name: value,
      restaurant_id: null,
      stock: {
        stock: getRandomNumber(1, 100),
        expiry: EXPIRY_OPTIONS.map((e) => e.value)[
          Math.floor(Math.random() * EXPIRY_OPTIONS.map((e) => e.value).length)
        ],
      },
      stock_prediction: null,
      unit: UNITS.map((u) => u.value)[
        Math.floor(Math.random() * UNITS.map((u) => u.value).length)
      ],
      unit_price: getRandomNumber(1, 30),
    });
  });

  return data;
};


export const slugify = (string) => {
  return string
      .toLowerCase()
      .replace(/\s+/g, '-') // replace spaces with -
      .replace(/[^\w\-]+/g, '') // remove anything not alphanumeric, underscore, or hyphen
      .replace(/\-\-+/g, '-') // replace multiple - with single -
      .replace(/^-+/, '') // trim - from start of text
      .replace(/-+$/, ''); // trim - from end of text
};
