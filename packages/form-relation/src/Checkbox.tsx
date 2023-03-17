/*
 * @Author: @ppeng
 * @Date: 2021-08-19 10:34:17
 * @LastEditTime: 2021-11-26 16:06:48
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */

import { Checkbox } from 'antd';
import type { CheckboxProps } from 'antd';
import React from 'react';
import type { CheckboxGroupProps } from 'antd/es/checkbox';
import { useRelation } from './hook';

const { Group } = Checkbox;

function CheckboxComponent({ children, ...props }: CheckboxProps & React.RefAttributes<HTMLInputElement>) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (
        <Checkbox {...props} disabled={optionIsDisabled}>
            {children}
        </Checkbox>
    );
}
const CheckboxR: typeof Checkbox = Object.assign(CheckboxComponent, Checkbox)
const GroupComponent: React.FC<CheckboxGroupProps & React.RefAttributes<HTMLDivElement>> = ({
    children,
    ...props
}) => {
    const { isDisabled } = useRelation(props);
    return (
        <Group {...props} disabled={isDisabled}>
            {children}
        </Group>
    );
};
const GroupR: typeof Group = Object.assign(GroupComponent, Group)
CheckboxR.Group = GroupR;
export default CheckboxR;
