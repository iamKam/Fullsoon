import React, {useState, useRef } from "react";
import PropTypes from "prop-types";
import { get } from "lodash";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { CustomtableProps } from "./interface";
import CustomModal from "./eventListModel";
import { getEventIcon, formatEventName, formatEvent } from "./utils"
import TableHeader from "./tableHeader";
import "../customTable/index.scss";
import "./index.scss";

function CustomWidget({
  columns,
  data,
  tableScrollClass,
  selectAllProducts,
  header = true,
  loading,
  tableName,
  startDate,
  endDate,
}: CustomtableProps) {
  const { t } = useTranslation();
  const headRef: any = useRef(null);
  const [isModal, setIsModal] = useState(false);
  const [date, setDate] = useState();
  
  const isSelectAllProducts = (index) => {
    return Boolean(selectAllProducts) && index === 0;
  }
  
  const handleShowAllEvents = async (dataField, it) => {
    setIsModal(true);
    setDate(dataField);
  };

  const handleEventsClose = () => {
    setIsModal(false);
  }
  
  const renderTooltip = (matches) => (props) => (
    <Tooltip id="button-tooltip" {...props}>
      {matches.length > 0 ? (
        matches.map((match, index) => (
          <React.Fragment key={index}>
            {match}
            <br />
          </React.Fragment>
        ))
      ) : (
        "--"
      )}
    </Tooltip>
  );

  const renderRow = (it, ii, isCurrentDateRow: boolean) => {
    return (
      <tr
        key={ii}
        id={`${it?.id}`}
      >
        {columns.map((c: any, i) => (
          <td
            key={i}
            style={{
              ...(tableName === 'forecast' && ii !== data.length - 1 && { borderBottom: "1px solid #E0E0E0", backgroundColor: "#F8F9FD"}),
              ...(tableName === 'forecast' && c.custom === 'events' && i === 4 && isCurrentDateRow && { backgroundColor: "#EFEEFD", fontWeight:"700" }),
              ...(tableName === 'forecast' && c.custom === 'events' &&  i !== 4 && { backgroundColor: "#F8F9FD" }),
              whiteSpace: c.dataField === 'name' ? "initial" : "",
              ...c.style,
              width: c.style?.width,
            }}
          >

            {!(isSelectAllProducts(i) && get(it, c.dataField)) && (
              <>
                {c.type === "customRender" && c.custom === 'events' && it?.name === 'Events' && (
                  <>
                    {Array.isArray(it[c?.dataField]) && it[c?.dataField].length > 0 ? (
                      (() => {
                        const eventMap = new Map();
  
                        // Group events by image_path (league image)
                        it[c?.dataField].forEach((item) => {
                          const leagueImage = item?.image_path || getEventIcon(formatEvent(item?.name));
                          if (!eventMap.has(leagueImage)) {
                            eventMap.set(leagueImage, []);
                          }
                          eventMap.get(leagueImage).push(item?.name);
                        });
  
                        return (
                          <ul className="events-list">
                            {[...eventMap.entries()].map(([leagueImage, matches], index) => (
                              <li key={index} className="event-item">
                                <OverlayTrigger
                                  placement="top"
                                  overlay={renderTooltip(matches)}
                                >
                                  <div>
                                    <img
                                      src={leagueImage}
                                      alt="Events Icons"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement; // Type assertion
                                        target.onerror = null; // Prevent infinite loop
                                        target.src = `${window.location.origin}/images/no-image-icon.png`; // Fallback image
                                      }}
                                    />
                                  </div>
                                </OverlayTrigger>
                              </li>
                            ))}
                          </ul>
                        );
                      })()
                    ) : (
                      // Render placeholder or "No Events" when data is loading or not available
                      !loading ? (
                        <div className="event-wrapper">
                          <div className="placeholder-text">
                            {t("NoEvents")}
                          </div>
                        </div>
                      ) : (
                        <div className="placeholder-dash">--</div>
                      )
                    )}

                    {!loading && it[c?.dataField]?.length > 2 && (
                      <div
                        onClick={() => handleShowAllEvents(c.dataField, it)}
                        className="more-events-button"
                      >
                        <div className="more-events-content">
                          {t("MoreEvents")}
                        </div>
                      </div>
                    )}
                  </>          
                  )}   

                {c.type === "customRender" && c.render(c, it)}                
              </>
            )}
          </td>
        ))}
      </tr>
    );
  };

  const isCurrentDateRow = columns.some((c) => {
    const currentDate = new Date().toISOString().split('T')[0];
    if (!startDate || !endDate) {
      console.log("Start date or end date is not provided.");
      return false; 
    }
    const start = new Date(startDate).toISOString().split('T')[0];
    const end = new Date(endDate).toISOString().split('T')[0];
    return currentDate >= start && currentDate <= end;
  });

  return (
    <div className="row custom-table h-100">
      <CustomModal show={isModal} onHide={handleEventsClose} date={date}/>
      <div className="col-lg-12 h-100">
        <div className="tablescroll" style={{ ...tableScrollClass }}>
          <table className="table">
            {header && (
             <TableHeader columns={columns} tableName={tableName} headRef={headRef} isCurrentDateRow={isCurrentDateRow} />
            )} 
            <tbody>
              {data?.map((it, ii) => {
                  return renderRow(it, ii, isCurrentDateRow);
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

CustomWidget.propTypes = {
  columns: PropTypes.array,
};

export default CustomWidget;