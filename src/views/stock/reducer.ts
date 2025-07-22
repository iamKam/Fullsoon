import { cloneDeep } from "common/utils";
import { set } from "lodash";

export const ACTION_TYPES = {
  MULTI: "multi",
  SELECTED_ITEMS: "selectedItems",
  ADD_SELECTED_ITEM: "addSelectedItem",
  REMOVE_SELECTED_ITEMS: "removeSelectedItems",
  UPDATE_SELECTED_ITEM_DATA: "updateSelectedItemData",
};

export const initialState = {
  selectedItems: [],
};

export default function reducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SELECTED_ITEMS:
      return { ...state, selectedItems: action.selectedItems };

    case ACTION_TYPES.ADD_SELECTED_ITEM: {
      const key = "id";
      const arrayUniqueByKey = (array) => [
        ...new Map(array.map((item) => [item[key], item])).values(),
      ];

      return {
        ...state,
        selectedItems: arrayUniqueByKey([
          ...state.selectedItems,
          ...action.items,
        ]),
      };
    }

    case ACTION_TYPES.REMOVE_SELECTED_ITEMS: {
      const selectedItems = state.selectedItems.filter(
        (s) => !action.items.includes(s.id)
      );
      return { ...state, selectedItems };
    }

    case ACTION_TYPES.UPDATE_SELECTED_ITEM_DATA: {
      const { id, name, value, qty_to_buy } = action.payload;
      const newSelectedItems = cloneDeep(state.selectedItems);
      const item = newSelectedItems.find((s) => s.id === id);
      if (item) {
        set(item, name, value);
        if(name === 'qty_to_buy'){ // update product_quantity as well
          set(item, 
            'product_quantity', 
            Math.ceil(parseFloat(qty_to_buy || 0) / parseFloat(item.providers[0].recipe_unit_quantity || 0))
          );
          set(item, 
            'qty_to_buy', 
            qty_to_buy
          );
        }
      }
      return { ...state, selectedItems: newSelectedItems };
    }

    case ACTION_TYPES.MULTI:
      return { ...state, ...action.payload };

    default:
      throw new Error();
  }
}
