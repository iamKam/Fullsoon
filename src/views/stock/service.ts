import { set } from "lodash";

/**
 * To calculate the sum of items in the list
 * @param rows An list of items
 * @returns sum
 */
const getSum = (rows) => {
  return rows.reduce((previousValue, currentValue) => {
    return (
      previousValue +
      parseFloat(currentValue.product_price) *
        (currentValue.product_quantity || 0)
    );
  }, 0);
};

/**
 * Service to share the data across the stock screen, like stock-page, suggested-orders
 * edit-suggested-order, order-to-provider
 */

class StockService {
  selectedItems = [];
  itemsByProvider = [];

  setSelectedItems(items) {
    this.selectedItems = items;
  }

  getSelectedItems() {
    return this.selectedItems;
  }

  setItemsByProvider(items) {
    this.itemsByProvider = items;
  }

  getItemsByProvider(id: null | number = null) {
    if (id) {
      return  this.itemsByProvider.find((it: any) => {
        return it?.ingredients.find(p => {
          if(p.id === id){
            return true
          }
          return false
        })
      });
    }
    return this.itemsByProvider;
  }

  /**
   * update an item(order) from the passing provider items
   * @param providerId
   * @param id
   * @param name
   * @param value
   */
  updateItemOfProvider(
    providerId: number,
    id: number,
    name: string,
    value: string
  ) {
    let selectedProvider: any = this.getItemsByProvider(providerId);
    if (selectedProvider && selectedProvider.products) {
      const ingredient = selectedProvider.products.find((p) => p.id === id);
      if (ingredient) {
        set(ingredient, name, value);
        if(name === 'qty_to_buy'){ // update product_quantity as well
          set(ingredient, 
            'product_quantity', 
            Math.ceil(parseFloat(ingredient.qty_to_buy || 0) / parseFloat(ingredient.format || 0))
          );
        }
        set(ingredient, 'cost', getSum(selectedProvider.products));
        selectedProvider.cost = getSum(selectedProvider.products);
      }
    }
  }

  /**
   * remove an item(order) from the passing provider items
   * @param providerId
   * @param ids
   */
  removeItemfromProvider(providerId: number, ids: Array<number>) {
    let selectedProvider: any = this.getItemsByProvider(providerId);
    if (selectedProvider && selectedProvider.products) {
      selectedProvider.products = selectedProvider.products.filter(
        (p) => !ids.includes(p.id)
      );
      selectedProvider.cost = getSum(selectedProvider.products);
    }
  }

  /**
   * remove the provider from the selected-providers list
   * @param providerId
   * @returns filtered selected providers
   */
  removeProvider(providerId: number) {
    this.itemsByProvider = this.itemsByProvider.filter(
      (p: any) => p.provider.id !== providerId
    );
    return this.itemsByProvider;
  }

  setItemsByDeliveryDate(updatedItem: any) {
    this.itemsByProvider = updatedItem;
  }  
}

export default new StockService();
