/*
 * @Author: 彭越腾
 * @Date: 2021-08-19 10:34:17
 * @LastEditTime: 2021-11-26 16:06:48
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */
import { Checkbox } from 'antd';
import React from 'react';
import { useRelation } from './hook';
const { Group, __ANT_CHECKBOX } = Checkbox;
function CheckboxR({ children, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (React.createElement(Checkbox, { ...props, disabled: optionIsDisabled }, children));
}
const GroupR = ({ children, ...props }) => {
    const { isDisabled } = useRelation(props);
    return (React.createElement(Group, { ...props, disabled: isDisabled }, children));
};
export { GroupR as Group };
CheckboxR.Group = GroupR;
// eslint-disable-next-line no-underscore-dangle
CheckboxR.__ANT_CHECKBOX = __ANT_CHECKBOX;
export default CheckboxR;
