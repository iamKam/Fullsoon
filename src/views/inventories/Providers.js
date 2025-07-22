import { useState, useEffect } from 'react';
import { Row, Button, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import ReactPaginate from "react-paginate";
import moment from "moment";

import { useUserData } from "contexts/AuthContextManagement";
import { useLoading } from "contexts/LoadingContextManagement";
import { useFilterData } from "contexts/FilterContextManagment";
import { timezoneFormat } from "common/utils";

import DeleteModal from "views/commonViews/DeleteModal";
import useFetch from "customHooks/useFetch";
import request from "services/request";

import { INGREDIENT_CATEGORIES } from "./InventoryUtils";
import { ITEMS_PER_PAGE, DEFAULT_ERROR_MESSAGE } from "common/constants";

import UploadModal from "./UploadModal";
import IngredientCard from './IngredientCard';
import CategoryCard from './CategoryCard';

import getInventoryCategories from "../../data/inventory_categories.json";
import getInventoryProviders from "../../data/inventory_providers.json";

function Providers({formData, isHistoricDate}) {
  const { t } = useTranslation();

  const { setError } = useLoading();
  const { selectedRestaurant, selectedRestaurantId, setSampleRestaurantModal } = useUserData();
  const { showProvidersList, setShowProvidersList, setShowCategoriesList, updateInventorySelectedCategories } = useFilterData();

  const [isModal, setIsModal] = useState(false); 
  const [isHistOnly , setIsHistOnly] = useState(isHistoricDate);
  const [hasUpdates, setHasUpdates] = useState(false);
  const [isFreezeModal, setIsFreezeModal] = useState(false);
  const [freezeModalShow, setFreezeModalShow] = useState(false);
  const [providerIds, setProviderId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [updatedDataToFreeze, setUpdatedDataToFreeze] = useState([]);
  const [isCategoryView, setIsCategoryView] = useState(showProvidersList);

  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [fd, setFd] = useState({
    orderBy: "desc",
    sortBy: "stock.unit_stock",
  });
  const { loading, data: providersData } = useFetch('providers/provider-with-ingredient-categories', {
    restaurant_id: selectedRestaurantId,
  });

  useEffect(() => {
    setIsHistOnly(isHistoricDate);
  }, [isHistoricDate]);

  useEffect(() => {
    setIsCategoryView(showProvidersList);
    if(isCategoryView){
      updateInventorySelectedCategories("");
      setShowCategoriesList(true);
    }
  }, [showProvidersList]);

  useEffect(() => {
    if (selectedCategory !== null) {
      const today = moment().format('YYYY-MM-DD');
      const start = formData?.start_date;
      const end = formData?.end_date;
      const isPast = moment(start).isBefore(today) && moment(end).isBefore(today);
      setIsHistOnly(isPast);
      getIngredientsStock(selectedCategory, providerIds, 1, isPast);
    }
  }, [formData]);

  const calculateStock = (ingredient, isHistOnlyParam) => {
    let totalStock = 0;
    const defaultProvider = ingredient.providers?.find(p => p.is_default);
    const conditioningQuantity1 = parseFloat(defaultProvider?.conditioning_quantity_1) || 1;
    const conditioningQuantity2 = parseFloat(defaultProvider?.conditioning_quantity_2) || 0;
    const recipeUnitQuantity = parseFloat(defaultProvider?.recipe_unit_quantity) || 1; 

    const haveConditioning1 = defaultProvider?.conditioning_quantity_1 !== null;
    const haveConditioning2 = defaultProvider?.conditioning_quantity_2 !== null;
    const haveConditioning3 = defaultProvider?.recipe_unit_quantity !== null;
    
    if (isHistOnlyParam) {
      const snapshot = ingredient?.stock_snapshots?.[0];
      totalStock = parseFloat(snapshot?.unit_quantity ?? 0);
    } else {
      totalStock = parseFloat(ingredient?.stock?.unit_stock ?? 0);
    }
    
    let packages = 0;
    let bags = 0;
    let pieces = 0;
    
    let remainingStock = totalStock;

    if (remainingStock > 0) {
      if (haveConditioning1) {
        packages = Math.floor((remainingStock / recipeUnitQuantity) * conditioningQuantity1);
        remainingStock %= (recipeUnitQuantity / conditioningQuantity1);
      } 

      if (remainingStock > 0 && haveConditioning2 && conditioningQuantity2 > 0) {
        bags = Math.floor(( (remainingStock / (recipeUnitQuantity - conditioningQuantity1)) * recipeUnitQuantity) / (recipeUnitQuantity / conditioningQuantity2));
        remainingStock -= bags * (recipeUnitQuantity / conditioningQuantity2);
      }

      if (haveConditioning3) {
        pieces = Math.max(remainingStock, 0);
      }
    }

    return { packages, bags, pieces };
  };

  const getIngredientsStock = async (category, providerIds, page = 1, isHistOnlyParam = isHistOnly) => {
    if(!selectedRestaurantId){
      setIngredients(getInventoryCategories);
      setCurrentPage(0);
      setIsCategoryView(false);
      setShowCategoriesList(false);
      setSelectedCategory(category);
      updateInventorySelectedCategories({ category: category.label, color: category.color });
      return;
    }

    setSelectedCategory(category);
    updateInventorySelectedCategories({ category: category.label, color: category.color });

    const payload = {
      restaurant_id: selectedRestaurantId,
      provider_id: providerIds,
      categories: category?.value,
      ...timezoneFormat(
        formData?.start_date,
        formData?.end_date,
        selectedRestaurant?.timezone
      ),
      ...(formData.ingredients && { ingredients: formData.ingredients }),
      sort_by: fd.sortBy === "product" ? "name" : fd.sortBy === "theoretical_stock" ? "stock.theoretical_stock" : fd.sortBy,        
      order_by: fd.orderBy.toUpperCase(),
      limit: ITEMS_PER_PAGE,
      page,
    };

    try {
      const response = await request.get('stocks', payload);
      const processedIngredients = response?.ingredient_stock?.map((ingredient) => {
        const stockValues = calculateStock(ingredient, isHistOnlyParam);
        return {
          ...ingredient,
          ...stockValues,
          stock: {
            ...ingredient.stock,
            unit_stock: ingredient?.stock?.unit_stock ?? 0, // Default to 0 if null
          },
          ...(isHistOnlyParam
            ? {
                stock_snapshots: {
                  ...ingredient.stock_snapshots?.[0],
                  unit_quantity: ingredient?.stock_snapshots?.[0]?.unit_quantity ?? 0,
                  theoretical_stock: ingredient?.stock_snapshots?.[0]?.theoretical_stock ?? 0,
                  is_locked: ingredient?.stock_snapshots?.[0]?.is_locked ?? false,
                  date: ingredient?.stock_snapshots?.[0]?.date ?? formData.start_date,
                },
              }
            : {}),
          original_stock: ingredient?.stock?.unit_stock ?? 0,
          original_stock_snapshots_unit_quantity: ingredient?.stock_snapshots?.[0]?.unit_quantity ?? 0,
        };
      });
      // Show only those ingredients that have providers and exclude those with "GENERIC"
      const updatedIngredients = processedIngredients.filter(
        ingredient => ingredient?.providers?.length > 0 && !ingredient.providers.some(p => p.name === "GENERIC")
      )

      setIngredients(updatedIngredients);
      setPageCount(response?.total_pages);
      setCurrentPage(0);
      setIsCategoryView(false);
      setShowProvidersList(false);
      setShowCategoriesList(false);
    } catch (error) {
      setIngredients([]);
      setIsCategoryView(false);
      setShowProvidersList(false);
      setShowCategoriesList(false);
      console.error('Error fetching ingredients:', error);
    }
  };

  const handlePageClick = async (ev) => {
    try {
      await getIngredientsStock(selectedCategory, providerIds, ev.selected + 1);
      setCurrentPage(ev.selected);
    } catch (error) {
      console.log(error);
      setError(DEFAULT_ERROR_MESSAGE);
    }
  };

  const updateBags = (ingredient, increment) => {
    setIngredients((prevIngredients) =>
      prevIngredients.map((item) =>
        item.id === ingredient.id
          ? {
              ...item,
              state: "update",
              bags: Math.max(0, (item.bags || 0) + increment),
              stock: {
                ...item.stock,
                unit_stock: Math.max(0, item?.stock?.unit_stock + increment * (ingredient?.providers?.find(p => p?.is_default)?.conditioning_quantity_2 || 1)),
              },
              stock_snapshots: {
                ...item.stock_snapshots,
                unit_quantity: Math.max(0, item?.stock_snapshots?.unit_quantity + increment * (ingredient?.providers?.find(p => p?.is_default)?.conditioning_quantity_2 || 1)),
              },
            }
          : item
      )
    );
  };

  const updatePackages = (ingredient, increment) => {
    setIngredients((prevIngredients) =>
      prevIngredients.map((item) =>
        item.id === ingredient.id
          ? {
              ...item,
              state: "update",
              packages: Math.max(0, (item?.packages || 0) + increment),
              stock: {
                ...item.stock,
                unit_stock: Math.max(
                  0,
                  ((item.stock?.unit_stock ?? 0) +
                    increment * 
                    (ingredient.providers?.find(p => p.is_default)?.recipe_unit_quantity || 1) 
                  )
                ),
              },
              stock_snapshots: {
                ...item.stock_snapshots,
                unit_quantity: Math.max(
                  0,
                  ((item.stock_snapshots?.unit_quantity ?? 0) +
                    increment * 
                    (ingredient.providers?.find(p => p.is_default)?.recipe_unit_quantity || 1)
                  )
                ),
              }
            }
          : item
      )
    );
  };
  
  const updatePieces = (ingredient, increment) => {
    setIngredients((prevIngredients) =>
      prevIngredients.map((item) =>
        item.id === ingredient.id
          ? {
              ...item,
              state: "update",
              pieces: Math.max(0, (item.pieces || 0) + increment),
              stock: {
                ...item.stock,
                unit_stock: Math.max(0, item?.stock?.unit_stock + increment),
              },
              stock_snapshots: {
                ...item.stock_snapshots,
                unit_quantity: Math.max(0, item?.stock_snapshots?.unit_quantity + increment),
              }
            }
          : item
      )
    );
  };
  
  const submitStock = async () => {
    if (!selectedRestaurantId) {
      setSampleRestaurantModal(true);
      return;
    }
  
    const updatedData = ingredients
    .filter((ingredient) => ingredient.state === "update")
    .map((ingredient) => {
      const { id, stock_snapshots, stock, original_stock_snapshots_unit_quantity, original_stock, expiry } = ingredient;

      const unitStock = isHistOnly ? stock_snapshots?.unit_quantity ?? 0 : stock?.unit_stock ?? 0;
      const difference = unitStock - (isHistOnly ? original_stock_snapshots_unit_quantity ?? 0 : original_stock ?? 0);

      return {
        ingredient_id: id,
        restaurant_id: selectedRestaurantId,
        difference,
        ...(isHistOnly
          ? {
              unit_quantity: unitStock,
              is_locked: false,
              date: formData.start_date,
            }
          : {
              unit_stock: unitStock,
              expiry: expiry || "good",
            }
          ),
      };
    });

    if (!updatedData.length) {
      return;
    }
  
    try {
      let result;
      if(isHistOnly) {
        result = await request.patch("/stocks/snapshots", { stock_snapshots: updatedData });
      } else {
        result = await request.post("/stocks", { stocks: updatedData }); 
      }

      if (result.status !== 200) {
        throw new Error((await result.json())?.msg);
      }
      setIsModal(true);
      setShowCategoriesList(true);
    } catch (error) {
      console.log(error);
    }
  };

  const cancelStock = () => {
    setIsCategoryView(true);
    updateInventorySelectedCategories("");
  };

  const freezeStock = async () => {
    if (!selectedRestaurantId) {
      setSampleRestaurantModal(true);
      return;
    }

    const updatedData = ingredients
      .filter((ingredient) => ingredient.state === "update").map((ingredient) => {
      const unit_quantity =  ingredient?.stock_snapshots?.unit_quantity ?? 0;
      // Calculate the difference in stock
      const difference = unit_quantity - ingredient?.original_stock_snapshots_unit_quantity;
  
      return {
        ingredient_id: ingredient.id,
        restaurant_id: selectedRestaurantId,
        unit_quantity,
        difference,
        date: formData.start_date,
        is_locked: true
      };
    });

    // Always show the modal, but store whether we have updatedData
    setFreezeModalShow(true);
    setHasUpdates(updatedData.length > 0); // You'll need a state for this
    setUpdatedDataToFreeze(updatedData); // Store the updatedData for later use
  }

  const freezeAllStocks = async () => {
    try {
      let optionsObj = {
        provider_id: providerIds,
        categories: selectedCategory?.value,
        date: formData.start_date,
        restaurant_id: selectedRestaurantId,
      }
      const result = await request.patch('/stocks/snapshots/locked', optionsObj);
      if (result.status === 200) {
        let result = await getIngredientsStock(selectedCategory, providerIds, currentPage + 1);
        setIsFreezeModal(true);
      }    
    } catch (error) {
      console.log(error);
      setError(DEFAULT_ERROR_MESSAGE);
    }
  };
  
  const freezeStockWithUpdates = async () => {
    try {
      let result;
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
          categories: selectedCategory?.value,
          date: formData.start_date,
          restaurant_id: selectedRestaurantId,
        });
        if (freezeAllResult.status === 200) {
          let result = await getIngredientsStock(selectedCategory, providerIds, currentPage + 1);
          setIsFreezeModal(true);
        }  
      }
      setIsFreezeModal(true);
      } catch (error) {
      console.log(error);
      setError(error.message ?? DEFAULT_ERROR_MESSAGE);
    }
  };

  return (
    <div className="providers-container" style={{
      display: loading ? 'flex' : 'block',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100%'
    }}>
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
          subTitle={t("YourStockHasBeenSuccessfullyFrozen")}
        />
      }
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
      <>
        {loading ? (
          <div className="w-100 d-flex justify-content-center">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : isCategoryView ? (
          (selectedRestaurantId ? providersData?.providers : getInventoryProviders?.providers)
            ?.filter(provider => 
              INGREDIENT_CATEGORIES.some(category => 
                category.value.some(catValue => provider.ingredient_categories.includes(catValue))
              )
            )
          .map((provider) => (
              <div key={provider.id} className="provider-container">
                <div className="provider-header">
                  <div className="provider-circle">
                    {provider?.name?.[0]?.toUpperCase()}
                  </div>
                  <h2 className="provider-name">{provider?.name.toUpperCase()}</h2>
                  <div className="provider-line"></div>
                </div>
                <Row>
                  {INGREDIENT_CATEGORIES.filter(category => 
                    category.value.some(catValue => provider?.ingredient_categories?.includes(catValue))
                  ).map((filteredCategory, i) => (
                    <CategoryCard
                      key={i}
                      category={filteredCategory}
                      providerId={provider.id}
                      getIngredientsStock={() => {
                        setProviderId(provider?.id);
                        getIngredientsStock(filteredCategory, provider?.id);
                      }}
                    />
                  ))}
                </Row>
              </div>
            ))
        ) : (
          <div className="gcontainer">
            <div className="card_wrapper">
              {ingredients.length > 0 ? (
                ingredients.map((ingredient, i) => (
                  <IngredientCard
                    key={i}
                    ingredient={ingredient}
                    updatePackages={updatePackages}
                    updateBags={updateBags}
                    updatePieces={updatePieces}
                  />
                ))
              ) : (
                <div className="no_ingredients">{t('NoIngredientsAvailable')}</div>
              )}
            </div>

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

              {ingredients.length > 0 && (
                <div className="button-wrapper">
                  <Button size="lg" className="button cancel" onClick={cancelStock}>{t("Back")}</Button>
                  <Button size="lg" className="button save" onClick={submitStock}>{t("SaveChanges")}</Button>
                  {isHistOnly && 
                    <Button
                      size="lg" className="button save"
                      onClick={freezeStock}
                    >
                      {t("FreezeStock")}
                    </Button>
                  }
                </div>
              )}
            </Row>
          </div>
        )}
      </>
    </div>
  );
}

export default Providers;