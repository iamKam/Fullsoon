import { useState, useEffect, useRef } from "react";
import moment from "moment";
import { useTranslation } from "react-i18next";

import request from "services/request";
import LineChart from "components/lineChart";
import BarChart from "components/barChart";
import CustomTable from "components/customTable";
import { DEFAULT_ERROR_MESSAGE } from "common/constants";
import { useUserData } from "contexts/AuthContextManagement";
import { useLoading } from "contexts/LoadingContextManagement";
import { getRandomNumber, occupancyTableColumns as tableColumns } from "./data";
import { getDummyFilteredData, timezoneFormat } from "common/utils";
import {
  parseData,
  generateAvgHourlyOccupancy,
  getGuests,
  sumDailyOccupancy,
  getDatesInRange,
} from "./utils";
import occupancyGuestsDummy from "../../data/occupancy_guests.json";

const VIZ_TYPES = { GRAPH: "graph", TABLE: "table" };

const VIZ_BUTTONS = [
  { type: VIZ_TYPES.GRAPH, label: "Graph" },
  { type: VIZ_TYPES.TABLE, label: "Table" },
];

function LeftSide({ formData }) {
  const { t } = useTranslation();
  const { setLoading, setError } = useLoading();
  const {
    selectedRestaurantId,
    selectedRestaurant,
    isRestaurantLoaded,
    hasRetaurants,
  } = useUserData();
  const [vizType, setVizType] = useState(VIZ_TYPES.GRAPH);
  const [lineChartData, setLineChartData] = useState([]);
  const [barChartData, setBarChartData] = useState({});
  const [tableData, setTableData] = useState([]);
  const prevFromData = useRef(formData)
  const updateLanguage = localStorage.getItem('fullsoon_i18nextLng');

  // useEffect(() => {
  //   if (typeof formData.start_date === "string") {
  //     getDailyOccupancy(formData.start_date, formData.end_date);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [formData, selectedRestaurantId, isRestaurantLoaded]);

  useEffect(async() => {
    if (selectedRestaurantId !== "" && typeof formData.start_date === "string" && prevFromData.current !== formData) {
      await getDailyOccupancy(formData.start_date, formData.end_date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, updateLanguage]);

  useEffect(()=> {
    if (isRestaurantLoaded && !hasRetaurants) {
       const occupancyByDays = getDummyFilteredData(occupancyGuestsDummy,formData, selectedRestaurant?.timezone)
       transformTableData(occupancyByDays);
       setLineChartData(() => sumDailyOccupancy(occupancyByDays, formData));
       setBarChartData(
         generateAvgHourlyOccupancy(
           occupancyByDays,
           formData,
           selectedRestaurant
         )
       );
    }
  },[formData,isRestaurantLoaded, hasRetaurants])

  const transformTableData = (dailyOccupancies) => {
    const finalData = dailyOccupancies.map((ele) => {
      // Extract the month from the date and translate it
      const formattedDate = moment(ele.date).format("DD MMMM YYYY");
      const month = moment(ele.date).format("MMMM");
      const translatedMonth = t(month);
  
      // Replace the month in the formatted date with the translated month
      const translatedDate = formattedDate.replace(month, translatedMonth);
      return {
        date: translatedDate,
        ...getGuests(ele),
      };
    });
    setTableData(finalData);
  };

  const getDataBetweenDates = () => {
    const start_date = moment(formData.start_date);
    const end_date = moment(formData.end_date);
    let loop = moment(formData.start_date);
    while (loop.isBefore(end_date) || loop.isSame(end_date)) {
      const day = Number(loop.format("DD"));
      loop = loop.add(1, "day");
    }
  };

  const getDailyOccupancy = async (startDate, endDate) => {
    
    if (selectedRestaurantId === "") {
      return;
    }

    setLoading(true);

    try {
      const result = await request.get(
        "occupancy/guests",
        {
          ...timezoneFormat(startDate, endDate, selectedRestaurant?.timezone),
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
      setLineChartData(() => sumDailyOccupancy(occupancyByDays, formData));
      setBarChartData(
        generateAvgHourlyOccupancy(
          occupancyByDays,
          formData,
          selectedRestaurant
        )
      );
      setLoading(false);
    } catch (error) {
      console.log(error);
      if (error?.status !== 499) {
        setError(DEFAULT_ERROR_MESSAGE);
        setLoading(false);
      }
    }
  };

  const vizChanged = (type) => () => setVizType(type);

  let selectedTableColumns = tableColumns.map((c) => ({
    ...c,
    caption: t(c.caption),
  }));
  const filteredTableColumns = tableColumns.filter((c) =>
    Object.keys(formData)
      .filter((f) => formData[f])
      .includes(c.dataField)
  );

  if (filteredTableColumns.length) {
    selectedTableColumns = [tableColumns[0], ...filteredTableColumns];
  }

  return (
    <div className="leftcontent leftcontent-occupancy">
      <div className="main-container">
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between card-navbtns border-bottom">
            <h2>{t("DailyOccupancy")}</h2>
            <ul className="navbtns">
              {VIZ_BUTTONS.map((viz, i) => (
                <li
                  key={i}
                  className={`${vizType === viz.type ? "active" : ""}`}
                >
                  <button
                    className={`nav-link btn-link ${
                      vizType === viz.type ? "active" : ""
                    }`}
                    onClick={vizChanged(viz.type)}
                  >
                    {t(viz.label)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-body">
            {vizType === VIZ_TYPES.GRAPH && (
              <LineChart
                data={lineChartData}
                dateTimeFormatter="DD/MM"
                extendedDate={new Date(moment().format("YYYY-MM-DD")) / 1000}
              />
            )}
            {vizType === VIZ_TYPES.TABLE && (
              <CustomTable columns={selectedTableColumns} data={tableData} />
            )}
          </div>
        </div>
        <div className="second-card">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h2>{t("AverageHourlyOccupancy")}</h2>
            </div>
            <div className="card-body">
              <BarChart data={barChartData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeftSide;
