import { useState, useEffect, useRef } from "react";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { Spinner } from "react-bootstrap";

import request from "services/request";
import CustomTable from "components/customTable";
import { DEFAULT_ERROR_MESSAGE, TIME_DURATIONS } from "common/constants";
import { useUserData } from "contexts/AuthContextManagement";
import { useLoading } from "contexts/LoadingContextManagement";
// occupancyTableColumns2 as tableColumns,
import { getDummyFilteredData, getTimezoneFormatUtc } from "common/utils";
import { parseData, getGuestsOccupancy } from "./utils";
import { generateOccupancyTableRawData } from "./data";
import leftDailyOccupancyDummy from "../../data/daily_occupancy.json";

function LeftDailyOccupancy({ formData, setHasOutsideServiceSlot }) {
  const { t } = useTranslation();
  const { setLoading, setError } = useLoading();
  const {
    selectedRestaurantId,
    selectedRestaurant,
    isRestaurantLoaded,
    hasRetaurants,
  } = useUserData();

  const prevFromData = useRef(formData);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [intervalTableData, setIntervalTableData] = useState([]);
  const [timeFiltersLoaded, setTimeFiltersLoaded] = useState(false);
  const updateLanguage = localStorage.getItem('fullsoon_i18nextLng');

  useEffect(async() => {
    if (selectedRestaurantId !== "" && typeof formData.start_date === "string" && prevFromData.current !== formData) {
      await getDailyOccupancy(formData.start_date, formData.end_date);
    }
  }, [formData, updateLanguage]);

  useEffect(()=> {
    if (isRestaurantLoaded && !hasRetaurants) {
      const occupancyByDays = getDummyFilteredData(leftDailyOccupancyDummy, formData, selectedRestaurant?.timezone);
      transformTableData(occupancyByDays);
      parseIntervalOccData(occupancyByDays);
      setDailyLoading(false);
    }
  },[formData, isRestaurantLoaded, hasRetaurants])


  const transformTableData = (dailyOccupancies) => {
    // Check if outsideServiceTimeslot is selected
    const isOutsideServiceSelected = formData.outsideServiceTimeslot === true;
    
    // Check if any regular meal service is selected
    const hasSelectedMealService = ['breakfast', 'lunch', 'afternoon', 'dinner']
      .some(meal => formData[meal] === true);

    // Get all selected services
    const selectedServices = Object.keys(formData).filter(
      key => formData.timeDurations[key] && formData[key] === true
    );

    // Determine which services to consider for totals
    let servicesForTotals;
    if (isOutsideServiceSelected && !hasSelectedMealService) {
      // Only outsideServiceTimeslot is selected
      servicesForTotals = ['outsideServiceTimeslot'];
    } else if (hasSelectedMealService) {
      // Regular meal services are selected (may include outsideServiceTimeslot)
      servicesForTotals = selectedServices.filter(service => service !== 'outsideServiceTimeslot');
    } else {
      // No services selected - default to all meal services (excluding outsideServiceTimeslot)
      servicesForTotals = ['breakfast', 'lunch', 'afternoon', 'dinner'];
    }

    const processedOccupancyData = dailyOccupancies.map((ele, index) => {
      // Get next day's data if available
      const nextDay = index < dailyOccupancies.length - 1 ? dailyOccupancies[index + 1] : null;
  
      // Filter current day's intervals for totals
      const filteredCurrentDayForTotals = ele?.occupancy?.filter((item) => {
        return servicesForTotals?.some((meal) => {
          const range = formData?.timeDurations?.[meal]?.[0];
          if (!range) return false;

          if (meal === "outsideServiceTimeslot") {
            // Handle multiple ranges for outsideServiceTimeslot
            return range.split(',').some(timeRange => {
              const [startTime, endTime] = timeRange.split('-');
              const startMoment = moment(startTime, "HH:mm");
              const endMoment = moment(endTime, "HH:mm");
              const itemMoment = moment(item.interval, "HH:mm:ss");
              
              return itemMoment.isBetween(startMoment, endMoment, null, "[]");
            });
          }

          const [startTime, endTime] = range.split('-');
          const startMoment = moment(startTime, "HH:mm");
          const endMoment = moment(endTime, "HH:mm");
          const itemMoment = moment(item.interval, "HH:mm:ss");

          // For normal ranges (start <= end)
          if (startMoment.isSameOrBefore(endMoment)) {
            return itemMoment.isBetween(startMoment, endMoment, null, "[]");
          }
          // For midnight-crossing ranges (start > end)
          else {
            return itemMoment.isSameOrAfter(startMoment);
          }
        });
      }) || [];

      // Filter next day's intervals ONLY for midnight-crossing ranges (for totals)
      let filteredNextDayForTotals = [];
      if (nextDay) {
        filteredNextDayForTotals = nextDay.occupancy?.filter((item) => {
          return servicesForTotals.some((meal) => {
            // Skip outsideServiceTimeslot for next day as it's already handled in current day
            if (meal === "outsideServiceTimeslot") return false;
            
            const range = formData?.timeDurations?.[meal]?.[0];
            if (!range) return false;

            const [startTime, endTime] = range.split('-');
            const startMoment = moment(startTime, "HH:mm");
            const endMoment = moment(endTime, "HH:mm");
            const itemMoment = moment(item.interval, "HH:mm:ss");
            
            // Only include if it's a midnight-crossing range and time is before end time
            return startMoment.isAfter(endMoment) && 
                  itemMoment.isSameOrBefore(endMoment);
          });
        }) || [];
      }

      // Combine current and next day intervals for totals
      const allFilteredForTotals = [...filteredCurrentDayForTotals, ...filteredNextDayForTotals];

      // Calculate totals using only the selected service intervals
      const totalActualOccupancy = allFilteredForTotals?.reduce(
        (sum, item) => sum + (item.actual_occupancy || 0),
        0
      );

      const totalPredictedOccupancy = allFilteredForTotals?.reduce(
        (sum, item) => sum + (item.predicted_occupancy || 0),
        0
      );

      // Format date
      const formattedDate = moment(ele.date).format("DD MMM. YYYY").toUpperCase();
      const month = moment(ele.date).format("MMMM");
      const translatedMonth = t(month);
      const translatedDate = formattedDate.replace(month, translatedMonth);

      return {
        date: translatedDate,
        total_actual_occupancy: totalActualOccupancy,
        total_predicted_occupancy: totalPredictedOccupancy,
        ...getGuestsOccupancy(ele, formData.timeDurations, dailyOccupancies, index)
      };
    });

    setTableData(processedOccupancyData);
    setIntervalTableData(processedOccupancyData);
  };

  const getDailyOccupancy = async (startDate, endDate) => {
    if (selectedRestaurantId === "") {
      return;
    }
    setDailyLoading(true);
    try {
      const result = await request.get(
        "occupancy",
        {
          start_date: getTimezoneFormatUtc(startDate, endDate, selectedRestaurant?.timezone)?.start_date,
          end_date: getTimezoneFormatUtc(startDate, endDate, selectedRestaurant?.timezone)?.end_date,
          restaurant_id: selectedRestaurantId,
        },
        true,
        true,
        true
      );
      const occupancyByDays = parseData(
        result.days,
        selectedRestaurant?.timezone
      );

      transformTableData(occupancyByDays);
      parseIntervalOccData(occupancyByDays);
      setDailyLoading(false);
    } catch (error) {
      if (error?.status !== 499) {
        setError(DEFAULT_ERROR_MESSAGE);
        setLoading(false);
        setDailyLoading(false);
      }
    }
  };

  const generateDailyColumns = () => {
    const today = moment().startOf("day");

    const hideMealsColumns = [
      "breakfast", "lunch", "afternoon", "dinner", "outsideServiceTimeslot"
    ].some(meal => formData[meal]);

    const getTextColor = (date) => {
      const formattedDate = moment(date, "DD MMMM YYYY").startOf("day");
      return formattedDate.isSameOrAfter(today, 'day') ? "rgb(160,160,160)" : "#000000";
    };

    return [
      {
        dataField: "date",
        caption: "Date",
        style: { width: "150px", textAlign: "center", color: "#000000", fontWeight: "700" },
        headerClassName: "text-center",
        headerStyle: {
          width: "150px",
          fontWeight: "700",
          textAlign: "center",
          fontSize: "19px"
        },
        alignment: "center"
      },
      {
        dataField: "total_actual_occupancy",
        caption: t("TOTAL") + "\n" + t("Actual"),
        className: "text-center",
        headerClassName: "text-center actual-header",
        headerStyle: {
          fontWeight: "600",
          textAlign: "center",
          fontSize: "19px",
          whiteSpace: "pre-line"
        },
        type: "customRender",
          render: (column, item) => {
            return (
              <span style={{ fontSize: "17px", fontWeight: "600" }}>
                {item?.total_actual_occupancy}
              </span>
            );
          }
      },
      {
        dataField: "total_predicted_occupancy",
        caption: t("TOTAL") + "\n" + t("Predicted"),
        className: "text-center",
        headerClassName: "text-center predicted-header",
        headerStyle: {
          fontWeight: "600",
          textAlign: "center",
          fontSize: "19px",
          whiteSpace: "pre-line"
        },
        type: "customRender",
          render: (column, item) => {
            return (
              <span style={{ fontSize: "17px", color: "#873CFC", fontWeight: "600" }}>
                {item?.total_predicted_occupancy}
              </span>
            );
          }
      },
      {
        dataField: "accuracy",
        caption: `${t("Accuracy")} (%)`,
        className: "text-center",
        headerClassName: "text-center",
        headerStyle: {
          fontWeight: "700",
          textAlign: "center",
          fontSize: "19px"
        },
        type: "customRender",
        render: (column, item) => {
          const actualOccupancy = item?.total_actual_occupancy ?? 0;
          const predictedOccupancy = item?.total_predicted_occupancy ?? 0;

          const accuracy_occupancy = (actualOccupancy !== 0 && predictedOccupancy !== 0) && 
            (actualOccupancy - predictedOccupancy) < actualOccupancy
            ? Math.max(0, (1 - Math.abs((predictedOccupancy - actualOccupancy) / (predictedOccupancy + actualOccupancy))) * 100)
            : 0;

          return (
            <label className={accuracy_occupancy >= 75 ? "text-green" : accuracy_occupancy >= 65 ? "text-orange" : "text-danger"} style={{ fontSize: "17px", fontWeight: "600" }}>
              {parseFloat(accuracy_occupancy).toFixed(2)}
            </label>
          );
        },
      },
      ...(hideMealsColumns && tableData.length > 0 ? [] : [
        {
          dataField: "breakfast",
          caption: t("Breakfast"),
          className: "text-center",
          headerClassName: "text-center",
          headerStyle: {
            fontWeight: "700",
            textAlign: "center",
            fontSize: "19px"
          },
          type: "customRender",
          render: (column, item) => {
            return (
              <span style={{ fontSize: "17px", color: getTextColor(item.date), fontWeight: "600" }}>
                {item?.breakfast}
              </span>
            );
          }
        },
        {
          dataField: "lunch",
          caption: t("Lunch"),
          className: "text-center",
          headerClassName: "text-center",
          headerStyle: {
            fontWeight: "700",
            textAlign: "center",
            fontSize: "19px"
          },
          type: "customRender",
          render: (column, item) => {
            return (
              <span style={{ fontSize: "17px", color: getTextColor(item.date), fontWeight: "600" }}>
                {item?.lunch}
              </span>
            );
          }
        },
        {
          dataField: "afternoon",
          caption: t("Afternoon"),
          className: "text-center",
          headerClassName: "text-center",
          headerStyle: {
            fontWeight: "700",
            textAlign: "center",
            fontSize: "19px"
          },
          type: "customRender",
          render: (column, item) => {
            return (
              <span style={{ fontSize: "17px", color: getTextColor(item.date), fontWeight: "600" }}>
                {item?.afternoon}
              </span>
            );
          }
        },
        {
          dataField: "dinner",
          caption: t("Dinner"),
          className: "text-center",
          headerClassName: "text-center",
          headerStyle: {
            fontWeight: "700",
            textAlign: "center",
            fontSize: "19px"
          },
          type: "customRender",
          render: (column, item) => {
            return (
              <span style={{ fontSize: "17px", color: getTextColor(item.date), fontWeight: "600" }}>
                {item?.dinner}
              </span>
            );
          }
        }
      ])
    ];
  }
  
  const generateIntervalColumns = () => {
    const today = moment().startOf("day");

    if (intervalTableData.length === 0) return [];

    // Get all available time intervals from the first data item
    const timeColumns = Object.keys(intervalTableData[0]).filter(key => key.match(/^\d{2}:\d{2}$/));

    // Extract selected services from formData
    const selectedServices = Object.keys(formData).filter(
      service => formData[service] && formData.timeDurations[service]
    );

    // If no services are selected, show all intervals
    if (selectedServices.length === 0) {
      return timeColumns.map(columnName => createIntervalColumn(columnName, today));
    }

    // Get allowed time slots based on selected services
    const allowedTimes = new Set();
    
    selectedServices.forEach(service => {
    const timeRanges = formData.timeDurations[service];
    
    if (!timeRanges || timeRanges.length === 0) return;

    // Handle each time range for the service
    timeRanges.forEach(range => {
      if (service === "outsideServiceTimeslot") {
        // Split multiple ranges for outsideServiceTimeslot
        const subRanges = range.split(',');
        subRanges.forEach(subRange => {
          const [start, end] = subRange.split('-');
          let current = moment(start, "HH:mm");
          const endMoment = moment(end, "HH:mm");
          
          while (current.isSameOrBefore(endMoment)) {
            allowedTimes.add(current.format("HH:mm"));
            current.add(30, 'minutes');
          }
        });
      } else {
        // Handle regular services (breakfast, lunch, etc.)
        const [start, end] = range.split('-');
        const startMoment = moment(start, "HH:mm");
        const endMoment = moment(end, "HH:mm");

        timeColumns.forEach(time => {
          const timeMoment = moment(time, "HH:mm");
          
          if (startMoment.isAfter(endMoment)) {
            // Handle midnight-crossing range
            if (timeMoment.isSameOrAfter(startMoment) || timeMoment.isSameOrBefore(endMoment)) {
              allowedTimes.add(time);
            }
          } else {
            // Normal range
            if (timeMoment.isBetween(startMoment, endMoment, null, "[]")) {
              allowedTimes.add(time);
            }
          }
        });
      }
    });
  });

  // Custom sorting function for midnight-crossing ranges
  const sortedTimes = Array.from(allowedTimes).sort((a, b) => {
    const aMoment = moment(a, "HH:mm");
    const bMoment = moment(b, "HH:mm");
      
    // Check if any selected service has a midnight-crossing range
    const hasMidnightRange = selectedServices.some(service => {
        const timeRanges = formData.timeDurations[service];
        return timeRanges.some(range => {
            if (service === "outsideServiceTimeslot") return false;
            const [start, end] = range.split('-');
            return moment(start, "HH:mm").isAfter(moment(end, "HH:mm"));
        });
    });
      
    if (hasMidnightRange) {
        // For midnight-crossing services, times after the start time come first
        const startTime = selectedServices.map(service => {
            const timeRanges = formData.timeDurations[service];
            return timeRanges.map(range => {
                const [start] = range.split('-');
                return moment(start, "HH:mm");
            });
        }).flat().sort((a, b) => b - a)[0]; // Get the latest start time
        
        if (aMoment.isSameOrAfter(startTime) && bMoment.isSameOrAfter(startTime)) {
            return aMoment.diff(bMoment);
        } else if (aMoment.isSameOrAfter(startTime)) {
            return -1;
        } else if (bMoment.isSameOrAfter(startTime)) {
            return 1;
        } else {
            return aMoment.diff(bMoment);
        }
    } else {
        // Normal sorting for non-midnight ranges
        return aMoment.diff(bMoment);
    }
  });
  return sortedTimes.map(columnName => createIntervalColumn(columnName, today));
  };

  // Helper function to create column configuration
  const createIntervalColumn = (columnName, today) => ({
    dataField: columnName,
    caption: columnName,
    className: "text-center",
    headerClassName: "text-center",
    headerStyle: {
      fontWeight: "700",
      textAlign: "center",
      fontSize: "19px",
    },
    type: "customRender",
    render: (column, item) => {
      const textColor = moment(item.date, "DD MMMM YYYY").isSameOrAfter(today, "day") 
        ? "rgb(160,160,160)" 
        : "#000000";
      return (
        <span style={{ fontSize: "17px", color: textColor, fontWeight: "600" }}>
          {item[columnName]}
        </span>
      );
    }
  });

  // Update parseIntervalOccData to maintain consistent date format
  const parseIntervalOccData = (occupancy) => {
    const { timesData } = generateOccupancyTableRawData(formData, `minute`, 30);

    const updatedData = occupancy?.map((ele, index) => {
      const occupancyData = {
        date: moment(ele.date).format("DD MMMM YYYY"), // Consistent date format
      };

      // Convert current day's occupancy to map
      const occupancyMap = {};
      ele.occupancy.forEach(occData => {
        const formattedInterval = occData.interval.slice(0, 5);
        occupancyMap[formattedInterval] = occData.occupancy;
      });

      // Identify services that cross midnight (start > end)
      const midnightCrossingServices = Object.keys(formData.timeDurations).filter(service => {
        if (service === "allDay" || service === "outsideServiceTimeslot") return false;
        const [start, end] = formData.timeDurations[service];
        return moment(start, "HH:mm").isAfter(moment(end, "HH:mm"));
      });

      // Only process next day if there are actual midnight-crossing services selected
      const selectedMidnightServices = midnightCrossingServices.filter(
        service => formData[service] || (Object.keys(formData).length === 0)
      );

      if (selectedMidnightServices.length > 0 && index < occupancy.length - 1) {
        const nextDay = occupancy[index + 1];
        nextDay.occupancy.forEach(occData => {
          const formattedInterval = occData.interval.slice(0, 5);
          const timeMoment = moment(formattedInterval, "HH:mm");
          
          // Only include times that are part of selected midnight-crossing ranges
          selectedMidnightServices.forEach(service => {
            const [_, end] = formData.timeDurations[service];
            const endMoment = moment(end, "HH:mm");
            if (timeMoment.isSameOrBefore(endMoment)) {
              occupancyMap[formattedInterval] = occData.occupancy;
            }
          });
        });
      }

      // Fill missing intervals with 0
      timesData.forEach(interval => {
        const formattedInterval = interval.slice(0, 5);
        if (occupancyMap[formattedInterval] === undefined) {
          occupancyMap[formattedInterval] = 0;
        }
      });

      return { ...occupancyData, ...occupancyMap };
    });

    setIntervalTableData(updatedData || []);
  };

  let selectedDailyColumns = generateDailyColumns();
  let selectedDailyIntervalColumns = generateIntervalColumns();

  return (
    <div className="leftcontent leftcontent-occupancy">
      <div className="main-container">
        <div className="card" style={{ height: "100%" }}>
          <div className="card-header d-flex align-items-center justify-content-between card-navbtns border-bottom">
            <h2 className="daily-occupancy-heading">{t("Daily occupancy")}</h2>
          </div>
          <div className="card-body">
            {dailyLoading ? (
              <div className="w-100 d-flex justify-content-center card-spinner-container">
                <Spinner animation="border" variant="primary" />
              </div>
              ) : (
              <div className="occupancy-wrapper">
                <div className="occupancy-flex-wrapper">
                  <div style={{ 
                      width: (formData.breakfast || formData.lunch || formData.afternoon || formData.dinner)  && tableData.length > 0 ? "47%" : "100%"
                    }}>
                    <CustomTable columns={selectedDailyColumns} data={tableData} tableName="dailyOccupancy"/>
                  </div>

                  {/* Line Divider */}
                  {(formData.breakfast || formData.lunch || formData.afternoon || formData.dinner) &&
                    tableData.length > 0 && (
                      <div className="occupancy-divider" />
                  )}

                  {(formData.breakfast || formData.lunch || formData.afternoon || formData.dinner || formData.outsideServiceTimeslot) && tableData.length > 0 && (
                    <div className="interval-occupancy-table">
                      <CustomTable columns={selectedDailyIntervalColumns} data={intervalTableData} tableName="dailyOccupancy1" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeftDailyOccupancy;