import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import moment from "moment";

import "./index.scss";
import { cloneDeep } from "common/utils.ts";

const linearGradient = { x1: 0, y1: 0, x2: 0, y2: 1 };
const color1 = {
  color: "#6353EA",
  fillColor: {
    linearGradient,
    stops: [
      [0, "rgba(99, 83, 234, 0.3)"],
      [1, Highcharts.color("#6353EA").setOpacity(0).get("rgba")],
    ],
  },
};
const color2 = {
  color: "#34CA70",
  fillColor: {
    linearGradient,
    stops: [
      [0, "#C5F8DF"],
      [1, Highcharts.color("#C5F8DF").setOpacity(0).get("rgba")],
    ],
  },
};

let defaultOptions = {
  chart: { zoomType: "x" },
  title: { text: "" },
  xAxis: { 
    type: "datetime", lineColor: "#fff", 
    tickLength: 0, offset: 5, 
    // tickPositioner: function() {
    //   return this.series[0].xData;
    // } 
  },
  yAxis: { title: { text: "" }, visible: true, gridLineColor: "#fff" },
  tooltip: {
    backgroundColor: "#FFF",
    borderColor: "#D8D8D8",
    borderRadius: 4,
  },
  legend: { enabled: false },
  series: [
    {
      marker: { enabled: false, fillColor: "#fff" },
      type: "areaspline",
      name: "",
      threshold: null,
      zoneAxis: "x",
      zones: [color1, color2],
    },
  ],
};

function LineChart({
  options,
  data,
  dateTimeFormatter = "H:mm",
  extendedDate = null,
}) {
  const tooltipFormatter = function () {
    return `<label style="font-size: 10px;line-height: 14px;color: #8B8F94">${moment
      .unix(this.x)
      .utcOffset(0)
      .format(dateTimeFormatter)}</label>
    <label style="color:#D8D8D8;" >|</label>
    <strong style="font-size: 10px;line-height: 14px;">${this.y}</strong>`;
  };

  const xAxisFormatter = function () {
    return moment.unix(this.value).utcOffset(0).format(dateTimeFormatter);
  };

  const chartOptions = {
    ...cloneDeep(defaultOptions),
    ...cloneDeep(options),
    tooltip: { ...defaultOptions.tooltip, formatter: tooltipFormatter },
    xAxis: { ...defaultOptions.xAxis, labels: { formatter: xAxisFormatter } },
  };

  if (extendedDate) {
    chartOptions.series[0].zones[0].value = extendedDate;
  } else {
    delete chartOptions.series[0].zones;
    chartOptions.series[0] = { ...chartOptions.series[0], ...color1 };
  }

  return (
    <HighchartsReact
      containerProps={{ style: { height: "100%", width: "100%" } }}
      highcharts={Highcharts}
      options={{
        ...chartOptions,
        series: [{ ...chartOptions.series[0], data }],
      }}
    />
  );
}

export default LineChart;
