import { CURRENCIES_LIST } from "common/constants";
import { useUserData } from "contexts/AuthContextManagement";

const getCurrency = (currency: string) =>
  CURRENCIES_LIST.find((c) => c.name === currency);

function useCurrencySymbol() {
  const { currency } = useUserData();

  return {
    currencySymbol: getCurrency(currency)?.symbol ?? "",
    currencyName: getCurrency(currency)?.name ?? "",
    currencyNameSymbol: `${(getCurrency(currency)?.name ?? "").toUpperCase()} ${
      getCurrency(currency)?.symbol ?? ""
    }`,
  };
}

export default useCurrencySymbol;
