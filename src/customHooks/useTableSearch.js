import { useState, useEffect } from "react";

export const useTableSearch = ({ searchVal, tableData, searchFields }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [origData, setOrigData] = useState([]);
  const [searchIndex, setSearchIndex] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const pick = (obj, arr) =>
      arr.reduce(
        (acc, record) => (record in obj && (acc[record] = obj[record]), acc),
        {}
      );

    const crawl = (row, allValues = []) => {
      for (var key in row) {
        typeof row[key] === "object"
          ? crawl(row[key], allValues)
          : allValues.push(row[key] + "");
      }
      return allValues;
    };

    const fetchData = () => {
      setOrigData(tableData);
      setFilteredData(tableData);

      const searchInd = tableData.map((row) => {
        const allValues = crawl(pick(row, searchFields));
        return { allValues: allValues.toString().toLowerCase() };
      });

      setSearchIndex(searchInd);

      if (tableData) {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableData]);

  useEffect(() => {
    if (searchVal) {
      const lowerCaseSearchVal = searchVal.toLowerCase();
      const reqData = searchIndex.map((row, index) =>
        row.allValues.indexOf(lowerCaseSearchVal) >= 0 ? origData[index] : null
      );
      setFilteredData(reqData.filter((row) => Boolean(row)));
      return;
    }
    setFilteredData(origData);
  }, [searchVal, origData, searchIndex]);

  return { filteredData, loading };
};
