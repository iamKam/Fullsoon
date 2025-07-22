export const getDefaultOptions = (t) => ({
  chart: {
    type: "pie",
    credits: { enabled: false },
    renderTo: document.getElementById("container"),
  },
  legend: {
    enabled: true,
    layout: "vertical",
    align: "right",
    width: "40%",
    verticalAlign: "middle",
    useHTML: true,
  },
  plotOptions: {
    pie: {
      allowPointSelect: false,
      cursor: "pointer",
      dataLabels: {
        enabled: false,
      },
      showInLegend: true,
      borderWidth: 0.5
    },
  },
  series: [
    {
      minPointSize: 80,
      innerSize: "70%",
      zMin: 0,
    },
  ],
  tooltip: {
    headerFormat: "",
    pointFormat:
      '<span style="color:{point.color}">\u25CF</span> <b> {point.name}</b><br/>' +
      t("TotalEarnings") + ": <b>{point.y}</b><br/>",
  }
});
