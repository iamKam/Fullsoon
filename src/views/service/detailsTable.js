import React from "react";
import { useTranslation } from "react-i18next";

import CustomTable from "components/customTable/index.tsx";

function DetailsTable({
  tableColumns,
  filterTableData,
  filteredTableData,
  deleteItem,
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="card-header d-flex align-items-center justify-content-between">
        <h2>{t("ServingTimePerMeal")}</h2>
      </div>
      <div className="card-body inherit-height">
        <CustomTable
          columns={tableColumns}
          data={filteredTableData}
          deleteRow={deleteItem}
        />
      </div>
    </>
  );
}

export default DetailsTable;
