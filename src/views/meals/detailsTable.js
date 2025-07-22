import React, { useEffect, useMemo, useState, useRef, useImperativeHandle, forwardRef } from "react";
import omit from "lodash/omit";
import isEqual from "lodash/isEqual";
import { useTranslation } from "react-i18next";
import { OverlayTrigger, Spinner, Tooltip } from "react-bootstrap";
import { utils, writeFile } from 'xlsx';

import useFetch from "customHooks/useFetch";
import CustomTable from "components/customTable/index.tsx";
import { useUserData } from "contexts/AuthContextManagement";
import { generateServiceTableRawData, getRandomNumber } from "views/occupancy/data";
import  {  ParentChildCount } from "views/settings/myIngredients/PriceHistory";
import tableMealsDummy from "../../data/table_meals.json";
import request from "services/request";
import TelechargerIcon from "assets/images/telecharger.png";
import { getTimeRanges, getTimezoneFormatUtc, parseTime, timezoneFormat, replaceEmojis } from "common/utils";

const VIZ_TYPES = { TABLE: "table", GROUP_CELL: "groupCell" };
const VIZ_BUTTONS = [
  { type: VIZ_TYPES.TABLE, label: "Table" },
  { type: VIZ_TYPES.GROUP_CELL, label: "Menu Engineering" },
];

const renderTooltip = (value) => (props) =>
  (
    <Tooltip id="button-tooltip" {...props}>
      {value}
    </Tooltip>
  );

const domSelectRow = ($id) => {
  const allElements = document.querySelectorAll('tr');
  allElements.forEach((element) => {
    element.classList.remove('selected-row');
  });
  const divElement = document.getElementById($id);
  divElement?.scrollIntoView({ behavior: "smooth", block: "center" });
  divElement?.classList.add("selected-row");
};

const DetailsTable = forwardRef(({ filteredTableData, mealsLoading, onDownload, formData, ...props }, ref) => {
  const { t } = useTranslation();
  const [sameOrderMeal, setSameOrderMeal] = useState(null);
  const [vizType, setVizType] = useState(VIZ_TYPES.TABLE);
  const [sleaveState, setSleaveState] = useState({
    index: -1,
    isOpen: true,
    sales: null
  });
  const tableRef = useRef(null);
  const {
    selectedRestaurantId,
    isRestaurantLoaded,
    hasRetaurants,
    selectedRestaurant
  } = useUserData();


  useImperativeHandle(ref, () => ({
    getTableRef: () => tableRef.current,
  }));

  useEffect(() => {
    setSameOrderMeal(null);
    setVizType(VIZ_TYPES.TABLE);
  }, [props.payload]);

  useEffect(()=> {
    setSleaveState(p => ({...p,index: -1, isOpen: false, sales: null}))
  }, [formData])

  useEffect(() => {
    if (VIZ_TYPES.GROUP_CELL === vizType && sameOrderMeal) {
      domSelectRow(sameOrderMeal);
    }

    if (VIZ_TYPES.TABLE === vizType || sameOrderMeal) {
      return;
    }

    if (filteredTableData?.[0]?.id) {
      setSameOrderMeal(filteredTableData?.[0]?.id);
    }
  }, [vizType]);

  const parseMealsData = (meals) => {
    const { timesData } = generateServiceTableRawData(formData, `minute`, 30);
    const mealData = [];


    meals?.forEach((ele) => {
      const meal = {
        parent_sales: ele.parent_sales,
        child_sales: ele.child_sales,
      };
      const intervals = {};
      const intervalsArray = [];
      timesData.forEach((t) => {
        const isExist = parseTime(
              selectedRestaurant?.timezone,
              ele?.intervals.split(":")[0] + ":" + ele?.intervals.split(":")[1]
            ) === t
        if (isExist) {
          intervals[t] = {parent_sales: ele.parent_sales, child_sales: ele.child_sales};
          intervalsArray.push([t, isExist.sales]);
        } else {
          intervals[t] = {parent_sales: 0, child_sales: 0};
          intervalsArray.push([t, 0]);
        }
      });
      mealData.push({ ...meal, ...intervals });
    });
    return mealData
  };

  let { loading: sameOrderMealsLoading, data: sameOrderMealsData } = useFetch(
    "tables/meals/same-ordered-meals",
    omit(
      {
        ...props.payload,
        restaurant_id: selectedRestaurantId,
        meal_id: sameOrderMeal,
      },
      [
        "meals",
        "meal_types",
        "restaurants",
        "breakfast",
        "lunch",
        "dinner",
        "afternoon",
        "meals[]",
      ]
    ),
    true,
    [sameOrderMeal],
    ["meal_id"]
  );

  useEffect(() => {
    if(isRestaurantLoaded && !hasRetaurants && sameOrderMeal) {
      setTimeout(() => {
        domSelectRow(sameOrderMeal);
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRestaurantLoaded, hasRetaurants, sameOrderMeal]);


  useEffect(() => {
    if (!sameOrderMealsLoading || !sameOrderMealsData?.same_ordered_meals || (isRestaurantLoaded && !hasRetaurants)) {
      return;
    }

    setTimeout(() => {
      domSelectRow(sameOrderMeal ?? filteredTableData?.[0]?.id);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sameOrderMealsData?.same_ordered_meals?.length]);

  const handleDoubleClick =async(index, isOpen, meal_id) => {
    if(isOpen) {
      setSleaveState(p => ({...p, isOpen: false, sales: null}))
      setTimeout(() => {
        setSleaveState(p => ({...p, index: -1}))
      }, 300)
    } else {
      if(isRestaurantLoaded && !hasRetaurants) {
        const meal = tableMealsDummy.meals.find(m => m.id === meal_id)
        let randomPart = Math.floor(Math.random() * (meal?.actual_sales + 1));
        setSleaveState(p => ({...p, index, isOpen: true, sales: {parent_sales: randomPart, child_sales: meal?.actual_sales - randomPart} }))
        return 
      }
      
      const result = await request.get(
        `sales/meals/parent-child`,
        {
          restaurant_id: selectedRestaurantId,
          start_date: getTimezoneFormatUtc(formData.start_date, formData.end_date, selectedRestaurant?.timezone)?.start_date,
          end_date: getTimezoneFormatUtc(formData.start_date, formData.end_date, selectedRestaurant?.timezone)?.end_date,
          restaurants: formData.myRestaurants,
          meal_id,
          time_ranges: getTimeRanges(formData, selectedRestaurant?.timezone),
          operation: formData?.total ? "total" : "average",
        },
        true,
        true,
        true
      );
      setSleaveState(p => ({...p, index, isOpen: true, sales: {...result.sales, details: parseMealsData(result.sales.details)} }))
    }
  }

  const mealColumn = (source = VIZ_TYPES.TABLE) => ({
    className: "fw-bold",
    style: { width: "150px" },
    headerStyle: { width: "150px" },
    columnType: "customRender",
    caption: t("Meal"),
    dataField: "action",
    type: "dynamic",
    elem: (_, it) => (
      <OverlayTrigger
        placement="top"
        overlay={renderTooltip(it?.name ?? it?.meal)}
      >
        <span
          onClick={() => {
            // if (source !== VIZ_TYPES.TABLE) {
            //   setVizType(VIZ_TYPES.GROUP_CELL);
            // }
            setSameOrderMeal(it?.id);
          }}
          className="w-100 fw-bold cursor-pointer"
        >
          {it?.name ?? it?.meal}
        </span>
      </OverlayTrigger>
    ),
  });

  let sameOrderMealsColumns = [
    mealColumn(),
    ...(sameOrderMealsData?.same_ordered_meals?.map((meal, i) => ({
      dataField: `data[${i}]`,
      caption: meal.name,
      className: "text-center",
      headerClassName: "text-center",
    })) ?? []),
  ];

  const tableColumns = useMemo(
    () =>
      props.tableColumns.map((col, i) => ({
        ...col,
        ...(i === 0 && { ...mealColumn(VIZ_TYPES.GROUP_CELL) }),
      })),
    [props.tableColumns]
  );

  if(isRestaurantLoaded && !hasRetaurants) {
    let randomNumber = getRandomNumber(7,15)
    let selected = filteredTableData.slice(0,randomNumber);
    sameOrderMealsColumns = [
      mealColumn(),
      ...(selected?.map((meal, i) => ({
        dataField: `data[${i}]`,
        caption: meal.meal,
        id: meal.id,
        className: "text-center",
        headerClassName: "text-center",
      })) ?? []),
    ];

    sameOrderMealsColumns = sameOrderMealsColumns.filter(i => i?.id != sameOrderMeal)

    sameOrderMealsData = {
      meal_id: sameOrderMeal,
      operation: "total",
      restaurant_id: selectedRestaurantId,
      same_ordered_meals: selected.map(i => {
          return {
            id: i.id,
            name: i.meal,
            sales: getRandomNumber(i.actual_sales-2,i.actual_sales+2) ?? 0
          }
      })
    }
  }

  let negativeTargetValues
  if(filteredTableData.length) {
    negativeTargetValues = filteredTableData.filter(item => Math.abs(item.predicted_sales) > (item.actual_sales * 0.1))
  }

  const processedCurrentItems = useMemo(() => {
    const newCurrentItems = [...filteredTableData];
    if(sleaveState.index !== -1) {
      // newCurrentItems.splice(sleaveState.index+1, 0, {prediction:{}, isOpen: sleaveState.isOpen})
      newCurrentItems[sleaveState.index] = {...newCurrentItems[sleaveState.index], prediction: { isOpen: sleaveState.isOpen }, sales: sleaveState.sales};
    }
    const newCurrentItemWithoutEmojis = replaceEmojis(newCurrentItems);
    return newCurrentItemWithoutEmojis;
  }, [filteredTableData, sleaveState])


  return (
    <>
      <div className="card-header d-flex align-items-center justify-content-between border-bottom">
        <h2>{t("MealsDetails")}</h2>

      <div className="d-flex align-items-center">
        <ul className="navbtns" style={{ marginBottom: "-1px" }}>
          {VIZ_BUTTONS.map((viz, i) => (
            <li key={i} className={`${vizType === viz.type ? "active" : ""}`}>
              <button
                className={`nav-link btn-link ${
                  vizType === viz.type ? "active" : ""
                }`}
                onClick={() => {
                  setVizType(viz.type);
                }}
              >
                {t(viz.label)}
              </button>
            </li>
          ))}
        </ul>
        <button onClick={onDownload} className="btn btn-white btn-icon me-1" style={{ padding: "2px 13px"}}>
          <img src={TelechargerIcon} alt="" className="m-0" />
        </button>
        </div>
      </div>
      <div className="card-body inherit-height">
        {((mealsLoading && vizType === VIZ_TYPES.TABLE) ||
          (sameOrderMealsLoading && vizType === VIZ_TYPES.GROUP_CELL)) && (
          <div className="w-100 d-flex justify-content-center card-spinner-container">
            <Spinner animation="border" variant="primary" />
          </div>
        )}

        {vizType === VIZ_TYPES.TABLE && !mealsLoading && (
          <CustomTable
            ref={tableRef}
            columns={tableColumns}
            data={processedCurrentItems}
            deleteRow={props.deleteItem}
            negativeTargetValues={negativeTargetValues}
            onRowDoubleClick={handleDoubleClick}
            SleaveContent={ParentChildCount}
          />
        )}
        {vizType === VIZ_TYPES.GROUP_CELL && !sameOrderMealsLoading && (
          <CustomTable
            ref={tableRef}
            columns={sameOrderMealsColumns}
            data={filteredTableData.map((f) => ({
              name: f.meal,
              id: f.id,
              ...(sameOrderMealsData?.meal_id === f.id && {
                data: sameOrderMealsData?.same_ordered_meals?.map(
                  (m) => m?.sales
                ).sort(function(a, b) {
                  return b - a;
                }),
              }),
            }))}
          />
        )}
      </div>
    </>
  );
})

function areEqual(prevProps, nextProps) {
  return isEqual(
    omit(prevProps, ["deleteItem"]),
    omit(nextProps, ["deleteItem"])
  );
}

export default React.memo(DetailsTable, areEqual);
