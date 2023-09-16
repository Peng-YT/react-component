/*
 * @Author: 彭越腾
 * @Date: 2021-08-19 10:34:17
 * @LastEditTime: 2023-08-18 11:53:14
 * @LastEditors: 彭越腾
 * @Description: In User Settings Edit
 * @FilePath: \admin-market\src\components\Common\RelationForm\Checkbox.tsx
 */

import { InfoCircleOutlined } from '@ant-design/icons'
import type { CheckboxProps } from 'antd'
import { Checkbox, Tooltip } from 'antd'
import type { CheckboxGroupProps } from 'antd/es/checkbox'
import React from 'react'
import { useRelation } from './hook'

const { Group } = Checkbox

function CheckboxComponent({
    children,
    desc,
    ...props
}: CheckboxProps &
    React.RefAttributes<HTMLInputElement> & { desc?: JSX.Element | string }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props)
    return optionIsHide ? null : (
        <Checkbox {...props} disabled={optionIsDisabled}>
            {children}
            {desc ? (
                <div>
                    <Tooltip overlay={desc} style={{ width: 'auto' }}>
                        &nbsp;
                        <InfoCircleOutlined></InfoCircleOutlined>
                    </Tooltip>
                </div>
            ) : null}
        </Checkbox>
    )
}
const CheckboxR: typeof Checkbox = Object.assign(CheckboxComponent, Checkbox)
const GroupComponent: React.FC<
    CheckboxGroupProps & React.RefAttributes<HTMLDivElement>
> = ({ children, ...props }) => {
    const { isDisabled } = useRelation(props)
    return (
        <Group {...props} disabled={isDisabled}>
            {children}
        </Group>
    )
}
const GroupR = GroupComponent as typeof Group

CheckboxR.Group = GroupR
export default CheckboxR
