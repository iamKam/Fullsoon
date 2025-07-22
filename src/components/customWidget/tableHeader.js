import React from 'react';
import classNames from 'classnames';

const TableHeader = ({ columns, tableName, headRef, isCurrentDateRow }) => {
  return (
    <thead>
      <tr>
        {columns?.map((c, i) => (
          <th
            key={i}
            style={{
              backgroundColor: "#F8F9FD",
              borderBottom: "1px solid rgba(99, 83, 234, 0.3)",
              ...(tableName === 'forecast' && c.custom === 'events' && i === 4 && isCurrentDateRow && { boxShadow:"0px 4px 25px 0px #0000001C", fontWeight: "700", borderRadius: "10px", backgroundColor: "white", transform: "scaleX(1.1)", zIndex: 99 }),
              ...(tableName === 'forecast' && c.custom === 'events' && i !== 4 && { backgroundColor: "#F8F9FD" }),
              ...c.headerStyle,
              width: c.dataField === 'name' ? "180px" : c.dataField === 'format' ? "100px" : "",
            }}
            className={classNames(c.headerClassName)}
            ref={i === 0 ? headRef : undefined}
          >
            <span style={{ whiteSpace: "normal" }}>
              {c.caption}
            </span>
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default TableHeader;