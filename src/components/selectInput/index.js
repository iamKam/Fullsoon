import React from "react";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import { useTranslation } from "react-i18next";

import "./index.scss";

const colourStyles = {
  option: (styles, { data, isDisabled, isFocused, isSelected, ...args }) => {
    return {
      ...styles,
      backgroundColor: isDisabled
        ? undefined
        : isSelected
        ? "#F3F4FB"
        : isFocused,
        "&:hover": {
          backgroundColor: "#F3F4FB"
        },
      color: isDisabled ? "#ccc" : isSelected ? "black" : "black",
    };
  },
  menuPortal: (provided) => ({ ...provided, zIndex: 99999 }),
  menu: (provided) => ({ ...provided, zIndex: 99999 }),
  multiValueLabel: (base) => ({ ...base }),
};

function SelectInput({
  options,
  dataField,
  onChange,
  portal = false,
  value,
  ...props
}) {
  const { t } = useTranslation();
  let inputValue 
  
  if (Array.isArray(value)) {
    inputValue = value.map((v) => ({
      ...v,
      label: t(v?.label)
    }));
  } else if (typeof value === 'object') {
    inputValue = { ...value, label: t(value?.label) };
  } else {
    inputValue = undefined;
  }

  if(dataField === 'startTime' || dataField === 'endTime' ||  dataField === 'occupancy_impact_rating') {
    inputValue = value
  }
  return (
    <>
      <Select
        {...(portal && {
          menuPortalTarget: document.body,
          menuPosition: "fixed",
        })}
        styles={colourStyles}
        components={makeAnimated()}
        onChange={onChange(dataField)}
        options={options}
        isSearchable
        value={inputValue}
        className="custom-select"
        {...props}
        theme={(theme) => {
          return {
            ...theme,
            colors: {
              ...theme.colors,
              danger: "#fff",
              dangerLight: "hsl(53deg 2% 73%)",
            },
          };
        }}
      />
    </>
  );
}

export default SelectInput;
