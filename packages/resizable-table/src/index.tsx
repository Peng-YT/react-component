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
import React, { memo, useLayoutEffect, useState, useCallback } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface ResizableHeaderCellPropsType {
    onWidthChange: (width: number, key: string) => any;
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
    ({ onWidthChange, title, dataKey, dataWidth, isLatest, xScroll, minWidth = 50, ...props }) => {
        const thEl = useRef<HTMLTableHeaderCellElement>(null);
        const lineEl = useRef<HTMLDivElement>(null);
        const [height, setHeight] = useState(0);
        const defaultWidth = useRef<number | undefined>(undefined);
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
            const resWidth = (originWidth as number) + prevMoveX.current;
            console.log(dataKey, ':end', resWidth);
            onWidthChange(resWidth, dataKey);
            prevMoveX.current = 0;
            setMoving(false);
        };
        useLayoutEffect(() => {
            const observer = new ResizeObserver((entries) => {
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
    const [_, flesh] = useState(+new Date());
    const getColumnKey = (col: ColumnType<RecordType>) => {
        const dataIndex = col.dataIndex;
        if (Array.isArray(dataIndex)) {
            return dataIndex.join('->');
        }
        return `${dataIndex}`;
    };
    const handleColumns = useCallback(
        (columns: ColumnsType<RecordType>) => {
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
        },
        [props.scroll],
    );
    const onWidthChange = useCallback(
        (width, key) => {
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
            flesh(+new Date());
        },
        [handleColumns],
    );
    const headerCellRender = useCallback(
        (cellProps) => {
            const Cell = components.header?.cell;
            return (
                <ResizableHeaderCell
                    {...cellProps}
                    xScroll={props.scroll?.x === true}
                    onWidthChange={onWidthChange}
                >
                    {Cell ? <Cell {...cellProps}></Cell> : cellProps.children}
                </ResizableHeaderCell>
            );
        },
        [components.header, props.scroll?.x],
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
    }, [props.columns]);
    return (
        <Table
            {...props}
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
