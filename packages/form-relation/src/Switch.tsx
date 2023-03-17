/*
 * @Author: @ppeng
 * @Date: 2021-08-19 10:34:17
 * @LastEditTime: 2021-11-26 16:06:48
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */

import { Switch } from 'antd';
import React from 'react';
import { useRelation } from './hook';
type SwitchType = typeof Switch
const SwitchComponent = (props) => {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (
        <Switch {...props} disabled={optionIsDisabled}>
        </Switch>
    );
}
const SwitchR: SwitchType = Object.assign(SwitchComponent, Switch)
export { SwitchR as Switch };
export default SwitchR;
