import { useState, useEffect, useRef, useMemo } from "react";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { Spinner } from "react-bootstrap";
import request from "services/request";
import CustomTable from "components/customTable";
import { DEFAULT_ERROR_MESSAGE } from "common/constants";
import { useUserData } from "contexts/AuthContextManagement";
import { useLoading } from "contexts/LoadingContextManagement";
import { getDummyFilteredData, timezoneFormat, getTimezoneFormatUtc } from "common/utils";
import {
  parseData,
  generateAvgHourlyOccupancy,
  getGuestsOccupancy,
  getOccupancy,
  sumDailyOccupancy,
  getDatesInRange,
  dummyYearlyData,
  dummyMonthlyData,
  dummyWeeklyData
} from "./utils";
import leftDailyOccupancyDummy from "../../data/daily_occupancy.json";
import Comparison from "./comparision";

function LeftYearlyOccupancy({ formData }) {
  const { t } = useTranslation();
  const { setLoading, setError } = useLoading();
  const {
    selectedRestaurantId,
    selectedRestaurant,
    isRestaurantLoaded,
    hasRetaurants,
  } = useUserData();
  const [tableData, setTableData] = useState([]);
  const [dates, setDates] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [graphLoading, setGraphLoading] = useState(true);
  const prevFromData = useRef(formData);

  const formatDate = (dateString) => {
    const date = moment(dateString);
    const formattedDate = date.format("DD/MM"); 
    return formattedDate;
  };
  
  const getDates = (startDate, endDate) => {
    const dates = [];
    let currentDate = moment(startDate); 
    while (currentDate <= moment(endDate)) {
      dates.push(currentDate.format('YYYY-MM-DD'));
      currentDate = currentDate.clone().add(1, 'day'); 
    }
    return dates;
  }

    const formatData = () => {
      const allDates = getDates(formData.start_date, formData.end_date);
      setDates(allDates);
    };

    const getOccupancyColumns = (t, dates) => {
      const renderValueColumn = (column, item, dataIndex) => {
        const colorStyle =  { color: "#000000" };
        const value = item[dates[dataIndex]] ?? 0;
        const fontWeight = "600";
        const fontSize = "18px" ;

        if (item.name == "Forecast") {
          return (
            <div className="forecast-values" style={{ fontSize, fontWeight, color: "#6353ea"}}>
              {`${value}`}
            </div>
          );
        }

        if (item.name == "Actual") {
          return (
            <div className="forecast-values" style={{ fontSize, fontWeight, ...colorStyle }}>
              {`${value}`}
            </div>
          );
        }

        if (item.name == "Year-1") {
          return (
            <div className="forecast-values" style={{ fontSize, fontWeight, color: "rgb(160,160,160)" }}>
              {`${value}`}
            </div>
          );
        }
        if (item.name == "Month-1") {
          return (
            <div className="forecast-values" style={{ fontSize, fontWeight, color: "rgb(160,160,160)" }}>
              {`${value}`}
            </div>
          );
        }
        if (item.name == "Week-1") {
          return (
            <div className="forecast-values" style={{ fontSize, fontWeight, color: "rgb(160,160,160)" }}>
              {`${value}`}
            </div>
          );
        }
      };

      const columns = dates.map((date, index) => {
        const fontSize =  "18px";
        return {
          dataField: date,
          caption: (
              <span className="forecast-values" style={{fontSize, fontWeight: 600, color: "rgb(160,160,160)" }}>{formatDate(date, t)}</span>
          ),
          className: "fw-bold",
          style: { width: "150px", fontSize: "16px", fontWeight: "600 !important",},
          headerStyle: { width: "150px" },
          type: "customRender",
          custom: "events",
          render: (column, item) => renderValueColumn(column, item, index),
      }});

      columns.unshift({
        dataField: "name",
        caption: (
          <span style={{ fontSize: "16px", color: "#000000", fontWeight: "700" }}>{t("")}</span>
        ),
        className: "fw-bold",
        style: { width: "150px", fontSize: "16px", fontWeight: "700" },
        headerStyle: { width: "150px" },
        type: "customRender",
        render: (column, item) => {
        const textFontWeight = item?.name === "Year-1" ? "600" : "700";
        return(
          <span style={{ fontSize: "21px", color: "#000000", fontWeight: textFontWeight }}>
            {t(item?.name)}
          </span>
        )},
      });

    return columns;
  };

  const cols = useMemo(() => getOccupancyColumns(t, dates), [t, formData, dates]);

  const generateTableColumns = (cols) => {
    const newTableColumns = [
      ...cols
        .map(({ caption, dataField, ...rest }) => ({
          ...rest,
          caption: caption,
          dataField,
        }))
    ];
    setTableColumns(newTableColumns);
  }

  useEffect(() => {
    formatData();
  }, [formData]);
  
  useEffect(() => {
    if (dates.length > 0) {
      generateTableColumns(cols);
    }
  }, [dates, cols]);
  
  useEffect(async() => {
    if (selectedRestaurantId !== "" && typeof formData.start_date === "string" && prevFromData.current !== formData) {
      await getYearlyOccupancy(formData.start_date, formData.end_date);
    }
  }, [formData]);

  useEffect(() => {
    if (isRestaurantLoaded && !hasRetaurants) {
      const occupancyByDays = getDummyFilteredData(leftDailyOccupancyDummy, formData, selectedRestaurant?.timezone);
      transformTableData(occupancyByDays);
      let dummyData = null;
  
      // if (formData.year) {
      //   dummyData = dummyYearlyData;
      // } else if (formData.month) {
      //   dummyData = dummyMonthlyData;
      // } else if (formData.week) {
      //   dummyData = dummyWeeklyData;
      // }
  
      // if (dummyData) {
      //   setTableData(dummyData);
      // }
  
      setGraphLoading(false);
    }
  }, [formData, isRestaurantLoaded, hasRetaurants]);
  
  const transformTableData = (dailyOccupancies, comparisonOccupancies = []) => {
    const forecastData = { name: "Forecast" };
    const actualData = { name: "Actual" };
    const comparisonData = {
      name: formData.month ? "Month-1" : formData.week ? "Week-1" : "Year-1",
    };
    // Process dailyOccupancies
    dailyOccupancies.forEach((ele) => {
      const formattedDate = moment(ele.date).format("YYYY-MM-DD");
      const { total_actual_occupancy, total_predicted_occupancy } = getOccupancy({
        occupancy: ele.occupancy,
      });
      forecastData[formattedDate] = total_predicted_occupancy;
      actualData[formattedDate] = total_actual_occupancy;
    });
    comparisonOccupancies.forEach((ele) => {
      let adjustedDate = moment(ele.date);
      if (formData.month) {
        // Move to the next month, keeping the same day
        adjustedDate = adjustedDate.add(1, "months");
      } else if (formData.week) {
        // Move to the next week
        adjustedDate = adjustedDate.add(1, "weeks");
      } else if (formData.year) {
        // Move to the next year
        adjustedDate = adjustedDate.add(1, "years");
      }
      const formattedAdjustedDate = adjustedDate.format("YYYY-MM-DD");
      const { total_comparison_occupancy } = getOccupancy({
        occupancy: [],
        comparisonOccupancy: ele.occupancy,
      });
      comparisonData[formattedAdjustedDate] = total_comparison_occupancy;
    });
    const finalData = [forecastData, actualData, comparisonData];
    setTableData(finalData);
  };
  
  const getYearlyOccupancy = async (startDate, endDate) => {
    if (!selectedRestaurantId) return;
    setLoading(true);
    setGraphLoading(true);

    try {
      const timezoneFormattedDates = getTimezoneFormatUtc(startDate, endDate, selectedRestaurant?.timezone);
      const comparisonDates = formData?.comparison_start_date && formData?.comparison_end_date
        ? getTimezoneFormatUtc(formData.comparison_start_date, formData.comparison_end_date, selectedRestaurant?.timezone)
        : {};
  
      const result = await request.get(
        "occupancy",
        {
          start_date: timezoneFormattedDates.start_date,
          end_date: timezoneFormattedDates.end_date,
          ...(comparisonDates.start_date && { comparison_start_date: comparisonDates.start_date }),
          ...(comparisonDates.end_date && { comparison_end_date: comparisonDates.end_date }),
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

      const comparison_occupancy = parseData(
        result.comparison_data,
        selectedRestaurant?.timezone
      );
      
      transformTableData(occupancyByDays, comparison_occupancy);
      setGraphLoading(false);
      setLoading(false);
    } catch (error) {
      if (error?.status !== 499) {
        setError(DEFAULT_ERROR_MESSAGE);
        setLoading(false);
      }
    }
  };

  return (
    <div className="leftcontent leftcontent-occupancy">
      <div className="main-container">
        <div className="card">
          <div className="card-body-custom">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h2 style={{ color: "#6353ea", fontSize: "21px", fontWeight: "800"}}>{t("Yearly occupancy")}</h2>
            </div>
            <div className="card-body">
              {graphLoading ? (
                <div className="w-100 d-flex justify-content-center card-spinner-container">
                  <Spinner animation="border" variant="primary" />
                </div>
               ) : (
                 <CustomTable columns={tableColumns} data={tableData} />
              )}
            </div>
          </div>
        </div>
        <div className="card graph-card">
          <div className="card-body">
            {graphLoading ? (
              <div className="w-100 d-flex justify-content-center card-spinner-container">
                <Spinner animation="border" variant="primary" />
              </div>
              ) : (
              <Comparison
                formData={isRestaurantLoaded && !hasRetaurants ? {...formData, start_date: formData.start_date, end_date: formData.end_date} : formData}
                lineChartData={tableData}
              />       
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeftYearlyOccupancy;