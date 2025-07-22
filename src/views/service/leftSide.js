import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import request from "services/request";
import useWindowSize from "customHooks/useWindowResize";
import useRestaurantTimezone from "customHooks/useRestaurantTimezone";
import {
  CUTTOFF_HEIGHT,
  DEFAULT_ERROR_MESSAGE,
  SAMPLE_TOP_FLOPS,
} from "common/constants";
import { getTimeRanges } from "common/utils";
import { useUserData } from "contexts/AuthContextManagement";
import { useLoading } from "contexts/LoadingContextManagement";

import Comparison from "./comparison";
import DetailsTable from "./detailsTable";

import {
  generateServiceLineChartRawData,
  generateServiceTableRawData,
  getRandomNumber,
} from "../occupancy/data";

import AddIcon from "assets/images/add.png";

function ActionColumn({ x: y }, ...args) {
  return function (x, bb) {
    return (
      <div>
        <button
          onClick={y(x)}
          style={{ background: "transparent", border: "none" }}
        >
          <img src={AddIcon} alt="" />
        </button>
      </div>
    );
  };
}

function LeftSide({ formData, isTableTab }) {
  const [, height] = useWindowSize();
  const { t } = useTranslation();
  const { convertTimezone } = useRestaurantTimezone();
  const [lineChartData, setLineChartData] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [filteredTableData, setFilteredTableData] = useState([]);
  const [isTop, setIsTop] = useState(true);
  const [topFlop, setTopFlop] = useState({ top: [], flop: [] });
  const { setError } = useLoading();
  const {
    selectedRestaurant,
    selectedRestaurantId,
    isRestaurantLoaded,
    hasRetaurants,
  } = useUserData();

  // useEffect(() => {
  //   if (isRestaurantLoaded && !hasRetaurants) {
  //     setSampleTopFlop();
  //   }
  //   generateLineChartData();
  //   generateTableData();
  //   if (selectedRestaurantId !== "") {
  //     getTopFlop();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [formData, selectedRestaurantId, isRestaurantLoaded]);

  useEffect(() => {
    if (selectedRestaurantId !== "") {
      generateLineChartData();
      generateTableData();
      getTopFlop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const setSampleTopFlop = () => {
    const mapper = (t) => ({
      ...t,
      product: t.meal,
      serving_minutes: getRandomNumber(100, 1000),
    });
    setTopFlop({
      top: SAMPLE_TOP_FLOPS.TOP.map(mapper),
      flop: SAMPLE_TOP_FLOPS.FLOP.map(mapper),
    });
  };

  //get top and flop finance
  const getTopFlop = async () => {
    try {
      const payload = {
        restaurant_id: selectedRestaurantId,
        start_date: convertTimezone(new Date(formData.start_date)),
        end_date: convertTimezone(new Date(formData.end_date)),
        time_ranges: getTimeRanges(formData, selectedRestaurant?.timezone),
      };
      const result = await request.get("top-and-flop/serving-time", payload);

      setTopFlop({ top: result.top, flop: result.flop });
    } catch (error) {
      setError(DEFAULT_ERROR_MESSAGE);
    }
  };

  const generateLineChartData = () => {
    setLineChartData(generateServiceLineChartRawData(formData));
  };

  const deleteItem = (row) => (e) => {
    let newTableData = filteredTableData.filter(
      (f) => f.meal.toLowerCase() !== row.meal.toLowerCase()
    );
    setFilteredTableData(() => newTableData);
  };

  const generateTableData = () => {
    const { timesData, data } = generateServiceTableRawData(formData);
    const newRawTableData = [
      {
        dataField: "meal",
        caption: t("Meal"),
        className: "fw-bold",
        style: { width: "150px" },
        headerStyle: { width: "150px" },
      },
      ...timesData.map((t) => ({
        dataField: t,
        caption: t,
        className: "text-center",
        headerClassName: "text-center",
        isLower: (params) => (params < 10 ? "text-danger" : ""),
        isHigher: (params) => (params > 50 ? "text-success" : ""),
      })),
      {
        dataField: "action",
        caption: "",
        className: "text-center",
        headerClassName: "text-center",
        elem: ActionColumn({ x: deleteItem }).bind(filteredTableData),
      },
    ];
    setTableColumns(newRawTableData);
    setFilteredTableData(() => [...data]);
  };

  const filterTableData = (_tableData) =>
    _tableData.filter((f) =>
      (formData.meals ?? [])
        .map((m) => m.toLowerCase())
        .includes(f.meal.toLowerCase())
    );

  const renderAboveCuttOff = () => {
    return (
      <div className="leftcontent leftcontent-service">
        <div className="card first-card">
          <DetailsTable
            tableColumns={tableColumns}
            filterTableData={filterTableData}
            filteredTableData={filteredTableData}
            deleteItem={deleteItem}
          />
        </div>

        <div className="row second-card">
          <Comparison
            lineChartData={lineChartData}
            isTop={isTop}
            setIsTop={setIsTop}
            top={topFlop?.top}
            flop={topFlop?.flop}
          />
        </div>
      </div>
    );
  };

  const renderBelowCuttoff = () => {
    return (
      <>
        <div className="leftcontent leftcontent-service">
          {isTableTab && (
            <div className="card h-100">
              <DetailsTable
                tableColumns={tableColumns}
                filterTableData={filterTableData}
                filteredTableData={filteredTableData}
                deleteItem={deleteItem}
              />
            </div>
          )}
          {!isTableTab && (
            <div className="row h-100">
              <Comparison
                lineChartData={lineChartData}
                isTop={isTop}
                setIsTop={setIsTop}
                top={topFlop?.top}
                flop={topFlop?.flop}
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

export default LeftSide;
