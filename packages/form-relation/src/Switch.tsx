import { Switch } from 'antd'
import { useRelation } from './hook'
import React from 'react'
type SwitchType = typeof Switch
const SwitchComponent = (props) => {
    const { isDisabled } = useRelation(props)
    return <Switch {...props} disabled={isDisabled}></Switch>
}
const SwitchR: SwitchType = Object.assign(SwitchComponent, Switch)
export { SwitchR as Switch }
export default SwitchR
