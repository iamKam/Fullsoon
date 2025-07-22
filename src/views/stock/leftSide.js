import React, { useState, useEffect, useReducer, useRef, useMemo } from "react";
import ReactPaginate from "react-paginate";
import moment from "moment";
import { Dropdown, Row } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { set } from "lodash";
import { useTranslation } from "react-i18next";
import { Spinner } from "react-bootstrap"
import CustomTable from "components/customTable/index.tsx";
import DeleteModal from "views/commonViews/DeleteModal";
import request from "services/request";
import { useUserData } from "contexts/AuthContextManagement";
import { useLoading } from "contexts/LoadingContextManagement";
import { useFilterData } from "contexts/FilterContextManagment";
import * as XLSX from 'xlsx';

import { cloneDeep } from "common/utils.ts";
import {
  DEFAULT_ERROR_MESSAGE,
  ITEMS_PER_PAGE,
} from "common/constants";
import { getRandomNumber } from "views/occupancy/data";

import UploadModal from "./uploadModal.tsx";
import StockService from "./service";
import reducer, { ACTION_TYPES, initialState } from "./reducer";
import { timezoneFormat } from "common/utils";
import TransferModal from "./transferIngredientModal.js";
import SortIcon from "assets/images/icon/SORT.svg";
import ArrowDownIcon from "assets/images/icon/arrow_down.svg";
import ArrowUpIcon from "assets/images/icon/arrow_up.svg";
import TrashIcon from "assets/images/icon/filter.svg";
import StockEvolution from "./StockEvolution";
import useFetch from "customHooks/useFetch";
import sampleStockPred from "../../data/stock_predictions.json";
import stockProviders from "../../data/stock_provider.json"
import TelechargerIcon from "assets/images/telecharger.png";
import ConfirmDownlaodModal from "./ConfirmDownlaodModal.js";
import exportPdf from "utils/extractPdf.js";

function LeftSide({ formData, clear }) {
  const tableDataClone = useRef(null);
  const prevFromData = useRef(formData);
  const { setShowCategoriesList, setShowProvidersList } = useFilterData();
  const pdfRef = useRef(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isStocksLevelDown, setIsStockLevelDown] = useState(false);
  const { setError, setLoading } = useLoading();
  const { t } = useTranslation();
  const {
    selectedRestaurant,
    selectedRestaurantId,
    isRestaurantLoaded,
    hasRetaurants,
    stockEvolution: stockEvolutionData,
    resetStock,
    setSampleRestaurantModal,
    isFilterShown
  } = useUserData();
  const history = useHistory();
  const [tableColumns, setTableColumns] = useState([]);
  const [isModal, setIsModal] = useState(false);
  const [isFreezeModal, setIsFreezeModal] = useState(false);
  const [isTransferModel, setIsTransferModel] = useState(false);
  const [hasUpdates, setHasUpdates] = useState(false);
  const [updatedDataToFreeze, setUpdatedDataToFreeze] = useState([]);
  // We start with an empty list of items.
  const [currentItems, setCurrentItems] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isHistOnly , setIsHistOnly] = useState(false);
  const [freezeModalShow, setFreezeModalShow] = useState(false);
  const [showConfirmDownlaodModal, setShowConfirmDownlaodModal] = useState(false);
  const [documentFormat, setDocumentFormat] = useState(null);
  const [sleaveState, setSleaveState] = useState({
    index: -1,
    isOpen: true,
  });
  const [fd, setfd] = useState({
    orderBy: "desc",
    sortBy: "stock.unit_stock",
  });

  const [stockValue, setStockValue] = useState([]);
  const [stockSnapshot, setStockSnapshot] = useState([]);
  const [filteredTableDataWithTotal, setFilteredTableDataWithTotal] = useState(
    []
  );
  const [activeProvider, setActiveProvider] = useState("select_provider");

  const { data: providersData } = useFetch(`providers`, {
    restaurant_id: selectedRestaurantId,
  });

  const processedCurrentItems = useMemo(() => {
    const newCurrentItems = [...currentItems];
    if (sleaveState.index !== -1) {
      // newCurrentItems.splice(sleaveState.index+1, 0, {prediction:{}, isOpen: sleaveState.isOpen})
      newCurrentItems[sleaveState.index] = {
        ...newCurrentItems[sleaveState.index],
        prediction: { isOpen: sleaveState.isOpen },
        start_date: formData.start_date,
        end_date: formData.end_date,
        time_zone: selectedRestaurant?.timezone,
      };
    }
    return newCurrentItems;
  }, [currentItems, sleaveState, resetStock]);

  useEffect(() => {
    const totalRow = calculateSum(processedCurrentItems);
    const newData = [...processedCurrentItems];
    // REMOVE TOTAL ROW
    // newData.unshift(totaslRow);

    setFilteredTableDataWithTotal(newData);
  }, [processedCurrentItems]);

  const formatData = ({ ingredient_stock, isHist = false }, isDummy = false) => {
    return (ingredient_stock ?? []).map((i) => {
      // when we uncommit this code it miss the first selected item
      // if (state.selectedItems.length > 0 && state.selectedItems.find((s) => s.id === i.id)) {
      //   return { ...i, ...state.selectedItems.find((s) => s.id === i.id) };
      // }
      const getName = () => i.name + (i.brand ? ` (${i.brand})` : "");
      const getQty = (n) => Number((n >= 0 ? n : 0).toFixed(2));
      const prevision = i?.stock_prediction?.prevision ?? 0;
    
      if (isDummy) {
        i.stock.unit_stock = i?.stock?.unit_stock;
      } 

      let inventory = 0;
      let theoretical_stock = 0;
      let stock_gap = 0;
      let stock_snapshots = null;

      if (isHistOnly) {
        if (i?.stock_snapshots) {
          const snapshot = i?.stock_snapshots[0];
          stock_snapshots = {
            unit_quantity: snapshot?.unit_quantity ?? 0,
            theoretical_unit_quantity: snapshot?.theoretical_unit_quantity ?? 0,
            is_locked: snapshot?.is_locked,
            type: snapshot?.is_locked ? "number" : "inputNumber",
          };
          stock_gap = snapshot ? (snapshot?.unit_quantity -  snapshot?.theoretical_unit_quantity)?.toFixed(2) : 0;
        }
      } else {
        inventory = i?.stock?.unit_stock?? 0;
        theoretical_stock = i?.stock?.theoretical_stock?? 0;
        stock_gap = i?.stock ? (i?.stock?.unit_stock - i?.stock?.theoretical_stock)?.toFixed(2) : 0;
      }
    
      return {
        ...i,
        name: getName(),
        ...(i.stock === null && { stock: { unit_stock: 0 } }),
        ...(!i.qty_to_buy && {
          qty_to_buy: prevision
            ? getQty(prevision - (i?.stock?.unit_stock ?? 0))
            : 0,
        }),
        product_quantity: prevision
          ? getQty(
              Math.ceil((prevision - (i?.stock?.unit_stock ?? 0)) / i.format)
            )
          : 0,
        // theoretical_stock:  (i.stock_prediction?.theoretical_stock ? (i?.stock?.unit_stock ?? 0 - i.stock_prediction.theoretical_stock).toFixed(2) : i.stock_prediction?.prevision ? (i?.stock?.unit_stock ?? 0 - i.stock_prediction?.prevision ?? 0).toFixed(2) : 0) ,  
        stock: {
          unit_stock: inventory
        },
        theoretical_stock,
        stock_gap,
        stock_snapshots,
        ...(!i.stock_prediction && {
          stock_prediction: { prevision },
        }),
      };
    });
  };

  // Invoke when user click to request another page.
  const handlePageClick = async (ev) => {
    try {
      if (isRestaurantLoaded && !hasRetaurants) {
        const resultDummyData = getSampleStocks(ev.selected + 1);
        setStocksLoading(false);
        // setPageCount(resultDummyData.total_pages);
        // generateTableData(formatData(resultDummyData, true));
        generateTableData(formatData(resultDummyData));
        setPageCount(resultDummyData.total_pages);
        setCurrentPage(ev.selected);
        return;
      }
      setStocksLoading(true);
      const result = await getStockData(ev.selected + 1);
      result.ingredient_stock = result?.ingredient_stock?.filter(stock => stock?.providers && stock?.providers?.length > 0);
      setStocksLoading(false);
      setCurrentItems(() => formatData(result));
      setPageCount(result.total_pages);
      setCurrentPage(ev.selected);
    } catch (error) {
      console.log(error);
      setError(DEFAULT_ERROR_MESSAGE);
    }
  };

  const getStockColumns = () =>  {
    return [
      {
        label: t("ProductName"),
        dataField: "product",
        type: "string",
        active: false,
      },
      {
        label : t("Inventory"),
        dataField: "stock.unit_stock",
        type: "number",
        active: !isHistOnly,
        columnType: "inputNumber",
      },
      {
        label : t("TheoreticalStock"),
        dataField: "theoretical_stock",
        type: "number",
        active: !isHistOnly,
      },
      {
        label: t("Inventory"),
        dataField: "stock_snapshots.unit_quantity",
        active: isHistOnly,
        type: "number",
        columnType: "inputNumber",
      },      
      {
        label : t("TheoreticalStock"),
        dataField: "stock_snapshots.theoretical_unit_quantity",
        active: isHistOnly,
        type: "number",
      },
      {
        label : t("StockGap"),
        dataField: "stock_gap",
        type: "number",
        active: !isHistOnly || isHistOnly,
      },
      { 
        label: t("Unit"), 
        dataField: "unit", 
        type: "string", 
        active: !isHistOnly || isHistOnly,
      },
      // {
      //   label: t("Expiry"),
      //   dataField: "stock.expiry",
      //   type: "dropdown",
      //   active: true,
      //   caption: "Expiry",
      //   options: EXPIRY_OPTIONS,
      //   elem: (text) => (
      //     <span className={`${getExpiryTextColor(text)}`}>{t(text)}</span>
      //   ),
      // },
      // {
      //   label: t("Prevision"),
      //   dataField: "stock_prediction.prevision",
      //   type: "number",
      //   active: true,
      // },
      {
        label: t("QuantityToBuy"),
        dataField: "qty_to_buy",
        type: "number",
        active: !isHistOnly,
        columnType: "inputNumber",
        headerStyle: { whiteSpace: "normal" },
      },
      {
        label: t("ProductQuantity"),
        dataField: "product_quantity",
        type: "customRender",
        headerStyle: { whiteSpace: "normal" },
        active: !isHistOnly,
        render: (_, it) => {
          return <span>
            {
              (it.product_quantity = Math.ceil(
                parseFloat(it.qty_to_buy || 0) / parseFloat(it.providers?.find(p => p.is_default)?.recipe_unit_quantity || 1)
              ) || 0)
            }
          </span>
        },
      },
      {
        label: t("UnitPrice(conditioning)"),
        dataField: "unit_price",
        type: "customRender",
        headerStyle: { whiteSpace: "normal" },
        active: !isHistOnly,
        render: (_, it) => {
          return <span>
            {
              (it?.providers?.find(p => p.is_default)?.price_excl_tax / (it?.providers?.find(p => p.is_default)?.conditioning_quantity_1 || 1) || 0)?.toFixed(2)
            }
          </span>
        },
      },
      // {
      //   label: t("UnitPrice"),
      //   dataField: "unit_price",
      //   type: "number",
      //   active: true,
      // },
      // {
      //   label: t("ProductPrice"),
      //   dataField: "product_price",
      //   type: "number",
      //   active: true,
      // },
      // {
      //   label: t("TotalPrice"),
      //   dataField: "total_price",
      //   type: "customRender",
      //   active: true,
      //   render: (_, it) => (
      //     <span>
      //       {Number(
      //         (Number(it.product_quantity) * Number(it.product_price)).toFixed(2)
      //       )}
      //     </span>
      //   ),
      // },
    ]
  }

  const cols = useMemo(() => getStockColumns(), [t, formData, currentItems]);
  useEffect(() => {
    generateTableColumns(cols)
  }, [cols])

  useEffect(async () => {
    try {
      if (prevFromData.current !== formData) {
        const today = moment().format('YYYY-MM-DD');
        const start = formData?.start_date;
        const end = formData?.end_date;
    
        if (moment(start).isBefore(today) && moment(end).isBefore(today)) {
          setIsHistOnly(true);
          getInitialData(true);
        } else {
          getInitialData();
          setIsHistOnly(false);
        }
      }
      setShowCategoriesList(true);
      setShowProvidersList(true);
    } catch (error) {
      console.log(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, fd, activeProvider, isRestaurantLoaded, hasRetaurants, selectedRestaurantId]);

  useEffect(() => {
    setSleaveState((p) => ({ ...p, index: -1, isOpen: false }));
  }, [fd, selectedRestaurantId, currentPage, activeProvider]);

  useEffect(() => {
    if (isHistOnly) {
      setfd((prevFd) => ({ ...prevFd, sortBy: "product" }));
    }
  }, [isHistOnly])

  useEffect(() => {
    if (clear) {
      setfd({
        orderBy: "desc",
        sortBy: "stock.unit_stock",
      })
      setActiveProvider('select_provider')
    }
  }, [clear])

  const getSampleInitialData = () => {
    const resultDummyData = getSampleStocks();
    setStocksLoading(false);
    // setPageCount(resultDummyData.total_pages);
    // generateTableData(formatData(resultDummyData, true));
    generateTableData(formatData(resultDummyData));
    setPageCount(resultDummyData.total_pages);
    setCurrentPage(0);
  }

  const fetchAllData = async () => {
    let allData = [];
    let currentPage = 1;
    let totalPages = 1;
    while (currentPage <= totalPages) {
      const status = getStatus();

    const response = await request.get(
      `stocks`,
      {
        restaurant_id: selectedRestaurantId,
        ...(formData.products && { ingredients: formData.products }),
        ...timezoneFormat(
          formData?.start_date,
          formData?.end_date,
          selectedRestaurant?.timezone
        ),
        ...(status.length && { status }),
        sort_by: fd.sortBy === "product" ? "name" : fd.sortBy === "theoretical_stock" ? "stock.theoretical_stock" : fd.sortBy,        
        order_by: fd.orderBy.toUpperCase(),
        limit: 100,
        page: currentPage,
        ...(activeProvider !== "select_provider" && {
          provider_id: activeProvider,
        }),
      },
      true,
      true,
      true
    );

      allData = [...allData, ...response.ingredient_stock];

      if (currentPage === 1) {
        totalPages = response.total_pages; // Assuming the API returns the total number of pages
      }

      currentPage++;
    }
    return allData;
  };

  useEffect(() => {
    if(isRestaurantLoaded && !hasRetaurants) {
      getSampleInitialData();
    }
  },[hasRetaurants, isRestaurantLoaded])
  const downloadData = async () => {
    // 1) Fetch the full data set
    const data = await fetchAllData();
  

    // 2) Map into a uniform array of plain objects
    const mapped = data.map((d, idx) => {
      const unit_price = currentItems[idx]?.providers?.find(p => p.is_default)?.price_excl_tax / (currentItems[idx]?.providers?.find(p => p.is_default)?.conditioning_quantity_1 || 1)
      const total_price = (currentItems[idx]?.providers?.find(p => p.is_default)?.price_excl_tax || 0) * (currentItems[idx]?.product_quantity || 0)
      return {
      sku: currentItems[idx]?.providers?.find(p => p.is_default)?.provider_reference_number,
      productName: d.name,
      inventory: d?.stock?.unit_stock,
      theoreticalStock: d?.stock?.theoretical_stock,
      stockGap: filteredTableDataWithTotal[idx]?.stock_gap || (d?.stock?.unit_stock - d?.stock?.theoretical_stock) || 0,
      unit: d.unit,
      quantityToBuy: currentItems[idx]?.qty_to_buy || null,
      productQuantity: Math.ceil(
        parseFloat(currentItems[idx]?.qty_to_buy || 0) /
        parseFloat(currentItems[idx]?.providers?.find(p => p.is_default)?.recipe_unit_quantity || 1)
      ) || null,
      unitPrice: isNaN(unit_price) ? null : unit_price,
      totalPrice: total_price == 0 ? null : total_price,
      stockGapValue: (d?.cost_excl_tax / parseFloat(currentItems[idx]?.providers?.find(p => p.is_default)?.recipe_unit_quantity || 1)) * (filteredTableDataWithTotal[idx]?.stock_gap || (d?.stock?.unit_stock - d?.stock?.theoretical_stock) || 0),
      stockValue: ((d?.cost_excl_tax / parseFloat(currentItems[idx]?.providers?.find(p => p.is_default)?.recipe_unit_quantity || 1))  * d?.stock?.unit_stock) || 0,
    }});
  
    // 3) Build header row using t(...)
    const headers = [
      t("SKU"),
      t("ProductName"),
      t("Inventory"),
      t("TheoreticalStock"),
      t("StockGap"),
      t("Unit"),
      t("QuantityToBuy"),
      t("ProductQuantity"),
      t("UnitPrice(conditioning)"),
      t("TotalPrice(conditioning)"),
      t("ValueOfStockGap"),
      t("ValueOfCurrentStock"),
    ];
  
    // 4) Build data rows as arrays in the same order
    const rows = mapped.map(row => [
      row.sku,
      row.productName,
      row.inventory,
      row.theoreticalStock,
      row.stockGap,
      row.unit,
      row.quantityToBuy,
      row.productQuantity,
      row.unitPrice,
      row.totalPrice,
      row.stockGapValue,
      row.stockValue,
    ]);
  
    // 5) Add start and end date rows
    const restaurantNameRow = [
      `${t("RestaurantName")}: ${selectedRestaurant?.name}`
    ]
    const startDateRow = [`${t("Start date")}: ${formData?.start_date}`];
    const endDateRow = [`${t("End date")}: ${formData?.end_date}`];
  
    // 6) Combine all rows into AOA format
    const aoa = [startDateRow, endDateRow, restaurantNameRow, [], headers, ...rows];
  
    // 7) Create the worksheet & workbook
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet["!cols"] = headers.map((l) => ({ wch: Math.max(l.length * 1, 12) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stocks");
  
    // 8) Trigger download
    XLSX.writeFile(
      workbook,
      `${selectedRestaurant.name}-stocks.xlsx`
    );
  };

  const getInitialData = async (isHist = false) => {
    try {
      if(isRestaurantLoaded && !hasRetaurants) {
        return
      }
      // if (isRestaurantLoaded && !hasRetaurants ) {
      //   const resultDummyData = getSampleStocks();
      //   setStocksLoading(false);
      //   // setPageCount(resultDummyData.total_pages);
      //   // generateTableData(formatData(resultDummyData, true));
      //   generateTableData(formatData(resultDummyData));
      //   setPageCount(resultDummyData.total_pages);
      //   setCurrentPage(0);
      //   return;
      // }
      if (!selectedRestaurantId || (isHist && (fd.sortBy === 'stock.unit_stock' || fd.sortBy === 'theoretical_stock'))) {
        return;
      }
      setStocksLoading(true);
      let result = await getStockData();
      // Show only those ingredients that have providers and exclude those with "GENERIC"
      result.ingredient_stock = result?.ingredient_stock?.filter(
        stock => stock?.providers?.length > 0 && !stock.providers.some(p => p.name === "GENERIC")
      );
      setStocksLoading(false);
      result.isHist = isHist;
      generateTableData(formatData(result));
      setPageCount(result.total_pages);
      setCurrentPage(0);
    } catch (error) {
      setStocksLoading(false);
      if (error?.status !== 499) {
        setError(DEFAULT_ERROR_MESSAGE);
      }
    } finally {
    }
  };

  const getSampleStocks = (page = 1) => {
    const DUMMY_DATA_PER_PAGE = 15;
    const offset = page * DUMMY_DATA_PER_PAGE - DUMMY_DATA_PER_PAGE;
    const sortKeys = {
      good: 3,
      soon: 2,
      no_expiry: 1,
      expired: 0,
    };
    const status = getStatus().filter(
      (item) => item !== "unsold" && item !== "no_expiry"
    );

    const resultTotal = sampleStockPred
      .sort((a, b) => {
        const [first, second] = fd.sortBy.split(".");
        let aVal = a[first];
        let bVal = b[first];
        if (aVal && second) {
          aVal = aVal[second];
        }
        if (bVal && second) {
          bVal = bVal[second];
        }
        bVal = sortKeys[bVal] || bVal;
        aVal = sortKeys[aVal] || aVal;
        return fd.orderBy === "desc" ? bVal - aVal : aVal - bVal;
      })
      .filter((item) => {
        let res = true;
        if (status?.length > 0) {
          if (item.stock) {
            res = status.includes(item.stock.expiry);
          } else {
            res = false;
          }
        }
        if (formData?.products?.length && res) {
          res = formData.products.includes(item.id);
        }
        return res;
      });

    let result = resultTotal
      .filter(
        (item, index) =>
          index >= offset && index <= DUMMY_DATA_PER_PAGE + offset
      )
      .map((item) => {
        const start_date = moment(formData?.start_date).subtract(1, "day");
        const end_date = moment(formData?.end_date);
        const prediction = item.stock_prediction
          .filter(
            (pred) =>
              start_date.isSame(moment(pred.start_date)) ||
              end_date.isSame(moment(pred.end_date)) ||
              start_date.isBetween(
                moment(pred.start_date),
                moment(pred.end_date)
              )
          )
          .reduce(
            (total, num) => total + num.prevision || 0,
            getRandomNumber(0, 8)
          );
        return {
          ...item,
          stock_prediction: { prevision: Number(prediction.toFixed(2)) },
        };
      });
    if (page == 1) {
      result = result.splice(0, 13);
    } else if (page == 2) {
      result = result.splice(13, 26);
    }
    return {
      ingredient_stock: result,
      sort_by: fd.sortBy === "product" ? "name" : fd.sortBy,
      order_by: fd.orderBy.toUpperCase(),
      limit: DUMMY_DATA_PER_PAGE,
      page,
      total_pages: 2,
      total_results: resultTotal.length,
    };
  };

  const getStatus = () => {
    const mapping = {
      good_to_eat: "good",
      expired: "expired",
      soon_to_expire: "soon",
      unsold: "unsold",
      no_expiry: "no_expiry",
    };
    const status = [];
    Object.keys(mapping).forEach((ele) => {
      if (formData[ele]) {
        status.push(mapping[ele]);
      }
    });
    return status;
  };

  const getStockData = async (page = 1) => {
    const status = getStatus();

    return await request.get(
      `stocks`,
      {
        restaurant_id: selectedRestaurantId,
        ...(formData.products && { ingredients: formData.products }),
        ...timezoneFormat(
          formData?.start_date,
          formData?.end_date,
          selectedRestaurant?.timezone
        ),
        ...(status.length && { status }),
        sort_by: fd.sortBy === "product" ? "name" : fd.sortBy === "theoretical_stock" ? "stock.theoretical_stock" : fd.sortBy,        
        order_by: fd.orderBy.toUpperCase(),
        limit: ITEMS_PER_PAGE,
        page,
        ...(activeProvider !== "select_provider" && {
          provider_id: activeProvider,
        }),
      },
      true,
      true,
      true
    );
  };

  const deleteItems = () => {
    let newTableData = tableDataClone?.current?.filter(
      (f) => !state.selectedItems.map((s) => s.id).includes(f.id)
    );
    tableDataClone.current = newTableData;
    setCurrentItems(() => newTableData);
    dispatch({
      type: ACTION_TYPES.REMOVE_SELECTED_ITEMS,
      items: state.selectedItems.map((s) => s.id),
    });
  };

  const generateTableColumns = (cols) => {
    const newTableColumns = [
      {
        dataField: "name",
        caption: t("ProductName"),
        className: "fw-bold",
        style: { width: "150px" },
        headerStyle: { width: "265px" },
      },
      ...cols
        .filter((c) => c.active)
        .map(({ label, dataField, ...rest }) => ({
          ...rest,
          caption: label,
          dataField,
          className: `${dataField === "expiry" ? "" : "text-center"} ${
            dataField === "qty_to_buy" ? "text-purple" : ""
          }`,
          headerClassName: `text-center ${
            dataField === "qty_to_buy" ? "text-purple" : ""
          }`,
        })),
    ];
    setTableColumns(newTableColumns);
  }

  const generateTableData = (resultData) => {
    generateTableColumns(cols)
    tableDataClone.current = resultData;
    setCurrentItems(() => [...resultData]);
  };

  const handleSelect = (val) => {
    let { orderBy } = cloneDeep(fd);
    if (isRestaurantLoaded && !hasRetaurants) {
      if (val === "product") {
        // Toggle sort order
        orderBy = orderBy === "asc" ? "desc" : "asc";
        // Sort currentItems by name
        const sortedItems = currentItems.slice().sort((a, b) => {
          const aName = a.name ? a.name.toLowerCase() : "";
          const bName = b.name ? b.name.toLowerCase() : "";
          if (orderBy === "asc") {
            return aName.localeCompare(bName);
          } else {
            return bName.localeCompare(aName);
          }
        });
        setCurrentItems(sortedItems);
        setfd({ ...fd, sortBy: val, orderBy });
      } else if(val === "theoretical_stock"){
        orderBy = orderBy === "asc" ? "desc" : "asc";
        const sortedItems = currentItems.slice().sort((a, b) => {
          const aTotal = a.theoretical_stock ? a.theoretical_stock : 0;
          const bTotal = b.theoretical_stock ? b.theoretical_stock : 0;
          return orderBy === "asc" ? aTotal - bTotal : bTotal - aTotal;
        });
        setCurrentItems(sortedItems);
        setfd({ ...fd, sortBy: val, orderBy })
      } else if(val === "stock.unit_stock"){
        orderBy = orderBy === "asc" ? "desc" : "asc";
        const sortedItems = currentItems.slice().sort((a, b) => {
          const aTotal = a.stock?.unit_stock ? a.stock?.unit_stock : 0;
          const bTotal = b.stock?.unit_stock ? b.stock?.unit_stock : 0;
          return orderBy === "asc" ? aTotal - bTotal : bTotal - aTotal;
        });
        setCurrentItems(sortedItems);
        setfd({ ...fd, sortBy: val, orderBy })
      }
    }
    // Implement sorting on the frontend for cases where sorting isn't set up in the backend
    if (fd.sortBy === val) {
      orderBy = orderBy === "asc" ? "desc" : "asc";
    }
    if (val === "product") {
      setfd({ ...fd, sortBy: val, orderBy });
    }
    !isHistOnly && setfd({ ...fd, sortBy: val, orderBy });
  };

  const formatInput = (input) => {
    // Allow only digits, dots, and commas in the input
    const sanitizedInput = input.replace(/[^0-9.,]/g, '');

    // Replace commas with dots, allowing both as decimal points
    let normalizedInput = sanitizedInput.replace(',', '.');

    // Check if there's already a dot present, and if so, remove any additional dots
    const parts = normalizedInput.split('.');

    if (parts.length > 2) {
        // If there are multiple dots, keep the first part and join the rest without additional dots
        normalizedInput = parts[0] + '.' + parts.slice(1).join('');
    }
    return normalizedInput;
  };

  const selectChange =
    (it) =>
    ({ target: { checked } }) => {
      if (checked) {
        dispatch({
          type: ACTION_TYPES.ADD_SELECTED_ITEM,
          items: [it],
        });
        return;
      }
      dispatch({
        type: ACTION_TYPES.REMOVE_SELECTED_ITEMS,
        items: [it.id],
      });
    };

  const selectAllProducts = ({ target: { checked } }) => {
    if (checked) {
      dispatch({
        type: ACTION_TYPES.ADD_SELECTED_ITEM,
        items: currentItems,
      });
      return;
    }
    dispatch({
      type: ACTION_TYPES.REMOVE_SELECTED_ITEMS,
      items: currentItems.map((t) => t.id),
    });
  };

  const parseNumber = (input) => {
    // Convert input to a string
    input = String(input).replace(/\s/g, '');
    
    // Check if there's a comma as the decimal separator
    if (input.includes(',')) {
      // Remove dots (thousand separators) and replace comma with dot
      input = input.replace(/\./g, '').replace(',', '.');
    } else {
      // Remove commas (thousand separators)
      input = input.replace(/,/g, '');
    }
    
    return parseFloat(input);
  }  

  const tableInputChange =
    (it) =>
    ({ target: { name, value: val } }) => {
      let value, inputVal = val;
      if(name === 'stock.unit_stock') {
        inputVal = val.replace(/[^0-9.,]/g, '')
      }
      setStockValue(prev => {
        // value = value === "" ? 0 : value
        // value = value === "" ? 0 : parseInt(value);
        if(name === 'stock.unit_stock') {
          value = formatInput(val)
        } else {
          value = +val.replace(/[^\d.]/, "");
        }
        const found = prev?.findIndex(item => item.id === it.id);
        const parsedValue = parseNumber(value);
        const parsedStock = parseNumber(it.stock.unit_stock);
        if(found !== -1) {
          // prev[found].stock.unit_stock += parseFloat(value) - it.stock.unit_stock;
          prev[found].stock.unit_stock += parsedValue - parsedStock;
          return prev
        } else {
          // prev.push({...it, stock: {...it.stock, unit_stock: parseFloat(value) - it.stock.unit_stock}});
          prev.push({...it, stock: {...it.stock, unit_stock: parsedValue - parsedStock}});
          return prev
        }
      })
      {isHistOnly &&
        setStockSnapshot(prev => {
          if(name === 'stock_snapshots.unit_quantity') {
            value = formatInput(val)
          } else {
            value = +val.replace(/[^\d.]/, "");
          }
          const found = prev?.findIndex(item => item.id === it.id);
          const parsedValue = parseNumber(value);
          const parsedStock = parseNumber(it.stock_snapshots?.unit_quantity ?? 0);
          if(found !== -1) {
            prev[found].stock_snapshots.unit_quantity += parsedValue - parsedStock;
            return prev
          } else {
            prev.push({
              ...it,
              stock_snapshots: 
                {
                  ...it.stock_snapshots,
                  unit_quantity: parsedValue - parsedStock
                }
            });
            return prev;
          }
        })
      }
      let newTableData = cloneDeep(currentItems);
      const isExist = newTableData.find((f) => f.id === it.id);
      if (isExist) {
        set(isExist, name, inputVal);
        if(name === 'stock.unit_stock' || name === 'inventory'){
          set(isExist, "stock_gap" , (parseFloat(inputVal.replace(',', '.')) - isExist.theoretical_stock));
        }
        isExist.state = "update";
        tableDataClone.current = newTableData
        newTableData = newTableData.map(item => {
          if(item.id == it.id) {
            return {
              ...item,
              // [name]: parseFloat(inputVal),
              stock: name === 'stock.unit_stock' ? 
              {
                ...item.stock,
                unit_stock: parseFloat(inputVal)
              } : item.stock
              // stock: {
              //   ...item.stock,
              //   unit_stock: parseFloat(inputVal)
              // }
            }
          }
          return item
        })
        setCurrentItems(newTableData);
        if(state.selectedItems.length > 0 && state.selectedItems.find(s => s.id === it.id)) {
          dispatch({
            type: ACTION_TYPES.UPDATE_SELECTED_ITEM_DATA,
            payload: { id: it.id, name, value: Math.ceil(parseFloat(val) / it.providers[0]?.recipe_unit_quantity), qty_to_buy: parseFloat(val) },
          });
        }else {
          dispatch({
            type: ACTION_TYPES.ADD_SELECTED_ITEM,
            items: [{...it, product_quantity: Math.ceil(parseFloat(val) / it.providers[0]?.recipe_unit_quantity), qty_to_buy: parseFloat(val)}],
          });
        }
      }
    };

  const onRowSelectChanged = (col, rowData) => (ev) => {
    if (col.dataField === "stock.expiry") {
      const result = col.options?.find((o) => o.id === +ev);
      if (!result) {
        return;
      }
      const newFilteredData = cloneDeep(currentItems);
      const isExist = newFilteredData.find((f) => f.id === rowData.id);
      if (isExist) {
        set(isExist, col.dataField, result.value);
        isExist.state = "update";
        tableDataClone.current = newFilteredData;
        setCurrentItems(newFilteredData);
        dispatch({
          type: ACTION_TYPES.UPDATE_SELECTED_ITEM_DATA,
          payload: {
            id: rowData.id,
            name: col.dataField,
            value: result.value,
          },
        });
      }
    }
  };

  const getSum = (rows, defaultProvider) => {
    let defaultProviders = [];
    rows.forEach(item => {
      const provider = item.providers.find(i => i.id === defaultProvider.id)
      defaultProviders.push(provider?.price_excl_tax * Math.ceil(parseFloat(item.qty_to_buy/provider?.recipe_unit_quantity ?? 0)))
     })
      return (
        defaultProviders.reduce(function(accumulator, currentValue) {
          return accumulator + currentValue;
        }, 0)
      )
  };

  const placeOrder = () => {
    if (!state.selectedItems.length) {
      return;
    }
    const providers = state.selectedItems.map((p) => p.providers).flat();
    // const items = groupByProviders(state.selectedItems);
    // const itemsByProvider = Object.keys(items).map((i) => ({
    //   providers,
    //   products: items[i],
    //   cost: getSum(items[i]),
    // }));

    const cObjs = []
    let filteredRows = state.selectedItems?.filter((v) => v.qty_to_buy > 0)

    const getUniqueKey = item => item.providers.map(p => p.id).sort((a, b) => a.localeCompare(b)).join('-')

    for (const i in filteredRows) {
      const item = filteredRows[i]
      const uK = getUniqueKey(item)

      const alreadyProcessed = cObjs.find(({id}) => id === uK)
      if (alreadyProcessed) continue

      let ingredients = filteredRows.filter((v, index) => {
        if (getUniqueKey(v) === uK) return true
        return false
      })

      ingredients = ingredients.map(i => ({
        ...i,
        product_quantity: filteredTableDataWithTotal.find(f => f.id === i.id)?.product_quantity
      }))

      const providers = ingredients[0].providers
      let defaultProvider = providers.find(p => p.is_default) || providers[0]

      cObjs.push({
        id: uK,
        ingredients,
        providers,
        defaultProvider,
        cost: getSum(ingredients, defaultProvider)
      })
    }

    StockService.setSelectedItems(filteredRows);
    StockService.setItemsByProvider(cObjs);
    history.push({ pathname: "/stock/suggested-orders" });
  };

  const submitStock = async () => {
    if (!selectedRestaurantId) {
      setSampleRestaurantModal(true);
      return;
    }
    const updatedData = currentItems
      .filter((c) => c.state === "update" && c.stock !== null)
      .map(({ id, stock, stock_snapshots }) => {
        const stock_difference = isHistOnly ? stockSnapshot.find(s => s.id === id) : stockValue.find(s => s.id === id);
        return {
          ingredient_id: id,
          restaurant_id: selectedRestaurantId,
          ...(isHistOnly
            ? (stock_snapshots?.unit_quantity || stock_snapshots?.unit_quantity === 0) && {
                unit_quantity: String(stock_snapshots.unit_quantity).replace(',', '.'),
              }
            : (stock?.unit_stock || stock?.unit_stock === 0) && {
                unit_stock: String(stock.unit_stock).replace(',', '.'),
              }),
          ...(!isHistOnly  && { expiry: stock.expiry || "good" } ), 
          difference: isHistOnly
            ? stock_difference?.stock_snapshots?.unit_quantity ?? null
            : stock_difference?.stock?.unit_stock ?? null,
          ...(isHistOnly && { is_locked: false }),
          ...(isHistOnly && { date: formData.start_date }),
      }});
      setStockValue([])
    if (!updatedData.length) {
      return;
    }
    try {
      let result;
      setStocksLoading(true);
      if(isHistOnly) {
        result = await request.patch("/stocks/snapshots", { stock_snapshots: updatedData });
      } else {
        result = await request.post("/stocks", { stocks: updatedData }); 
      }
      if (result.status !== 200) {
        throw new Error((await result.json())?.msg);
      }
      const stocks = await getStockData(currentPage + 1);
      stocks.ingredient_stock = stocks?.ingredient_stock?.filter(stock => stock?.providers && stock?.providers?.length > 0);
      setCurrentItems(() => formatData(stocks));
      setStocksLoading(false);
      setIsModal(true);
      dispatch({
        type: ACTION_TYPES.REMOVE_SELECTED_ITEMS,
        items: state.selectedItems.map((s) => s.id),
      });
    } catch (error) {
      console.log(error);
      setError(error.message ?? DEFAULT_ERROR_MESSAGE);
    }
  };

  const freezeStock = async () => {
    if (!selectedRestaurantId) {
      setSampleRestaurantModal(true);
      return;
    }

    const updatedData = currentItems
      .filter((c) => c.state === "update" && c.stock !== null)
      .map(({ id, stock, stock_snapshots }) => {
        const stock_difference = stockSnapshot.find(s => s.id === id);
        return {
          ingredient_id: id,
          restaurant_id: selectedRestaurantId,
          unit_quantity: String(stock_snapshots.unit_quantity).replace(',', '.'),
          difference: stock_difference?.stock_snapshots?.unit_quantity ?? 0,
          date: formData.start_date,
          is_locked: true,
    }});

      // Always show the modal, but store whether we have updatedData
      setFreezeModalShow(true);
      setHasUpdates(updatedData.length > 0); // You'll need a state for this
      setUpdatedDataToFreeze(updatedData); // Store the updatedData for later use
  }

  // Then create these two separate functions:
  const freezeStockWithUpdates = async () => {
    try {
      let result;
      setStocksLoading(true);
      if(isHistOnly) {
        // First update the stock_snapshots
        result = await request.patch("/stocks/snapshots", { 
          stock_snapshots: updatedDataToFreeze 
        });
        
        if (result.status !== 200) {
          throw new Error((await result.json())?.msg);
        }
        
        // Then freeze all stock snapshots for the selected date
        const freezeAllResult = await request.patch('/stocks/snapshots/locked', {
          restaurant_id: selectedRestaurantId,
          date: formData.start_date,
        });
      }
      setStocksLoading(false);
      setIsFreezeModal(true);
      const stocks = await getStockData(currentPage + 1);
      stocks.ingredient_stock = stocks?.ingredient_stock?.filter(stock => stock?.providers && stock?.providers?.length > 0);
      setCurrentItems(() => formatData(stocks));
      dispatch({
        type: ACTION_TYPES.REMOVE_SELECTED_ITEMS,
        items: state.selectedItems.map((s) => s.id),
      });
      } catch (error) {
      console.log(error);
      setError(error.message ?? DEFAULT_ERROR_MESSAGE);
    }
  };

  const freezeAllStocks = async () => {
    try {
      setStocksLoading(true);
      let optionsObj = {
        restaurant_id: selectedRestaurantId,
        date: formData.start_date,
      }
      const result = await request.patch('/stocks/snapshots/locked', optionsObj);
      if (result.status === 200) {
        let result = await getStockData(currentPage + 1);
        result.ingredient_stock = result?.ingredient_stock?.filter(stock => stock?.providers && stock?.providers?.length > 0);
        generateTableData(formatData(result));
        setStocksLoading(false);
        setIsFreezeModal(true);
      }    
    } catch (error) {
      console.log(error);
      setStocksLoading(false);
      setError(DEFAULT_ERROR_MESSAGE);
    }
  };

  const handleDoubleClick = (index, isOpen) => {
    if (isOpen) {
      setSleaveState((p) => ({ ...p, isOpen: false }));
      setTimeout(() => {
        setSleaveState((p) => ({ ...p, index: -1 }));
      }, 300);
    } else {
      setSleaveState((p) => ({ ...p, index, isOpen: true }));
    }
  };

  const calculateSum = (data) => {
    const additionalRow = {
      id: 0,
      name: "Total",
      stock: {
        unit_stock: 0,
        theoretical_stock: 0,
      },
      
    };

    if (data.length > 0) {
      for (const item of data) {
        additionalRow.stock.unit_stock += item?.stock?.unit_stock * item?.unit_price ?? 0;
        additionalRow.stock.theoretical_stock += item?.stock?.theoretical_stock * item?.unit_price ?? 0;
      }

      additionalRow.stock.unit_stock = additionalRow.stock.unit_stock ? parseFloat(additionalRow.stock.unit_stock).toFixed(2): 0;
      additionalRow.stock.theoretical_stock = additionalRow.stock?.theoretical_stock ? parseFloat(
        additionalRow.stock?.theoretical_stock.toFixed(2)
      ): 0;
    }

    return additionalRow;
  };

  useEffect(() => {
    if (stockEvolutionData) {
      let selectStock = processedCurrentItems.find(
        (i) => i.id == stockEvolutionData?.ingredient_id
      );
      setIsStockLevelDown(
        stockEvolutionData?.evolution?.some((i) => {
          if (i.stock < selectStock?.min_stock || i.stock <= 0) {
            return true;
          }
        })
      );
    }
  });

  const [providersMap, providersArr] = useMemo(() => {
    const dataSource = hasRetaurants ? providersData : stockProviders;
    if (dataSource?.providers) {
      // Filter out GENERIC
      const filteredProviders = dataSource.providers.filter((p) => p.name !== "GENERIC");
      const prMap = filteredProviders.reduce(
        (obj, current) => ({ ...obj, [current.id]: current.name }),
        { select_provider: t("select_provider") }
      );
      const prArr = [
        { id: "select_provider", name: t("select_provider") },
        ...filteredProviders
      ];
      return [prMap, prArr];
    }
    return [{}, []];
  }, [providersData, stockProviders]);

  useEffect(() => {
    (async () => {
      if (resetStock) {
        let result = await getStockData();
        result.ingredient_stock = result?.ingredient_stock?.filter(stock => stock?.providers && stock?.providers?.length > 0);
        generateTableData(formatData(result));
        setPageCount(result.total_pages);
        setCurrentPage(0);
      }
    })()
  }, [resetStock]) 

  useEffect(() => {
    if(documentFormat === 'excel') {
      downloadData()
      setDocumentFormat(null)
    }else if (documentFormat === 'pdf') {
      exportPdf(pdfRef, setLoading, 'stocks', selectedRestaurant.name)
      setDocumentFormat(null)
    }
  }, [documentFormat])

  const transferIngredients = () => {
    setIsTransferModel(true);
  }

  return (
    <div className={`leftcontent leftcontent-stock ${isFilterShown ? "hidden-left" : ""}`}>
      {isModal &&
        <UploadModal
          show={isModal}
          onHide={() => setIsModal(false)}
          title={t("Stock updated !")}
          subTitle={t("Your stock has been successfully updated.")}
        />
      }
      {isFreezeModal &&
        <UploadModal
          show={isFreezeModal}
          onHide={() => setIsFreezeModal(false)}
          title={t("Stock frozen !")}
          subTitle={t("Your stock has been successfully frozen.")}
        />
      }
      <TransferModal show={isTransferModel} onHide={() => setIsTransferModel(false)}/>
      {showConfirmDownlaodModal && <ConfirmDownlaodModal
        show={showConfirmDownlaodModal}
        setDocumentFormat={setDocumentFormat}
        onHide={() => {
          setShowConfirmDownlaodModal(false)
        }}
        className=""
      />}
      <DeleteModal
        show={freezeModalShow}
        onHide={() => setFreezeModalShow(false)}
        onPositiveClicked={() => {
          setFreezeModalShow(false);
          if (hasUpdates) {
            freezeStockWithUpdates(); // Call this when there are updates
          } else {
            freezeAllStocks(); // Call this when no updates
          }
        }}
        modalData={{
          title: t(`FreezeStock`),
          description: t(
            `Are you sure you want to freeze stock ? You cannot undo this action.`
          ),
          positiveBtnTitle: t(`Yes, freeze all stocks`),
        }}
      />
      <div className="card m-10 mb-0">
        <div className="card-header stock-header">
          <h2>{t("StockDetails")}</h2>
          <div className="stock-header-actions">
            {Boolean(state.selectedItems.length) && (
              <img
                src={TrashIcon}
                onClick={deleteItems}
                className="trash-icon cursor-pointer"
                alt="trash-icon"
              />
            )}

            <button className="btn btn-white btn-icon download-btn">
              <img onClick={() => setShowConfirmDownlaodModal(true)} src={TelechargerIcon} alt="download-icon" className="m-0" />
            </button>

            {Boolean(providersArr.length) && (
              <Dropdown onSelect={(val) => setActiveProvider(val)}>
                <Dropdown.Toggle variant="link" className="btn btn-white dropdown-toggle btn-icon provider-dropdown-toggle">
                  {providersMap[activeProvider]}
                </Dropdown.Toggle>
                <Dropdown.Menu className="provider-dropdown-menu">
                  {providersArr.map((d, i) => (
                    <Dropdown.Item key={i} eventKey={d.id} className="provider-dropdown-item">
                      {d.name}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            )}

            <Dropdown onSelect={handleSelect}>
              <Dropdown.Toggle variant="link" className="btn btn-white dropdown-toggle btn-icon sort-dropdown-toggle">
                {fd.orderBy !== "asc" ? (
                  <img src={ArrowDownIcon} alt="arrow-down" className="sort-arrow-icon" />
                ) : (
                  <img src={ArrowUpIcon} alt="arrow-up" className="sort-arrow-icon" />
                )}
                <img
                  src={SortIcon}
                  alt="sort-icon"
                  className={`sort-icon ${fd.orderBy === "asc" ? "rotate" : ""}`}
                />
                {cols.find((c) => c.dataField === fd.sortBy)?.dataField === "total_price"
                  ? t("ProductPrice")
                  : cols.find((c) => c.dataField === fd.sortBy)?.label}
              </Dropdown.Toggle>
              <Dropdown.Menu className="sort-dropdown-menu">
                {cols
                  .filter(
                    (c) =>
                      (c.active === true || c.dataField === "product") &&
                      !["expiry", "unit", "qty_to_buy", "product_quantity", "total_price", "stock_gap"].includes(
                        c.dataField
                      )
                  )
                  .map((d, i) => (
                    <Dropdown.Item
                      key={i}
                      eventKey={d.dataField === "product_price" ? "total_price" : d.dataField}
                    >
                      {d.label}
                    </Dropdown.Item>
                  ))}
              </Dropdown.Menu>
            </Dropdown>

            {!hasRetaurants && (
              <button
                className="stock-transfer-btn place-order-btn"
                onClick={transferIngredients}
              >
                {t("TransferStock")}
              </button>
            )}
          </div>
        </div>

        {stocksLoading && (
          <div className="w-100 d-flex justify-content-center card-spinner-container">
            <Spinner animation="border" variant="primary" />
          </div>
        )}

        {!stocksLoading &&
          <div className="card-body">
            <div className="gcontainer">
              <CustomTable
                columns={tableColumns}
                data={filteredTableDataWithTotal}
                selectChange={selectChange}
                selectedProducts={state.selectedItems.map((it) => it.id)}
                selectAllProducts={selectAllProducts}
                onInputChange={tableInputChange}
                pdfRef={pdfRef}
                onRowSelectChanged={onRowSelectChanged}
                selectedKey="id"
                onRowDoubleClick={!isHistOnly ? handleDoubleClick : undefined}
                SleaveContent={StockEvolution}
                stockEvolutionData={stockEvolutionData}
                isStocksLevelDown={isStocksLevelDown}
                tableName="stocks"
              />

              <Row>
                <div className="d-flex justify-content-end mt-3">
                  <ReactPaginate
                    nextLabel={`${t("Next")}   >`}
                    onPageChange={handlePageClick}
                    forcePage={currentPage}
                    pageRangeDisplayed={3}
                    marginPagesDisplayed={2}
                    pageCount={pageCount}
                    previousLabel={`<   ${t("Back")}`}
                    pageClassName="page-item"
                    pageLinkClassName="page-link"
                    previousClassName="page-item"
                    previousLinkClassName="page-link"
                    nextClassName="page-item"
                    nextLinkClassName="page-link"
                    breakLabel="..."
                    breakClassName="page-item"
                    breakLinkClassName="page-link"
                    containerClassName="pagination"
                    activeClassName="active"
                    renderOnZeroPageCount={null}
                  />
                </div>

                {currentItems.length > 0 && (
                  <div className="d-flex justify-content-end mt-3 selected-prod-div">
                    {state.selectedItems?.length > 0 && (
                      <div className="d-flex flex-column me-3">
                        <label className="d-flex  justify-content-end">
                          {state.selectedItems?.length}
                        </label>
                        <label>products selected</label>
                      </div>
                    )}
                    <button className="float-end place-order-btn me-3" onClick={submitStock}>
                      {t("Save")}
                    </button>

                    <button
                      className="float-end place-order-btn"
                      onClick={isHistOnly ? freezeStock : placeOrder}
                    >
                      {isHistOnly ? t("FreezeStock") : t("PlaceOrder")}
                    </button>
                  </div>
                )}
              </Row>
            </div>
          </div>
        }
      </div>
    </div>
  );
}

export default LeftSide;
