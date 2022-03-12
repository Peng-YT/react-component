/*
 * @Author: 彭越腾
 * @Date: 2021-08-18 18:34:55
 * @LastEditTime: 2021-11-26 16:09:51
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */
import { Radio } from 'antd';
import React from 'react';
import { useRelation } from './hook';
const { Button, Group } = Radio;
function RadioR({ children, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? ('') : (React.createElement(Radio, { ...props, disabled: optionIsDisabled }, children));
}
const GroupR = ({ children, ...props }) => {
    const { isDisabled } = useRelation(props);
    return (React.createElement(Group, { ...props, disabled: isDisabled }, children));
};
function ButtonR({ children, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? ('') : (React.createElement(Button, { ...props, disabled: optionIsDisabled }, children));
}
export { GroupR as Group, ButtonR as Button };
RadioR.Button = ButtonR;
RadioR.Group = GroupR;
export default RadioR;
