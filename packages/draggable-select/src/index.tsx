import { Select } from 'antd';
import type { SelectProps } from 'antd';
import type { SelectValue } from 'antd/es/select';
import { CloseOutlined } from '@ant-design/icons';
import React, { useEffect, useRef, useState } from 'react';

// 可拖拽调整多选框的顺序--
const { OptGroup, Option, SECRET_COMBOBOX_MODE_DO_NOT_USE } = Select;
function DraggableSelect<VT extends SelectValue = SelectValue>({
    children,
    ...props
}: SelectProps<VT> & {
    ref?: React.Ref<any> | undefined;
}) {
    const [value, setValue] = useState(props.value);
    const [openDropDown, setOpenDropDown] = useState(false);
    const dragInfo = useRef<{
        enterTarget: any;
        originTarget: any;
    }>({
        enterTarget: '',
        originTarget: '',
    });
    const moveTag = () => {
        if ((props.mode !== 'multiple' && props.mode !== 'tags') || !Array.isArray(value)) {
            return;
        }
        const { enterTarget, originTarget } = dragInfo.current;
        const enterIdx = value.indexOf(enterTarget);
        const originIdx = value.indexOf(originTarget);
        if (enterIdx === -1 || originIdx === -1) {
            return;
        }
        const newValue = value.slice(0) as typeof value;
        newValue.splice(originIdx, 1);
        newValue.splice(enterIdx, 0, originTarget);
        setValue(newValue);
        props.onChange?.(newValue, props.options || []);
        dragInfo.current.originTarget = '';
        dragInfo.current.enterTarget = '';
    };
    const tagRender: typeof props.tagRender = (tagProps) => {
        const { label, closable, disabled, onClose } = tagProps;
        return (
            <div
                style={{
                    display: 'inline-block',
                    verticalAlign: 'top',
                    cursor: disabled ? undefined : 'grab',
                    padding: '0 4px 0 8px',
                    margin: '2px 4px 2px 0',
                    backgroundColor: '#f0f0f0',
                    color: disabled ? '#bfbfbf' : undefined,
                    opacity: disabled ? '0.5' : undefined,
                }}
                onClick={() => setOpenDropDown(true)}
                onDragStart={() => {
                    dragInfo.current.originTarget = tagProps.value;
                }}
                onDragEnter={() => {
                    dragInfo.current.enterTarget = tagProps.value;
                }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                }}
                onDragEnd={moveTag}
                draggable={!disabled}
                onDragOver={(e) => e.preventDefault()}
            >
                {props.tagRender ? (
                    props.tagRender(tagProps)
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {label}
                        {closable && !disabled ? (
                            <CloseOutlined
                                style={{
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    marginRight: 4,
                                    color: '#00000073',
                                    padding: '4',
                                }}
                                onClick={onClose}
                                rev={undefined}
                            ></CloseOutlined>
                        ) : (
                            ''
                        )}
                    </div>
                )}
            </div>
        );
    };
    useEffect(() => {
        setValue(props.value);
    }, [props.value]);
    return (
        <Select
            {...props}
            tagRender={tagRender}
            value={value}
            onChange={(val, opts) => {
                setValue(val);
                props.onChange?.(val, opts);
            }}
            open={props.open === undefined ? openDropDown : props.open}
            onBlur={() => setOpenDropDown(false)}
            onMouseDown={() => setOpenDropDown(true)}
        >
            {children}
        </Select>
    );
}
export { SECRET_COMBOBOX_MODE_DO_NOT_USE, Option, OptGroup, DraggableSelect as Select };
DraggableSelect.Option = Select.Option;
DraggableSelect.OptGroup = OptGroup;
DraggableSelect.SECRET_COMBOBOX_MODE_DO_NOT_USE = SECRET_COMBOBOX_MODE_DO_NOT_USE;
export default DraggableSelect;
