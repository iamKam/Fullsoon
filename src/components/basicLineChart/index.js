import React, { useEffect, useRef, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Select from "react-select";
import { useTranslation } from "react-i18next";

import "./index.scss";
import { useUserData } from "contexts/AuthContextManagement";
import moment from "moment";
import { isFormDataSame } from "views/meals/utils";
import { getRandomNumber } from "views/occupancy/data";
import { getDummyFilteredData, replaceEmojis } from "common/utils";

const DEFAULT_VISIBLE_LINES = 0;

let options = {
  chart: {
    zoomType: "x",
  },
  legend: {
    layout: "horizontal",
    align: "left",
    verticalAlign: "top",
    floating: false,
    maxHeight: 70,
    width: "100%",
    itemWidth: 150,
  },
  title: {
    text: "",
  },
  xAxis: {
    type: "category",
    lineColor: "#ffffff",
    tickLength: 0,
  },
  yAxis: {
    title: {
      text: "",
    },
    visible: true,
    gridLineColor: "#fff",
  },
  tooltip: {
    backgroundColor: "#FFF",
    borderColor: "#D8D8D8",
    borderRadius: 4,
    formatter: function () {
      return `
          <label style="font-size: 10px;line-height: 14px;color: #8B8F94">${this.key}</label>
          <label style="color:#D8D8D8;" >|</label>
          <strong style="font-size: 10px;line-height: 14px;">${this.y}</strong>`;
    },
  },
  series: [],
  responsive: {
    rules: [
      {
        chartOptions: { legend: { maxHeight: 56 } },
        condition: { maxHeight: 250 },
      },
    ],
  },
};

const CURRENT_DATE = moment().format("YYYY-MM-DD");

function BasicLineChart({
  options: chartOptions = {},
  data: lineChartData,
  getMealGraphData,
  series = null,
  formData
}) {
  const { t } = useTranslation();
  const {
    isRestaurantLoaded,
    selectedRestaurant,
    hasRetaurants
  } = useUserData();
  const [selectedOption, setSelectedOption] = useState(null);
  const [SERIES, setSERIES] = useState([]);
  const prevFromData = useRef(formData);

  useEffect(()=>{
    if(isRestaurantLoaded && !hasRetaurants) {
      const currentOption = formData?.meals.length ? series.find(s => s.id ===formData.meals[0]) : series[0]
     let days = getDummyFilteredData(currentOption?.days, formData, selectedRestaurant?.timezone)
        setSelectedOption({...currentOption, days: days})
        const actualSales = days?.map((item) => item.details.map(i => i.actual_sales).reduce(
        (previousActualSale, currentActualSale) => previousActualSale + currentActualSale,
        0
      ));
      const predictedSales = days?.map((item) => item.details.map(i => i.predicted_sales).reduce(
        (previousPredictedSale, currentPredictedSale) => previousPredictedSale + currentPredictedSale,
        0
      ))
      setSERIES(
        [
          {
            data: !isFormDataSame(formData, prevFromData.current) ? actualSales.map(a => getRandomNumber(a-1, a+1)) : actualSales, // data for Line 1
            color: "#6353EA",
            type: "spline", // set the series type to 'spline' for a curved line
            lineWidth: 2,
            name: t("Realised"),
          },
          {
            data: !isFormDataSame(formData, prevFromData.current) ? predictedSales.map(p => getRandomNumber(p-1, p+1)) : predictedSales, // data for Line 2
            dashStyle: "Dash",
            color: "#34CA70",
            type: "spline", // set the series type to 'spline' for a curved line
            lineWidth: 2,
            name: t("Target"),
          },
        ]
      )
      return
    }
    setSelectedOption(series[0])
    setSERIES(
      [
        {
          data: series[0]?.days?.map((item) => item.details.map(i => i.actual_sales).reduce(
            (previousActualSale, currentActualSale) => previousActualSale + currentActualSale,
            0
          )), // data for Line 1
          color: "#6353EA",
          type: "spline", // set the series type to 'spline' for a curved line
          lineWidth: 2,
          name: t("Realised"),
        },
        {
          data: series[0]?.days?.map((item) => item.details.map(i => i.predicted_sales).reduce(
            (previousPredictedSale, currentPredictedSale) => previousPredictedSale + currentPredictedSale,
            0
          )), // data for Line 2
          dashStyle: "Dash",
          color: "#34CA70",
          type: "spline", // set the series type to 'spline' for a curved line
          lineWidth: 2,
          name: t("Target"),
        },
      ]
    );

  },[lineChartData, series, formData])

  // const dropdownOptions = lineChartData?.map((obj) => ({
  //   value: obj.id,
  //   label: obj.meal,
  // }));

  const dropdownOptions = replaceEmojis(lineChartData)?.map((obj) => ({
    value: obj.id,
    label: obj.meal,
  }));

  // const initialValue = { value: selectedOption?.id, label: selectedOption?.name };
  const initialValue = selectedOption ? { value: selectedOption?.id, label: replaceEmojis(selectedOption?.name) } : null;

  options = {
    ...options,
    title: selectedOption?.name,
    ...chartOptions,
    ...(chartOptions.chart && {
      chart: { ...options.chart, ...chartOptions.chart },
    }),
  };



  const customStyles = {
    control: (provided) => ({
      ...provided,
      width: 200,
      marginRight: "10px", // Set the right margin for positioning
      height: "14px",
      marginLeft: "auto",
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999, // Ensure the menu appears on top of other elements if necessary
    }),
  };

  const handleSelectChange =async (selectedDropdownOption) => {
      series = []
      await getMealGraphData(selectedDropdownOption.value)
      return
  };

  return (
    <>
      <Select
        styles={customStyles}
        options={dropdownOptions}
        value={initialValue}
        onChange={handleSelectChange}
        menuPortalTarget={document.body}
        menuPosition={"fixed"}
      />
      <HighchartsReact
        highcharts={Highcharts}
        containerProps={{ style: { height: "100%" } }}
        options={{
          ...options,
          ...(!series && {
            series: [{ ...options.series[0], data: lineChartData }],
          }),
          credits: { enabled: false },
          xAxis: {
            categories: selectedOption?.days?.map((dt) => dt.date), // x-axis categories
          },
          yAxis:{
            tickInterval: 8,
            gridLineWidth: 0,
          },
          credits: { enabled: false },
          describeSingleSeries: false,
          ...(series && {
            series: SERIES.map((s, i) => ({
              ...s,
              allowCheckboxClick: false,
              // ...(i > DEFAULT_VISIBLE_LINES && { visible: false }),
              marker: {
                enabled: false,
                fillColor: "#fff",
              },
            })),
          }),
        }}
      />
    </>
  );
}

export default BasicLineChart;
