import { Table } from 'antd';
import React, { memo, useLayoutEffect, useState, useCallback } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
const ResizableHeaderCell = memo(({ onWidthChange, title, dataKey, dataWidth, isLatest, xScroll, minWidth = 50, ...props }) => {
    const thEl = useRef(null);
    const lineEl = useRef(null);
    const [height, setHeight] = useState(0);
    const defaultWidth = useRef(undefined);
    const [moveing, setMoving] = useState(false);
    const prevMoveX = useRef(0);
    const originWidth = dataWidth || defaultWidth.current;
    const onResizeStart = () => {
        console.log(dataKey, ':start', originWidth);
        setMoving(true);
    };
    const onResize = (e) => {
        const pendingWidth = prevMoveX.current + e.movementX + originWidth;
        if (e.movementX < 0 && pendingWidth < minWidth) {
            return;
        }
        prevMoveX.current += e.movementX;
        if (lineEl.current)
            lineEl.current.style.transform = `translateX(${prevMoveX.current}px)`;
    };
    const onResizeStop = () => {
        const resWidth = originWidth + prevMoveX.current;
        console.log(dataKey, ':end', resWidth);
        onWidthChange(resWidth, dataKey);
        prevMoveX.current = 0;
        setMoving(false);
    };
    useLayoutEffect(() => {
        const observer = new ResizeObserver((entries) => {
            const target = thEl.current;
            setHeight(target.clientHeight);
            defaultWidth.current = target.clientWidth;
        });
        observer.observe(thEl.current);
        return () => {
            observer.disconnect();
        };
    }, []);
    return isLatest ? (React.createElement("th", { ...props, ref: thEl }, props.children || title)) : (React.createElement(Resizable, { onResizeStart: onResizeStart, onResizeStop: onResizeStop, onResize: onResize, axis: "x", width: originWidth || 0, height: height },
        React.createElement("th", { ...props, ref: thEl, style: {
                ...(props.style || {}),
                width: originWidth,
                maxWidth: xScroll ? originWidth : undefined,
                minWidth: xScroll ? originWidth : undefined,
                zIndex: moveing ? 9999999 : undefined,
                overflow: moveing ? 'visible' : undefined,
            } },
            props.children,
            React.createElement("div", { ref: lineEl, style: {
                    width: '2px',
                    position: 'absolute',
                    height,
                    top: 0,
                    right: 0,
                    backgroundColor: '#1890ff',
                    display: moveing ? 'block' : 'none',
                    zIndex: 9999999,
                } }))));
});
const BodyCell = memo(({ dataKey, dataWidth, xScroll, children, ...props }) => {
    return (React.createElement("td", { ...props, style: {
            ...(props.style || {}),
            width: dataWidth,
            maxWidth: xScroll ? dataWidth : undefined,
            minWidth: xScroll ? dataWidth : undefined,
        } }, children));
});
function ResizableTable({ components = {}, ...props }) {
    const columns = useRef([]);
    const [_, flesh] = useState(+new Date());
    const getColumnKey = (col) => {
        const dataIndex = col.dataIndex;
        if (Array.isArray(dataIndex)) {
            return dataIndex.join('->');
        }
        return `${dataIndex}`;
    };
    const handleColumns = useCallback((columns) => {
        const originColumns = columns || [];
        return originColumns.map((item) => {
            const originOnHeaderCell = item.onHeaderCell;
            const originOnCell = item.onCell;
            return {
                ...item,
                ellipsis: true,
                onHeaderCell: (column) => {
                    const idx = originColumns.findIndex((item) => {
                        return getColumnKey(column) === getColumnKey(item);
                    });
                    const orginCellProps = originOnHeaderCell
                        ? originOnHeaderCell(column, idx)
                        : {};
                    return {
                        ...orginCellProps,
                        dataWidth: column.width,
                        dataKey: getColumnKey(column),
                        isLatest: idx === originColumns.length - 1,
                    };
                },
                onCell: (column, idx) => {
                    const orginCellProps = originOnCell ? originOnCell(column, idx) : {};
                    return {
                        ...orginCellProps,
                        dataWidth: item.width,
                        dataKey: getColumnKey(item),
                        xScroll: props.scroll?.x === true,
                    };
                },
            };
        });
    }, [props.scroll]);
    const onWidthChange = useCallback((width, key) => {
        const handleRes = handleColumns(columns.current.map((item) => {
            if (getColumnKey(item) === key) {
                return {
                    ...item,
                    width,
                };
            }
            return item;
        }));
        columns.current = handleRes;
        flesh(+new Date());
    }, [handleColumns]);
    const headerCellRender = useCallback((cellProps) => {
        const Cell = components.header?.cell;
        return (React.createElement(ResizableHeaderCell, { ...cellProps, xScroll: props.scroll?.x === true, onWidthChange: onWidthChange }, Cell ? React.createElement(Cell, { ...cellProps }) : cellProps.children));
    }, [components.header, props.scroll?.x]);
    const bodyCellRender = useCallback((cellProps) => {
        const Cell = components.body?.cell;
        return (React.createElement(BodyCell, { ...cellProps }, Cell ? React.createElement(Cell, { ...cellProps }) : cellProps.children));
    }, [components.body]);
    useEffect(() => {
        columns.current = handleColumns(props.columns || []);
    }, [props.columns]);
    return (React.createElement(Table, { ...props, columns: columns.current, components: {
            ...components,
            header: {
                ...(components.header || {}),
                cell: headerCellRender,
            },
            body: {
                ...(components.body || {}),
                cell: bodyCellRender,
            },
        } }));
}
export { ResizableTable as Table };
