import { Table } from 'antd';
import React, { memo, useLayoutEffect, useState, useCallback } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
const ResizableHeaderCell = memo(({ onWidthChange, onDragStart, title, dataKey, dataWidth, isLatest, xScroll, minWidth = 50, ...props }) => {
    const thEl = useRef(null);
    const lineEl = useRef(null);
    const [height, setHeight] = useState(0);
    const defaultWidth = useRef(undefined);
    const [moveing, setMoving] = useState(false);
    const prevMoveX = useRef(0);
    const originWidth = dataWidth || defaultWidth.current;
    const onResizeStart = () => {
        onDragStart();
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
        const observer = new ResizeObserver(() => {
            const target = thEl.current;
            setHeight(target.clientHeight);
            defaultWidth.current = target.clientWidth;
        });
        observer.observe(thEl.current);
        return () => {
            observer.disconnect();
        };
    }, []);
    return isLatest ? (React.createElement("th", { ...props, ref: thEl }, props.children || title)) : (React.createElement(Resizable, { onResizeStart: onResizeStart, onResizeStop: onResizeStop, onResize: onResize, axis: "x", width: originWidth || 0, height: height, handle: React.createElement("span", { onClick: (e) => {
                e.stopPropagation();
            }, className: "react-resizable-handle react-resizable-handle-se" }) },
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
    const [, flesh] = useState(+new Date());
    const [draging, setDraging] = useState(false);
    const widthMapRef = useRef({});
    const setWidthMap = (res) => {
        widthMapRef.current = res;
        flesh(+new Date());
    };
    const sorterOrderMapRef = useRef({});
    const setSorterOrderMap = (res) => {
        sorterOrderMapRef.current = {
            ...res,
        };
        flesh(+new Date());
    };
    const getKeyByDataIndex = (keys) => {
        if (Array.isArray(keys)) {
            return keys.join('->');
        }
        return `${keys}`;
    };
    const getColumnKey = (col) => {
        const { dataIndex } = col;
        return getKeyByDataIndex(dataIndex);
    };
    const handleColumns = useCallback((prevColumns) => {
        const originColumns = prevColumns || [];
        return originColumns.map((item) => {
            const originOnHeaderCell = item.onHeaderCell;
            const originOnCell = item.onCell;
            const width = widthMapRef.current[getColumnKey(item)];
            return {
                ...item,
                width: width || item.width,
                sortOrder: item.sortOrder === undefined
                    ? sorterOrderMapRef.current[getColumnKey(item)]
                    : item.sortOrder,
                ellipsis: true,
                onHeaderCell: (column) => {
                    const idx = originColumns.findIndex((origin) => {
                        return getColumnKey(column) === getColumnKey(origin);
                    });
                    const orginCellProps = originOnHeaderCell
                        ? originOnHeaderCell(column, idx)
                        : {};
                    return {
                        ...orginCellProps,
                        dataWidth: width || column.width,
                        dataKey: getColumnKey(column),
                        isLatest: idx === originColumns.length - 1,
                    };
                },
                onCell: (column, idx) => {
                    const orginCellProps = originOnCell ? originOnCell(column, idx) : {};
                    return {
                        ...orginCellProps,
                        dataWidth: width || column.width,
                        dataKey: getColumnKey(item),
                        xScroll: props.scroll?.x === true,
                    };
                },
            };
        });
    }, [props.scroll, sorterOrderMapRef.current, widthMapRef.current]);
    const onWidthChange = useCallback((width, key) => {
        setWidthMap({
            ...widthMapRef.current,
            [key]: width,
        });
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
        setTimeout(() => {
            setDraging(false);
        }, 500);
        flesh(+new Date());
    }, [handleColumns]);
    const onTableChange = (...arg) => {
        if (draging) {
            return false;
        }
        const sorter = arg[2];
        setSorterOrderMap({
            [getKeyByDataIndex(sorter.field)]: sorter.order,
        });
        columns.current = handleColumns(columns.current);
        flesh(+new Date());
        return props.onChange?.(...arg);
    };
    const headerCellRender = useCallback((cellProps) => {
        const Cell = components.header?.cell;
        return (React.createElement(ResizableHeaderCell, { ...cellProps, xScroll: props.scroll?.x === true, onWidthChange: onWidthChange, onDragStart: () => setDraging(true) }, Cell ? React.createElement(Cell, { ...cellProps }) : cellProps.children));
    }, [components.header, props.scroll?.x, onWidthChange]);
    const bodyCellRender = useCallback((cellProps) => {
        const Cell = components.body?.cell;
        return (React.createElement(BodyCell, { ...cellProps }, Cell ? React.createElement(Cell, { ...cellProps }) : cellProps.children));
    }, [components.body]);
    useEffect(() => {
        columns.current = handleColumns(props.columns || []);
        flesh(+new Date());
    }, [props.columns]);
    return (React.createElement(Table, { ...props, onChange: onTableChange, columns: columns.current, components: {
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
