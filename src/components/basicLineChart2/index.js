import React, { useEffect, useState } from "react";
import Highcharts from "highcharts";
import { useTranslation } from "react-i18next";
import HighchartsReact from "highcharts-react-official";
import "./index.scss";
function BasicLineChart({ formData, data: lineChartData }) {
  const { t } = useTranslation();
  const [chartOptions, setChartOptions] = useState({});
  useEffect(() => {
    if (!formData || !lineChartData || lineChartData.length === 0) return;
    // Filter dates within the current range for Actual and Forecast
    const validDates = Object.keys(
      lineChartData.reduce((acc, curr) => {
        Object.keys(curr).forEach((key) => {
          if (key !== "name") acc[key] = true;
        });
        return acc;
      }, {})
    )
      .filter(
        (date) =>
          new Date(date) >= new Date(formData.start_date) &&
          new Date(date) <= new Date(formData.end_date)
      )
      .sort((a, b) => new Date(a) - new Date(b));
    const seriesData = lineChartData.map((item) => {{
        return {
          name: t(item.name),
          data: validDates.map((date) => item[date] || 0),
          color:
            item.name === "Forecast"
              ? "#6353EA"
              : item.name === "Actual"
              ? "#000000"
              : "rgb(160,160,160)",
          dashStyle: "Solid",
        };
      }
    });
    // Update chart options
    setChartOptions({
      chart: {
        type: "spline",
        zoomType: "x",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: validDates, // Dates as categories
        title: {
          text: t("Date"),
          style: {
            color: "#000000",
            fontSize: "16px",
            fontWeight: "600",
          },
        },
        labels: {
          formatter: function () {
            const [year, month, day] = this.value.split("-");
            const date = new Date(year, month - 1, day);
            return `${String(date.getDate()).padStart(2, "0")} ${date.toLocaleString("default", {
              month: "short",
            })}`;
          },
          style: {
            color: "#000000",
            fontSize: "16px",
            fontWeight: "600",
          },
        },
      },
      yAxis: {
        title: {
          text: t("Clients"),
          style: {
            color: "#000000",
            fontSize: "16px",
            fontWeight: "600",
          },
        },
        labels: {
          style: {
            color: "#000000",
            fontSize: "16px",
            fontWeight: "600",
          },
        },
        tickInterval: 100,
      },
      tooltip: {
        shared: false,
        useHTML: true,
        borderRadius: 8,
        borderWidth: 0,
        shadow: true,
        backgroundColor: null,
        style: {
          color: "#fff",
          fontSize: "14px",
          fontWeight: "bold",
        },
        formatter: function () {
          const backgroundColor =
            this.series.name === t("Actual")
              ? "#000000"
              : this.series.name === t("Year-1")
              ? "rgb(160,160,160)"
              : "#6353ea";

          return `<div style="text-align: center; line-height: 1.4; padding: 10px 20px; background-color: ${backgroundColor}; border-radius: 8px;">
                    <span style="font-size: 18px;">${this.y}</span><br/>
                    <span>${t("Clients")}</span>
                  </div>`;
        },
      },
      legend: {
        align: "center",
        verticalAlign: "top",
        layout: "horizontal",
        itemStyle: {
          fontWeight: "700",
          fontSize: "18px",
          color: "#333",
        },
        symbolWidth: 30,
        symbolHeight: 2,
        symbolRadius: 0,
        labelFormatter: function () {
          return `<span style="color: ${this.color}">${this.name}</span>`;
        },
      },
      series: seriesData,
    });
  }, [formData, lineChartData, t]);
  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={chartOptions}
      containerProps={{
        className: "occupancy-graph",
        style: { height: "400px", width: "100%" },
      }}
    />
  );
}
export default BasicLineChart;