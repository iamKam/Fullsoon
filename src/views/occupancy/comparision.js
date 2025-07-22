import { useTranslation } from "react-i18next";
import BasicLineChart from "components/basicLineChart2";
function Comparison({
  formData,
  lineChartData
}) {
  const { t } = useTranslation();

   return (
    <>
      <div className="col-lg-12 h-100">
        <div className="card mb-0 h-100">
          <div
            className="card-header d-flex flex-column align-items-start"
            style={{
              borderBottom: "2px solid #E0E0E0",
              paddingBottom: "6px",
              position: "relative"
            }}
          >
            <h2 style={{ color: "#6353ea", fontSize: "21px" }}>{t("Chart")}</h2>
            <div
              style={{
                backgroundColor: "#6353ea",
                height: "2px",
                width: "100px",
                position: "absolute",
                bottom: "-2px", 
                left: "2px"
              }}
            ></div>
          </div>

          <div className="card-body h-100">
            <BasicLineChart 
              formData={formData}
              data={lineChartData} 
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Comparison;