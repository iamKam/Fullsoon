import React from 'react';
import { useTranslation } from 'react-i18next';
import { OverlayTrigger, Tooltip } from "react-bootstrap";

const IngredientCard = ({ ingredient, updatePackages, updateBags, updatePieces }) => {
  const { t } = useTranslation();

  const stockSnapshot = ingredient?.stock_snapshots;
  const provider = ingredient?.providers?.find(p => p?.is_default);

  const haveConditioning1 = !provider?.conditioning_quantity_1;
  const haveConditioning2 = !provider?.conditioning_quantity_2;
  const haveConditioning3 = !provider?.recipe_unit_quantity;

  const renderTooltip = (value) => (props) =>
    (
      <Tooltip id="button-tooltip" {...props}>
        {value}
      </Tooltip>
    );

  return (
    <div className={`fruit_card`}>
      <div className='card_header'>
        <div className='card_img'>
          <img src={ingredient.image_path ?? `${process.env.PUBLIC_URL}/images/no-image-icon.png`} alt="No Image" />
        </div>
        <OverlayTrigger
          placement="top"
          overlay={renderTooltip(ingredient.name)}
          trigger={['hover', 'focus']}
        >
          <span className='card_title'>{ingredient.name}</span>
        </OverlayTrigger>
        <span className='card_bio'>(BIO)</span>
      </div>
      <div className='card_body'>
        <div className='counter'>
          <div className={`counter_holder ${(haveConditioning1 || stockSnapshot?.is_locked) ? 'disabled' : ''}`}>
            <label className='counter_label' htmlFor=''>{t(provider?.conditioning_name_1 ?? 'NA')}</label>
            <div className='counter_wrapper'>
              <button
                className='counter_btn btn-left'
                disabled={haveConditioning1 || stockSnapshot?.is_locked}
                onClick={(e) => {
                  e.stopPropagation();
                  updatePackages(ingredient, -1);
                }}
              >
                -
              </button>
              <input
                type="number"
                className='counter_value'
                value={(() => {
                  const n = Number(ingredient.packages) || 0;
                  return Number.isInteger(n) ? n : n.toFixed(2);
                })()}
                disabled={haveConditioning1 || stockSnapshot?.is_locked}
                onChange={(e) => {
                  e.stopPropagation();
                  const newValue = parseFloat(e.target.value, 10) || 0;
                  updatePackages(ingredient, newValue - ingredient.packages);
                }}
              />
              <button
                className='counter_btn btn-right'
                disabled={haveConditioning1 || stockSnapshot?.is_locked}
                onClick={(e) => {
                  e.stopPropagation();
                  updatePackages(ingredient, 1);
                }}
              >
                +
              </button>
            </div>
          </div>
          
          <div className={`counter_holder ${(haveConditioning2 || stockSnapshot?.is_locked) ? 'disabled' : ''}`}>
            <label className='counter_label' htmlFor=''>{t(provider?.conditioning_name_2 || "NA")}</label>
            <div className='counter_wrapper'>
              <button
                className='counter_btn btn-left'
                disabled={haveConditioning2 || stockSnapshot?.is_locked}
                onClick={(e) => {
                  e.stopPropagation();
                  updateBags(ingredient, -1);
                }}
              >
                -
              </button>
              <input
                type="number"
                className='counter_value'
                value={(() => {
                  const n = Number(ingredient.bags) || 0;
                  return Number.isInteger(n) ? n : n.toFixed(2);
                })()}
                disabled={haveConditioning2 || stockSnapshot?.is_locked}
                onChange={(e) => {
                  e.stopPropagation();
                  const newValue = parseFloat(e.target.value, 10) || 0;
                  updateBags(ingredient, newValue - ingredient.bags);
                }}
              />
              <button
                className='counter_btn btn-right'
                disabled={haveConditioning2 || stockSnapshot?.is_locked}
                onClick={(e) => {
                  e.stopPropagation();
                  updateBags(ingredient, 1);
                }}
              >
                +
              </button>
            </div>
          </div>

          <div className={`counter_holder ${(haveConditioning3 || stockSnapshot?.is_locked) ? 'disabled' : ''}`}>
            <label className='counter_label' htmlFor=''>{t(provider?.recipe_unit ?? 'NA')}</label>
            <div className='counter_wrapper'>
              <button
                className='counter_btn btn-left'
                disabled={haveConditioning3 || stockSnapshot?.is_locked}
                onClick={(e) => {
                  e.stopPropagation();
                  updatePieces(ingredient, -1);
                }}
              >
                -
              </button>
              <input
                type="number"
                className='counter_value'
                value={(() => {
                  const n = Number(ingredient.pieces) || 0;
                  return Number.isInteger(n) ? n : n.toFixed(2);
                })()}
                disabled={haveConditioning3 || stockSnapshot?.is_locked}
                onChange={(e) => {
                  e.stopPropagation();
                  const newValue = parseFloat(e.target.value, 10) || 0;
                  updatePieces(ingredient, newValue - ingredient.pieces);
                }}
              />
              <button
                className='counter_btn btn-right'
                disabled={haveConditioning3 || stockSnapshot?.is_locked}
                onClick={(e) => {
                  e.stopPropagation();
                  updatePieces(ingredient, 1);
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientCard;