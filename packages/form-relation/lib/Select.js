/*
 * @Author: 彭越腾
 * @Date: 2021-08-18 17:55:28
 * @LastEditTime: 2022-03-10 14:38:07
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */
import { Select } from 'antd';
import React, { useContext, useMemo } from 'react';
import { optionIsDisabled, isDisabled, RelationInfoContext, getMatchController, NameContext, FormInstanceContext, mergeRelation, OtherFormDataContext, optionIsHide, TriggerRelationContext, } from '.';
import { useRelation } from './hook';
const { OptGroup, SECRET_COMBOBOX_MODE_DO_NOT_USE } = Select;
function SelectR({ children, ...props }) {
    const name = useContext(NameContext);
    const relationInfo = useContext(RelationInfoContext);
    const form = useContext(FormInstanceContext);
    const otherFormData = useContext(OtherFormDataContext);
    const triggerRelation = useContext(TriggerRelationContext);
    const matchController = useMemo(() => getMatchController(relationInfo, form?.getFieldsValue(true) || {}, otherFormData), [relationInfo, form?.getFieldsValue(true), otherFormData]);
    const relationDetail = useMemo(() => matchController.reduce((prev, cur) => {
        return mergeRelation(prev, cur.relation);
    }, {})[name], [matchController, name]);
    return (React.createElement(Select, { ...props, disabled: triggerRelation ? isDisabled(props, relationDetail) : undefined }, children
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
    }))));
}
const Option = ({ children, ...props }) => {
    const relation = useRelation(props);
    return relation.optionIsHide ? null : (React.createElement(Select.Option, { ...props, disabled: relation.optionIsDisabled }, children));
};
export { SECRET_COMBOBOX_MODE_DO_NOT_USE, Option, OptGroup };
SelectR.Option = Select.Option;
SelectR.OptGroup = OptGroup;
SelectR.SECRET_COMBOBOX_MODE_DO_NOT_USE = SECRET_COMBOBOX_MODE_DO_NOT_USE;
export default SelectR;
