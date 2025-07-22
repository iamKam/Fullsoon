import React, { useState, useEffect, useCallback, useRef } from "react";
import useWindowSize from "customHooks/useWindowResize";
import { useTranslation } from "react-i18next";
import { utils, writeFile } from 'xlsx';

import { CUTTOFF_HEIGHT } from "common/constants";
import { useUserData } from "contexts/AuthContextManagement";
import { useLoading } from "contexts/LoadingContextManagement";
import { getTimeRanges, getTimezoneFormatUtc, parseTime } from "common/utils";

import DetailsTable from "./detailsTable";
import Comparison from "./comparison";
import { isFormDataSame, parseData, timezoneFormat, checkCrossMidnight } from "./utils";
import {
  generateServiceTableRawData,
  getRandomNumber,
} from "../occupancy/data";
import topFlopMealsDummy from "../../data/top_flop_meals.json";
import tableMealsDummy from "../../data/table_meals.json";
import graphMealsDummy from "../../data/graph_meals.json";
import request from "services/request";
import moment from "moment";
import { toast } from "react-toastify";

let DEFAULT_START_DATE = moment(moment().format("YYYY-MM-DD"), "YYYY-MM-DD")
  .subtract(18, "days")
  .format("YYYY-MM-DD");
let DEFAULT_END_DATE = moment(moment().format("YYYY-MM-DD"), "YYYY-MM-DD")
  .subtract(2, "days")
  .format("YYYY-MM-DD");
const START_DATE = moment(moment().format("YYYY-MM-DD"), "YYYY-MM-DD")
  .subtract(1, "days")
  .format("YYYY-MM-DD");
const END_DATE = moment(moment().format("YYYY-MM-DD"), "YYYY-MM-DD")
  .subtract(1, "days")
  .format("YYYY-MM-DD");

const CURRENT_DATE = moment().format("YYYY-MM-DD")

function LeftSide({ formData, isDetailTab }) {
  const [, height] = useWindowSize();
  const { t, i18n } = useTranslation();
  const { setLoading } = useLoading();
  const {
    selectedRestaurant,
    selectedRestaurantId,
    isRestaurantLoaded,
    hasRetaurants,
  } = useUserData();
  const [deletedItems, setDeletedItems] = useState([]);
  const [isTop, setIsTop] = useState(true);
  const [mealsLoading, setMealsLoading] = useState(true);
  const [mealGraphLoading, setMealGraphLoading] = useState(true);
  const [topFlopLoading, setTopFlopLoading] = useState(true);
  const [topFlopData, setTopFlopData] = useState([]);
  const [mealsData, setMealsData] = useState(null);
  let [graphMealsData, setGraphMealsData] = useState([]);
  const prevFromData = useRef(formData);
  const childRef = useRef();

  useEffect(() => {
    setDeletedItems([]);
  }, [formData]);

  useEffect(async () => {
    if (selectedRestaurantId !== "" && JSON.stringify(prevFromData.current) !== JSON.stringify(formData)) {
      setMealGraphLoading(true);
      getTopFlopMealsData();
      getMealsData();
    }

    if (isRestaurantLoaded && !hasRetaurants) {
      setMealsLoading(false);
      setMealGraphLoading(false);
      setTopFlopLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurantId, selectedRestaurant, isRestaurantLoaded, JSON.stringify(formData)]);

  const onDownload = async () => {
    try {
      const response = await request.get(`sales/details`,
        {
          restaurant_id: selectedRestaurantId,
          start_date: getTimezoneFormatUtc(formData.start_date, formData.end_date, selectedRestaurant?.timezone)?.start_date,
          end_date: getTimezoneFormatUtc(formData.start_date, formData.end_date, selectedRestaurant?.timezone)?.end_date,
          restaurants: formData.myRestaurants,
          // meals: formData.meals ?? [],
          meals: Array.isArray(formData.meals)
          ? formData.meals.map((m) => (typeof m === "object" ? m.item_id : m)) // Handle both cases
          : [],
          time_ranges: getTimeRanges(formData, selectedRestaurant?.timezone),
          meal_types: formData.mealTypes ?? [],
          ...(formData?.service_type && { service_type: formData.service_type })
        },
        true,
        true,
        true
      );

      // Process your data and write to Excel
      setMealsData(response);

      const tableElement = childRef.current.getTableRef();
      const ws = utils.table_to_sheet(tableElement);
      const staticData = [
        [`${t("Restaurant name")}: ${selectedRestaurant.name}`], // A1
        [`${t("Start date")}: ${formData.start_date}`], // A2
        [`${t("End date")}: ${formData.end_date}`], // A3
        [],
        []
      ];

      // Combine static data and table data
      const tableData = utils.sheet_to_json(ws, { header: 1 }); // Convert existing sheet data to array
      const combinedData = [...staticData, ...tableData]; // Combine static and table data

      // Create a new sheet with combined data
      const newWs = utils.aoa_to_sheet(combinedData);

      // Adjust the file name
      const fileName = i18n.language === 'fr' 
        ? `${selectedRestaurant.name}_Extraction de données financières_${new Date().toLocaleDateString()}`
        : `${selectedRestaurant.name}_Fincancials extraction_${new Date().toLocaleDateString()}`;

      // Create a new workbook and append the sheet
      const wb = utils.book_new();
      utils.book_append_sheet(wb, newWs, 'Sheet1');

      // Download the Excel file
      writeFile(wb, `${fileName}.xlsx`);
      toast.success(t("Meals Downloaded successfully"))
      // Ensure progress reaches 100% after the file download completes
    } catch (error) {
      toast.error(t("Meals Download Failed"))
      console.error("Error downloading the file:", error);
    } 
  };

  const getRequestParams = () => {
    let finalEndDate = formData.end_date;
    let finalStartDate = formData.start_date;
    // check if any selected time range crosses midnight
    const isCrossMidnight = checkCrossMidnight(formData);
    if (isCrossMidnight?.crossesMidnight) {
      // add 1 day to the end_date
      finalEndDate = moment(finalEndDate).add(1, 'day').format('YYYY-MM-DD');
    }
    return {
      restaurant_id: selectedRestaurantId,
      ...(
        isCrossMidnight.crossesMidnight
          ? timezoneFormat(
              finalStartDate,
              finalEndDate,
              selectedRestaurant?.timezone,
              isCrossMidnight.startTime,
              isCrossMidnight.endTime
            )
          : timezoneFormat(
              finalStartDate,
              finalEndDate,
              selectedRestaurant?.timezone
            )
      ),
      time_ranges: getTimeRanges(formData, selectedRestaurant?.timezone),
      meals: Array.isArray(formData.meals)
        ? formData.meals.map((m) => (typeof m === "object" ? m.item_id : m)) // Handle both cases
        : [],
      restaurants: formData.myRestaurants ?? [],
      ...(formData?.total && { operation: "total" }),
      ...(formData?.average && { operation: "average" }),
      meal_types: formData.mealTypes ?? [],
    };
  };

  const generateTableColumns = (timesData) => [
    {
      dataField: "meal",
      caption: t("Meal"),
      className: "fw-bold",
      headerClassName: "meal-name",
      style: { width: "150px" },
      headerStyle: { width: "150px" },
    },
    {
      dataField: "actual_sales",
      caption: t("Realised"),
      className: "text-center",
      headerClassName: "text-center",
      style: { whiteSpace: "normal"},
    },
    {
      dataField: "predicted_sales",
      caption: t("Target"),
      className: "text-center",
      headerClassName: "text-center",
    },
    //  {
    //   dataField: "total",
    //   caption: t("Total"),
    //   className: "text-center",
    //   headerClassName: "text-center",
    // },
    ...timesData.map((ct) => ({
      dataField: ct,
      caption: ct,
      className: "text-center",
      headerClassName: "text-center",
    })),
    {
      dataField: "action",
      caption: "",
    },
  ];


  useEffect(() => {
    return () => {
      setMealsData({...mealsData, meals: []});
      setGraphMealsData([]);
    }
  },[selectedRestaurant, selectedRestaurantId, isRestaurantLoaded])

  const parseMealsData = (meals) => {
    const { timesData } = generateServiceTableRawData(formData, `minute`, 30);
    // Sort timesData in ascending order if outsideServiceTimeslot is checked
    const sortedTimesData = formData.outsideServiceTimeslot
      ? [...timesData].sort((a, b) => {
          const timeA = moment(a, "HH:mm");
          const timeB = moment(b, "HH:mm");
          return timeA.diff(timeB);
        })
      : timesData;
    const mealData = [];
    meals?.forEach((ele) => {
      let actual_sales = ele.actual_sales; 
      let predicted_sales = ele.predicted_sales;
      if (isRestaurantLoaded && !hasRetaurants) {
        if (formData.breakfast) {
          actual_sales = ele.breakfast_actual_sales;
          predicted_sales = ele.breakfast_prdicted_sales;
        } else if (formData.lunch) {
          actual_sales = ele.lunch_actual_sales;
          predicted_sales = ele.lunch_prdicted_sales;
        } else if (formData.afternoon) {
          actual_sales = ele.afternoon_actual_sales;
          predicted_sales = ele.afternoon_prdicted_sales;
        } else if (formData.dinner) {
          actual_sales = ele.dinner_actual_sales;
          predicted_sales = ele.dinner_prdicted_sales;
        }
      }        
      const meal = {
        id: ele.id,
        meal: ele.name,
        actual_sales: actual_sales,
        predicted_sales: predicted_sales,
      };
      const intervals = {};
      const intervalsArray = [];
      sortedTimesData.forEach((t) => {
        const isExist = ele?.details?.find(
          ({ interval }) =>
            parseTime(
              selectedRestaurant?.timezone,
              interval.split(":")[0] + ":" + interval.split(":")[1]
            ) === t
        );
        if (isExist) {
          intervals[t] = isExist.sales;
          intervalsArray.push([t, isExist.sales]);
        } else {
          intervals[t] = 0;
          intervalsArray.push([t, 0]);
        }
      });
      mealData.push({ ...meal, ...intervals });
    });

    return {
      mealData,
      tableColumns: generateTableColumns(sortedTimesData),
    };
  };

  const generateTableData = () => {
    const { timesData, data } = generateServiceTableRawData(formData);

    const graphData = data.map((p) => ({
      id: new Date().getTime(),
      name: p.meal,
      data: Object.keys(p)
        .filter((v) => v !== "meal")
        .map((v) => [v, p[v]]),
    }));

    // add/manage sample data for actual/predicted (realised/target) sales cols.
    data.forEach((d) => {
      let actual_sales = 0,
        predicted_sales = 0;
      Object.keys(d)
        .filter((v) => v !== "meal")
        .map((v) => {
          actual_sales += d[v];
        });
      d.actual_sales = actual_sales / 2;
      d.predicted_sales = actual_sales / 2;
    });

    return { columns: generateTableColumns(timesData), graphData, data };
  };

  let tableColumnsData = [];
  let lineChartData = [];
  let filteredTableData = [];

  const getTopFlopMealsData = async () => {
    setTopFlopLoading(true);
    try {
      let finalEndDate = formData.end_date;
      let finalStartDate = formData.start_date;
    
      // check if any selected time range crosses midnight
      const isCrossMidnight = checkCrossMidnight(formData);
      // Adjust end date if needed
      if (isCrossMidnight?.crossesMidnight) {
        // add 1 day to the end_date
        finalEndDate = moment(formData.end_date).add(1, 'day').format('YYYY-MM-DD');
      }
      const result = await request.get(
        `top-and-flop/meals`,
        {
          restaurant_id: selectedRestaurantId,
          ...(
            isCrossMidnight.crossesMidnight
              ? timezoneFormat(
                  finalStartDate,
                  finalEndDate,
                  selectedRestaurant?.timezone,
                  isCrossMidnight.startTime,
                  isCrossMidnight.endTime
                )
              : timezoneFormat(
                  finalStartDate,
                  finalEndDate,
                  selectedRestaurant?.timezone
                )
          ),
          restaurants: formData.myRestaurants,
          // meals: formData.meals ?? [],
          meals: Array.isArray(formData.meals)
          ? formData?.meals.map((m) => (typeof m === "object" ? m.item_id : m)) // Handle both cases for favourite meals and simple meal
          : [],
          time_ranges: getTimeRanges(formData, selectedRestaurant?.timezone),
          meal_types: formData?.mealTypes ?? [],
          operation: formData?.total ? "total" : "average",
        },
        true,
        true,
        true
      );

      setTopFlopData(result);
      setTopFlopLoading(false);
    } catch (error) {
      if (error.status === 599) {
        // Keep loader true for retry of api request when we change the restaurant
        setLoading(true);
        setTopFlopLoading(true);
        return;
      }
      if (error?.status !== 499) {
        setTopFlopLoading(false);
      }
    }
  };

  const getMealsData = async () => {
    try {
      setMealsLoading(true);
      let finalEndDate = formData.end_date;
      let finalStartDate = formData.start_date;
    
      // check if any selected time range crosses midnight
      const isCrossMidnight = checkCrossMidnight(formData);
      // Adjust end date if needed
      if (isCrossMidnight?.crossesMidnight) {
        // add 1 day to the end_date
        finalEndDate = moment(formData.end_date).add(1, 'day').format('YYYY-MM-DD');
      }
      const result = await request.get(
        `tables/meals`,
        {
          restaurant_id: selectedRestaurantId,
          ...(
            isCrossMidnight.crossesMidnight
              ? timezoneFormat(
                  finalStartDate,
                  finalEndDate,
                  selectedRestaurant?.timezone,
                  isCrossMidnight.startTime,
                  isCrossMidnight.endTime
                )
              : timezoneFormat(
                  finalStartDate,
                  finalEndDate,
                  selectedRestaurant?.timezone
                )
          ),
          restaurants: formData.myRestaurants,
          // meals: formData.meals ?? [],
          meals: Array.isArray(formData.meals)
          ? formData.meals.map((m) => (typeof m === "object" ? m.item_id : m)) // Handle both cases
          : [],
          time_ranges: getTimeRanges(formData, selectedRestaurant?.timezone),
          meal_types: formData?.mealTypes ?? [],
          operation: formData?.total ? "total" : "average",
        },
        true,
        true,
        true
      );
      if(result?.meals?.length === 0) {
        setMealsLoading(false);
        setMealGraphLoading(false);
        setGraphMealsData(() => []);
        setMealsData({...mealsData, meals: []});
        return
      }
      setMealsData(result);
      getMealGraphData(result?.meals[0]?.id);
    } catch (error) {
      if (error.status === 599) {
        // Keep loader true for retry of api request when we change the restaurant
        setMealsLoading(true);
        setMealGraphLoading(true)
        return;
      }
      if (error?.status !== 499) {
        setMealsLoading(false);
        setMealGraphLoading(false)
        setMealsData({...mealsData, meals: []})
      }
    }
  };

  let startDate =
  formData.start_date == START_DATE
    ? DEFAULT_START_DATE
    : formData.start_date;
  let endDate =
  formData.end_date == END_DATE ? DEFAULT_END_DATE : formData.end_date;
  async function getMealGraphData(mealId) {
    try {
      if(!mealId && mealsData?.meals?.length === 0) {
        setMealGraphLoading(false);
        setGraphMealsData([]);
        setMealsLoading(false);
        return
      }
      setMealGraphLoading(true);
      if (isRestaurantLoaded && !hasRetaurants) {
        setGraphMealsData([graphMealsDummy.meals.find(i => i.id === mealId)])
        setMealGraphLoading(false);
        return
      }

      let finalStartDate = startDate;
      let finalEndDate = endDate;
    
      // check if any selected time range crosses midnight
      const isCrossMidnight = checkCrossMidnight(formData);
      // Adjust end date if needed
      if (isCrossMidnight?.crossesMidnight) {
        // add 1 day to the end_date
        finalEndDate = moment(finalEndDate).add(1, 'day').format('YYYY-MM-DD');
      }
      const result2 = await request.get(
        `tables/meals/sales-comparison`,
        {
          restaurant_id: selectedRestaurantId,
          meals: mealId ? [mealId] : [],
          ...(
            isCrossMidnight.crossesMidnight
              ? timezoneFormat(
                  finalStartDate,
                  finalEndDate,
                  selectedRestaurant?.timezone,
                  isCrossMidnight.startTime,
                  isCrossMidnight.endTime
                )
              : timezoneFormat(
                  finalStartDate,
                  finalEndDate,
                  selectedRestaurant?.timezone
                )
          ),
          restaurants: formData.myRestaurants,
          time_ranges: getTimeRanges(formData, selectedRestaurant?.timezone),
          meal_types: formData?.mealTypes ?? [],
          operation: formData?.total ? "total" : "average",
        },
        true,
        true,
        true
      );
      setGraphMealsData(result2.meals);
      setMealGraphLoading(false);
      setMealsLoading(false);
    } catch (error) {
      if (error.status === 599) {
        // Keep loader true for retry of api request when we change the restaurant
        setLoading(true);
        setMealGraphLoading(true);
        return;
      }
      if (error?.status !== 499) {
        setMealGraphLoading(false);
      }
    }
  }
  useEffect(() => {
    if (filteredTableData?.length > 0 && graphMealsData.length > 0) {
      setMealsLoading(false);
      setMealGraphLoading(false);
      setTopFlopLoading(false);
    }
  }, [filteredTableData, graphMealsData]);

  if (
    mealsLoading === false &&
    mealsData?.meals?.length 
    // && graphMealsData.length
  ) {
    const { mealData, ...rest } = parseMealsData(mealsData?.meals);
    tableColumnsData = rest?.tableColumns;
    lineChartData = graphMealsData?.map((item) => ({
      ...item,
      days: parseData(item?.days, selectedRestaurant?.timezone),
    }));
    graphMealsData = [];
    filteredTableData = mealData;
    if (formData.meals.length) {
      const arr = [];
      mealData.filter((meal) => {
        formData.meals.forEach((i) => {
          const mealId = typeof i === "object" ? i.item_id : i; // Handle both cases
          if (meal.id === mealId) {
            arr.push(meal);
          }
        });
      });
      filteredTableData = arr;
    } else {
      filteredTableData = mealData;
    }
  }

  let topFlop = topFlopData;
  if (isRestaurantLoaded && !hasRetaurants) {
    topFlop = topFlopMealsDummy
    let { mealData, ...rest } = parseMealsData(tableMealsDummy?.meals);
    tableColumnsData = rest.tableColumns;
    lineChartData = graphMealsData.length ? graphMealsData.map((item) => ({
      ...item,
      days: parseData(item?.days, selectedRestaurant?.timezone),
    })) :  graphMealsDummy.meals
    if(!isFormDataSame(formData, prevFromData.current)) {
      mealData = mealData.map(item => {
        return {
          ...item,
          actual_sales: getRandomNumber(item.actual_sales-2, item.actual_sales+2),
          predicted_sales: getRandomNumber(item.actual_sales-2, item.actual_sales+2),
        }
      })
      topFlop = {
        top: topFlop.top.map(t => ({...t, sales: getRandomNumber(t.sales-5, t.sales+5)})),
        flop: topFlop.flop.map(t => ({...t, sales: getRandomNumber(t.sales-5, t.sales+5)})),
      }
    }
    graphMealsData = [];
    if (formData.meals.length) {
      const arr = [];
      mealData.filter((meal) => {
        formData.meals.forEach((i) => {
          if (meal.id === i) {
            arr.push(meal);
          }
        });
      });
      filteredTableData = arr;
    } else {
      filteredTableData = mealData;
    }
    filteredTableData = formData.start_date > CURRENT_DATE && formData.end_date > CURRENT_DATE ? filteredTableData.map((i) => ({...i, actual_sales: 0})) : filteredTableData;
  }

  const deleteItem = useCallback(
    (row) => () => setDeletedItems(() => [...deletedItems, row.meal]),
    []
  );

  const renderAboveCuttOff = () => {
    return (
      <div className="leftcontent leftcontent-meals">
        <div className="row second-card">
          <Comparison
            formData={isRestaurantLoaded && !hasRetaurants ? {...formData, start_date: startDate, end_date: endDate} : formData}
            mealsLoading={mealGraphLoading}
            lineChartData={lineChartData}
            filteredTableData={filteredTableData.filter(
              (d) => !deletedItems.includes(d.meal)
            )}
            isTop={isTop}
            setIsTop={setIsTop}
            getMealGraphData={getMealGraphData}
            top={topFlop?.top}
            flop={topFlop?.flop}
            topFlopLoading={topFlopLoading}
            payload={getRequestParams()}
          />
        </div>
        <div className="card first-card mt-25">
          <DetailsTable
            mealsLoading={mealsLoading}
            tableColumns={tableColumnsData}
            filteredTableData={filteredTableData.filter(
              (d) => !deletedItems.includes(d.meal)
            )}
            ref={childRef}
            deleteItem={deleteItem}
            onDownload={onDownload}
            payload={getRequestParams()}
            formData={formData}
          />
        </div>
      </div>
    );
  };

  const renderBelowCuttoff = () => {
    return (
      <>
        <div className="leftcontent leftcontent-meals">
          {isDetailTab && (
            <div className="card h-100">
              <DetailsTable
                mealsLoading={mealsLoading}
                tableColumns={tableColumnsData}
                filteredTableData={filteredTableData.filter(
                  (d) => !deletedItems.includes(d.meal)
                )}
                ref={childRef}
                onDownload={onDownload}
                deleteItem={deleteItem}
                payload={getRequestParams()}
                formData={formData}
              />
            </div>
          )}
          {!isDetailTab && (
            <div className="row h-100">
              <Comparison
                formData={isRestaurantLoaded && !hasRetaurants ? {...formData, start_date: startDate, end_date: endDate} : formData}
                mealsLoading={mealGraphLoading}
                lineChartData={lineChartData}
                filteredTableData={filteredTableData.filter(
                  (d) => !deletedItems.includes(d.meal)
                )}
                isTop={isTop}
                setIsTop={setIsTop}
                getMealGraphData={getMealGraphData}
                top={topFlop?.top}
                flop={topFlop?.flop}
                topFlopLoading={topFlopLoading}
                payload={getRequestParams()}
              />
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      {CUTTOFF_HEIGHT >= height && renderBelowCuttoff()}
      {CUTTOFF_HEIGHT < height && renderAboveCuttOff()}
    </>
  );
}

export default React.memo(LeftSide);
