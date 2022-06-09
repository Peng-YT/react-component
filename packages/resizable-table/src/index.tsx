/*
 * @Author: @ppeng
 * @Date: 2022-03-31 13:54:26
 * @LastEditTime: 2022-04-14 14:10:40
 * @LastEditors: @ppeng
 * @Description: 可拖拽调整列宽度
 * @FilePath: \admin-data-new\src\components\Common\ResizableTable.tsx
 */
import type { TableProps } from 'antd';
import { Table } from 'antd';
import { ColumnsType, ColumnType } from 'antd/lib/table';
import { SorterResult } from 'antd/lib/table/interface';
import React, { memo, useLayoutEffect, useState, useCallback } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface ResizableHeaderCellPropsType {
    onWidthChange: (width: number, key: string) => any;
    onDragStart: () => any;
    title?: JSX.Element;
    dataKey: string;
    dataWidth: number;
    xScroll: boolean;
    minWidth?: number;
    maxWidth?: number;
    isLatest?: boolean;
    className?: string;
    style?: any;
}

const ResizableHeaderCell: React.FC<ResizableHeaderCellPropsType> = memo(
    ({
        onWidthChange,
        onDragStart,
        title,
        dataKey,
        dataWidth,
        isLatest,
        xScroll,
        minWidth = 50,
        ...props
    }) => {
        const thEl = useRef<HTMLTableHeaderCellElement>(null);
        const lineEl = useRef<HTMLDivElement>(null);
        const [height, setHeight] = useState(0);
        const defaultWidth = useRef<number | undefined>(undefined);
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
            const resWidth = (originWidth as number) + prevMoveX.current;
            console.log(dataKey, ':end', resWidth);
            onWidthChange(resWidth, dataKey);
            prevMoveX.current = 0;
            setMoving(false);
        };
        useLayoutEffect(() => {
            const observer = new ResizeObserver(() => {
                const target = thEl.current as HTMLElement;
                setHeight(target.clientHeight);
                defaultWidth.current = target.clientWidth;
            });
            observer.observe(thEl.current as HTMLElement);
            return () => {
                observer.disconnect();
            };
        }, []);
        return isLatest ? (
            <th {...props} ref={thEl}>
                {props.children || title}
            </th>
        ) : (
            <Resizable
                onResizeStart={onResizeStart}
                onResizeStop={onResizeStop}
                onResize={onResize}
                axis="x"
                width={originWidth || 0}
                height={height}
                handle={
                    <span
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        className="react-resizable-handle react-resizable-handle-se"
                    ></span>
                }
            >
                <th
                    {...props}
                    ref={thEl}
                    style={{
                        ...(props.style || {}),
                        width: originWidth,
                        maxWidth: xScroll ? originWidth : undefined,
                        minWidth: xScroll ? originWidth : undefined,
                        zIndex: moveing ? 9999999 : undefined,
                        overflow: moveing ? 'visible' : undefined,
                    }}
                >
                    {props.children}
                    <div
                        ref={lineEl}
                        style={{
                            width: '2px',
                            position: 'absolute',
                            height,
                            top: 0,
                            right: 0,
                            backgroundColor: '#1890ff',
                            display: moveing ? 'block' : 'none',
                            zIndex: 9999999,
                        }}
                    ></div>
                </th>
            </Resizable>
        );
    },
);

interface BodyCellPropsType {
    dataKey: string;
    dataWidth: number;
    xScroll: boolean;
    style?: any;
}

const BodyCell: React.FC<BodyCellPropsType> = memo(
    ({ dataKey, dataWidth, xScroll, children, ...props }) => {
        return (
            <td
                {...props}
                style={{
                    ...(props.style || {}),
                    width: dataWidth,
                    maxWidth: xScroll ? dataWidth : undefined,
                    minWidth: xScroll ? dataWidth : undefined,
                }}
            >
                {children}
            </td>
        );
    },
);

function ResizableTable<RecordType extends object = any>({
    components = {},
    ...props
}: TableProps<RecordType>) {
    const columns = useRef<ColumnsType<RecordType>>([]);
    const [, flesh] = useState(+new Date());
    const [draging, setDraging] = useState(false);
    const widthMapRef = useRef<Record<string, any>>({});
    const setWidthMap = (res: Record<string, any>) => {
        widthMapRef.current = res;
        flesh(+new Date());
    };
    const sorterOrderMapRef = useRef<Record<string, any>>({});
    const setSorterOrderMap = (res: Record<string, any>) => {
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
    const getColumnKey = (col: ColumnType<RecordType>) => {
        const { dataIndex } = col;
        return getKeyByDataIndex(dataIndex);
    };
    const handleColumns = useCallback(
        (prevColumns: ColumnsType<RecordType>) => {
            const originColumns = prevColumns || [];
            return originColumns.map((item) => {
                const originOnHeaderCell = item.onHeaderCell;
                const originOnCell = item.onCell;
                const width = widthMapRef.current[getColumnKey(item)];
                return {
                    ...item,
                    width: width || item.width,
                    sortOrder:
                        item.sortOrder === undefined
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
        },
        [props.scroll, sorterOrderMapRef.current, widthMapRef.current],
    );
    const onWidthChange = useCallback(
        (width, key) => {
            setWidthMap({
                ...widthMapRef.current,
                [key]: width,
            });
            const handleRes = handleColumns(
                columns.current.map((item) => {
                    if (getColumnKey(item) === key) {
                        return {
                            ...item,
                            width,
                        };
                    }
                    return item;
                }),
            );
            columns.current = handleRes;
            setTimeout(() => {
                setDraging(false);
            }, 500);
            flesh(+new Date());
        },
        [handleColumns],
    );
    const onTableChange = (...arg) => {
        if (draging) {
            return false;
        }
        const sorter: SorterResult<any> = arg[2];
        setSorterOrderMap({
            [getKeyByDataIndex(sorter.field)]: sorter.order,
        });
        columns.current = handleColumns(columns.current);
        flesh(+new Date());
        return (props.onChange as any)?.(...arg);
    };
    const headerCellRender = useCallback(
        (cellProps) => {
            const Cell = components.header?.cell;
            return (
                <ResizableHeaderCell
                    {...cellProps}
                    xScroll={props.scroll?.x === true}
                    onWidthChange={onWidthChange}
                    onDragStart={() => setDraging(true)}
                >
                    {Cell ? <Cell {...cellProps}></Cell> : cellProps.children}
                </ResizableHeaderCell>
            );
        },
        [components.header, props.scroll?.x, onWidthChange],
    );
    const bodyCellRender = useCallback(
        (cellProps) => {
            const Cell = (components.body as any)?.cell;
            return (
                <BodyCell {...cellProps}>
                    {Cell ? <Cell {...cellProps}></Cell> : cellProps.children}
                </BodyCell>
            );
        },
        [components.body],
    );
    useEffect(() => {
        columns.current = handleColumns(props.columns || []);
        flesh(+new Date());
    }, [props.columns]);
    return (
        <Table
            {...props}
            onChange={onTableChange}
            columns={columns.current}
            components={{
                ...components,
                header: {
                    ...(components.header || {}),
                    cell: headerCellRender,
                },
                body: {
                    ...(components.body || {}),
                    cell: bodyCellRender,
                },
            }}
        ></Table>
    );
}
export { ResizableTable as Table };
