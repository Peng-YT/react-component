import { Switch } from 'antd';
import { useRelation } from './hook';
import React from 'react'
type SwitchType = typeof Switch;
const SwitchComponent = (props) => {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (
        <Switch {...props} disabled={optionIsDisabled}></Switch>
    );
};
const SwitchR: SwitchType = Object.assign(SwitchComponent, Switch);
export { SwitchR as Switch };
export default SwitchR;
