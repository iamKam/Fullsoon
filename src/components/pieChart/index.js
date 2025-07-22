import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useTranslation } from "react-i18next";

import { getDefaultOptions } from "./utils";

import "./index.scss";

function PieChart({
  options: chartOptions = { title: { text: "" } },
  data,
  formatterPrefix = "",
}) {
  const { t } = useTranslation();
  const labelFormatter = (_prefix) =>
    function () {
      return `<div style="display:flex; min-width:180px; max-width:180px;">
      <span style="white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">${this.name}</span>
      <span style="width: 20%; margin-left: 10%">${this.y}${_prefix}</span>
    </div> <br/>`;
    };

  const defaultOptions = getDefaultOptions(t);
  
  const options = {
    ...defaultOptions,
    ...chartOptions,
    ...(chartOptions.chart && {
      chart: { ...defaultOptions.chart, ...chartOptions.chart },
    }),
    ...(data && { series: [{ ...defaultOptions.series[0], data }] }),
    legend: {
      ...defaultOptions.legend,
      labelFormatter: labelFormatter(formatterPrefix),
      ...(chartOptions.legend && { ...chartOptions.legend }),
    }
  };

  return (
    <HighchartsReact
      containerProps={{ style: { height: "100%", width: "100%" } }}
      highcharts={Highcharts}
      options={options}
    />
  );
}

export default PieChart;
