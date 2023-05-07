/*
 * @Author: @ppeng
 * @Date: 2021-08-18 17:55:28
 * @LastEditTime: 2022-03-10 14:38:07
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */

import { Select } from 'antd';
import type { SelectProps } from 'antd';
import React, { useContext, useMemo } from 'react';
import type { SelectValue, OptionProps } from 'antd/es/select';
import {
    optionIsDisabled,
    isDisabled,
    RelationInfoContext,
    getMatchRelationResByFormData,
    NameContext,
    FormInstanceContext,
    mergeRelation,
    OtherFormDataContext,
    optionIsHide,
    TriggerRelationContext,
} from '.';
import { useRelation } from './hook';

function SelectComponent<VT extends SelectValue = SelectValue>({
    children,
    ...props
}: SelectProps<VT> & {
    ref?: React.Ref<any> | undefined;
}) {
    const name = useContext(NameContext);
    const relationInfo = useContext(RelationInfoContext);
    const form = useContext(FormInstanceContext);
    const otherFormData = useContext(OtherFormDataContext);
    const triggerRelation = useContext(TriggerRelationContext);
    const matchController = useMemo(
        () => getMatchRelationResByFormData(relationInfo, form?.getFieldsValue(true) || {}, otherFormData),
        [relationInfo, form?.getFieldsValue(true), otherFormData],
    );
    const relationDetail = useMemo(
        () =>
            matchController.reduce((prev, cur) => {
                return mergeRelation(prev, cur.relation);
            }, {})[name],
        [matchController, name],
    );
    return (
        <Select
            {...props}
            disabled={triggerRelation ? isDisabled(props, relationDetail) : props.disabled}
        >
            {(children as any)
                ?.filter?.((item) => {
                    if (!item) {
                        return false;
                    }
                    const isHide = triggerRelation
                        ? optionIsHide(item.props || {}, relationDetail)
                        : false;
                    return !isHide;
                })
                ?.map?.((item) => ({
                    ...item,
                    props: {
                        ...(item.props || {}),
                        disabled: triggerRelation
                            ? optionIsDisabled(item.props || {}, relationDetail)
                            : undefined,
                    },
                }))}
        </Select>
    );
}
const SelectR: typeof Select = Object.assign(SelectComponent, Select)
const OptionComponent: React.FC<OptionProps> = ({ children, ...props }) => {
    const relation = useRelation(props);
    return relation.optionIsHide ? null : (
        <Select.Option {...props} disabled={relation.optionIsDisabled}>
            {children}
        </Select.Option>
    );
};
const Option: typeof Select.Option = Object.assign(OptionComponent, Select.Option)
SelectR.Option = Option;
export default SelectR;
