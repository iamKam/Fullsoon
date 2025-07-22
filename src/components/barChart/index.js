import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import "./index.scss";

let options = {
  chart: {
    type: "column",
  },
  title: {
    text: "",
  },
  tooltip: {
    backgroundColor: "#FFF",
    borderColor: "#D8D8D8",
    borderRadius: 4,
    formatter: function () {
      return `
        <label style="font-family: Nunito Sans;font-size: 10px;line-height: 14px;color: #8B8F94">${this.x}</label>
        <label style="color:#D8D8D8;" >|</label>
        <strong style="font-family: Nunito Sans;font-size: 10px;line-height: 14px;">${this.y}</strong>`;
    },
  },
  xAxis: {
    categories: [],
  },
  yAxis: {
    title: {
      text: "",
    },
    visible: true,
    gridLineColor: "#fff",
  },
  plotOptions: {
    column: {
      pointPadding: 0.2,
      borderWidth: 0,
      borderRadius: 5,
      color: "rgba(99, 83, 234, 0.3)",
      states: { hover: { color: "#6353EA" } },
    },
    series: {
      selected: false,
    },
  },
  series: [
    {
      data: [],
      showInLegend: false,
      name: "Series",
    },
  ],
};

function BarChart({
  data: { timesData = [], seriesData = [] },
  options: chartOptions = {},
}) {

  options = {
    ...options,
    ...chartOptions,
    ...(chartOptions.chart && {
      chart: { ...options.chart, ...chartOptions.chart },
    }),
    xAxis: { ...options.xAxis, categories: timesData },
    series: [{ ...options.series[0], data: seriesData }],
  };

  return (
    <HighchartsReact
      containerProps={{ style: { height: "100%" } }}
      highcharts={Highcharts}
      options={{ ...options }}
    />
  );
}

export default BarChart;
