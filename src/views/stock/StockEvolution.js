import BarChart from "components/barChart";
import moment from "moment";
import { Spinner } from "react-bootstrap";
import { useEffect, useState } from "react";
import request from "services/request";
import { useUserData } from "contexts/AuthContextManagement";
import { getRandomNumber } from "views/occupancy/data";
import { useTranslation } from "react-i18next";

function StockEvolution({ data }) {
  const { t } = useTranslation();
  const { isRestaurantLoaded, hasRetaurants, setStockEvolution } =
    useUserData();
  const [{ loading, predictions }, setState] = useState({
    loading: true,
    predictions: [],
  });

  useEffect(() => {
    if (isRestaurantLoaded && !hasRetaurants) {
      let evolution = {
        ingredient_id: data.id,
        evolution: Array.from({ length: 8 }, (_, i) => ({
          date: moment(data.start_date).add(i, "days").format("YYYY-MM-DD"),
          stock: getRandomNumber(-4, 15),
        })),
      };
      setStockEvolution(evolution);
      setState((p) => ({
        ...p,
        loading: false,
        predictions: evolution.evolution,
      }));
      return;
    }
    data.time_zone ?? setState((p) => ({ ...p, loading: true }));

    request
      .get(
        `stocks/evolution`,
        {
          restaurant_id: data.restaurant_id,
          ingredient_id: data.id,
          start_date: data.start_date,
          end_date: moment(data.start_date).add(6, "days").format("YYYY-MM-DD"),
        },
        true,
        false,
        true
      )
      .then((evolution) => {
        if (evolution) {
          setStockEvolution({
            ingredient_id: data.id,
            evolution: evolution.stocks_evolution
          });
          setState((p) => ({
            ...p,
            loading: false,
            predictions: evolution.stocks_evolution
          }));
        }
        throw Error("Oops, looks like I fail");
      })
      .catch((e) => {
        setState((p) => ({ ...p, loading: false }));
      });
  }, [data.time_zone]);

  const minStock = data.min_stock ? data.min_stock : 0;

  const getBarColor = (stock) => {
    if (stock > minStock) {
      return "rgba(99, 83, 234, 0.3)";
    } else if (stock < minStock) {
      return "#ff8886";
    } else {
      return "#f8e474";
    }
  };
  // const predictions = useMemo(() => {
  //   if (evolution?.ingredients) {
  //     return parseEvolutionData(evolution.ingredients[0].days).map((day) => ({
  //       ...day,
  //       predictions: day.predictions.reduce(
  //         (total, val) => total + val.prevision,
  //         0
  //       ),
  //     }));
  //   }
  //   return [];
  // }, [evolution]);

  const defaultProvider = data?.providers.find(item => item.is_default)

  return (
    <div className="stock-sleave-body">
      <div className="prediction-container">
        <h5>{t("MonetaryValues")}</h5>
        <div className="card-body">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th style={{ whiteSpace: "normal"}}>{t("ValueOfStockGap")} &euro;</th>
                <th style={{ whiteSpace: "normal"}}>{t("ValueOfCurrentStock")} &euro;</th>
                <th>{t("Price")}</th>
                <th>{t("TotalPrice")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {((data.cost_excl_tax / defaultProvider.recipe_unit_quantity || 1) * data.stock_gap).toFixed(2)}
                </td>
                <td>
                  {defaultProvider ? (data.stock.unit_stock * (defaultProvider?.price_excl_tax / defaultProvider?.recipe_unit_quantity))?.toFixed(2) : 0}
                </td>
                <td>{data.cost_excl_tax}</td>
                <td>
                  {Number(
                    (data.product_quantity * data.cost_excl_tax)?.toFixed(2)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="prediction-container">
        <h5>Stocks evolution</h5>
        <div className="evolution-container">
          {loading && (
            <div className="w-100 d-flex justify-content-center mt-5">
              <Spinner animation="border" variant="primary" />
            </div>
          )}
          {!loading && !predictions?.length && (
            <div className="w-100 d-flex justify-content-center mt-5">
              <p>No data Available</p>
            </div>
          )}
          {!loading && predictions?.length && (
            <BarChart
              data={{
                seriesData: predictions.map((item) => ({
                  y: Number(item.stock.toFixed(2)),
                  color: getBarColor(item.stock),
                })),
                timesData: predictions.map((item) =>
                  moment(item.date).format("ddd")
                ),
              }}
              options={{
                plotOptions: {
                  column: {
                    pointPadding: 0.2,
                    borderWidth: 0,
                    borderRadius: 5,
                    color: "rgba(99, 83, 234, 0.3)",
                    states: { hover: { color: "#6353EA" } },
                    dataLabels: {
                      enabled: true,
                      color: "#666666",
                    },
                  },
                  series: {
                    selected: false,
                  },
                },
                yAxis: {
                  title: {
                    text: "",
                  },
                  visible: true,
                  gridLineColor: "#fff",
                  plotLines: [
                    {
                      value: minStock,
                      color: "#ff8886",
                      width: 2,
                      dashStyle: "Dash",
                      label: {
                        text: minStock,
                        align: "right",
                        style: {
                          color: "gray",
                        },
                        x: 10,
                        y: 2.5,
                      },
                    },
                  ],
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default StockEvolution;
