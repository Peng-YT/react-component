/*
 * @Author: 彭越腾
 * @Date: 2021-08-18 18:34:55
 * @LastEditTime: 2023-05-12 14:59:59
 * @LastEditors: 彭越腾
 * @Description: In User Settings Edit
 * @FilePath: \admin-market\src\components\Common\RelationForm\Radio.tsx
 */
import { InfoCircleOutlined } from '@ant-design/icons'
import type { RadioGroupProps, RadioProps } from 'antd'
import { Radio, Tooltip } from 'antd'
import type { RadioButtonProps } from 'antd/es/radio/radioButton'
import React from 'react'
import { useRelation } from './hook'

const { Button, Group } = Radio

function RadioComponent({
    children,
    ...props
}: RadioProps & React.RefAttributes<HTMLElement>) {
    const { optionIsHide, optionIsDisabled } = useRelation(props)
    return optionIsHide ? null : (
        <Radio {...props} disabled={optionIsDisabled}>
            {children}
        </Radio>
    )
}
const RadioR: typeof Radio = Object.assign(RadioComponent, Radio)

const GroupComponent: React.FC<
    RadioGroupProps & React.RefAttributes<HTMLDivElement>
> = ({ children, ...props }) => {
    const { isDisabled } = useRelation(props)
    return (
        <Group {...props} disabled={isDisabled}>
            {children}
        </Group>
    )
}
const GroupR = GroupComponent as typeof Group
function ButtonComponent({
    children,
    desc,
    ...props
}: RadioButtonProps &
    React.RefAttributes<any> & { desc?: JSX.Element | string }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props)
    return optionIsHide ? null : (
        <Button {...props} disabled={optionIsDisabled}>
            {children}
            {desc ? (
                <Tooltip overlay={desc}>
                    &nbsp;
                    <InfoCircleOutlined></InfoCircleOutlined>
                </Tooltip>
            ) : null}
        </Button>
    )
}
const ButtonR: typeof Button = Object.assign(ButtonComponent, Button)
RadioR.Button = ButtonR
RadioR.Group = GroupR
export default RadioR
