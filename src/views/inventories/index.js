import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Button } from 'react-bootstrap';

import { useFilterData } from "contexts/FilterContextManagment";
import { useUserData } from "contexts/AuthContextManagement";
import { useLoading } from "contexts/LoadingContextManagement";

import DeleteModal from "views/commonViews/DeleteModal";
import Categories from "./Categories";
import UploadModal from "./UploadModal";
import CategoriesRightSide from "./RightSidePanel";
import Providers from "./Providers";
import Router from "../../routes/router";
import request from "services/request";

import { DEFAULT_ERROR_MESSAGE } from "common/constants";
import "./index.scss";

function Inventories() {
  const { t } = useTranslation();
  const { setError } = useLoading();
  const location = useLocation();

  const { selectedRestaurantId, isFilterShown } = useUserData();
  const { selectedInventoryCategories, setShowCategoriesList } = useFilterData();

  const [clear, setClear] = useState(false);
  const [isCategoryView, setIsCategoryView] = useState(true);
  const [isFreezeModal, setIsFreezeModal] = useState(false);
  const [freezeModalShow, setFreezeModalShow] = useState(false);
  const [isHistoricDate , setIsHistoricDate] = useState(false);
  const [formData, setFormData] = useState({
    ingredients: []
  });

  useEffect(() => {
    const currentRoute = Router.find((r) => r.path === location.pathname);
    if (currentRoute?.path === "/stock") {
      setShowCategoriesList(true);
    }
  }, [location.pathname, setShowCategoriesList]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const isPast = formData.start_date < today && formData.end_date < today;
    setIsHistoricDate(isPast);
  }, [formData.start_date, formData.end_date]);  

  const onApply = (params) => setFormData({ ...params });

  const handleFreezeClick = () => {
    setFreezeModalShow(true);
  };

  const freezeAllStocks = async () => {
    setFreezeModalShow(false); // hide the modal
    try {
      let optionsObj = {
        date: formData.start_date,
        restaurant_id: selectedRestaurantId,
      };
      const result = await request.patch('/stocks/snapshots/locked', optionsObj);
      if (result.status === 200) {
        setIsFreezeModal(true); // show success modal
      }
    } catch (error) {
      console.log(error);
      setError(DEFAULT_ERROR_MESSAGE);
    }
  };

  return (
    <>
      {isFreezeModal &&
        <UploadModal
          show={isFreezeModal}
          onHide={() => setIsFreezeModal(false)}
          title={t("Stock frozen !")}
          subTitle={t("Your stock has been successfully frozen.")}
        />
      }
      <DeleteModal
        show={freezeModalShow}
        onHide={() => setFreezeModalShow(false)}
        onPositiveClicked={() => {
          setFreezeModalShow(false);
          freezeAllStocks();
        }}
        modalData={{
          title: t(`FreezeStock`),
          description: t(
            `Are you sure you want to freeze stock ? You cannot undo this action.`
          ),
          positiveBtnTitle: t(`Yes, freeze all stocks`),
        }}
      />
      <div className={`leftcontent leftcontent-stock inventory ${isFilterShown ? "hidden-left" : ""}`}>
        <div className="nav-wrapper divider">
          <ul className="navbtns mb-0">
            <li className={`${isCategoryView ? "active" : ""}`}>
              <button
                className={`nav-link ${isCategoryView ? "active" : ""}`}
                onClick={() => {
                  setIsCategoryView(true)
                  setShowCategoriesList(true)
                }}              >
                {t("Categories")}
              </button>
            </li>
            <li className={`${!isCategoryView ? "active" : ""}`}>
              <button
                className={`nav-link ${!isCategoryView ? "active" : ""}`}
                onClick={() => {
                  setIsCategoryView(false)
                  setShowCategoriesList(false)
                }}              >
                {t("Providers")}
              </button>
            </li>
          </ul>
          
          {(isHistoricDate && selectedInventoryCategories === '') && (
            <Button
              size="lg"
              className="button save freeze-button"
              onClick={handleFreezeClick}
            >
              {t("FreezeStock")}
            </Button>
          )}
        </div>
        <div className="after-divider-container">
          {isCategoryView && <Categories formData={formData} clear={clear} isHistoricDate={isHistoricDate}/>}
          {!isCategoryView && <Providers formData={formData} clear={clear} isHistoricDate={isHistoricDate}/>}
        </div>
      </div>
      <CategoriesRightSide onApply={onApply} formData={formData} setClear={(clear) => setClear(clear)}/>
    </>
  );
}

export default Inventories;