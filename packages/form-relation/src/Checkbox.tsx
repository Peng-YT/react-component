/*
 * @Author: 彭越腾
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

const { Group, __ANT_CHECKBOX } = Checkbox;

function CheckboxR({ children, ...props }: CheckboxProps & React.RefAttributes<HTMLInputElement>) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (
        <Checkbox {...props} disabled={optionIsDisabled}>
            {children}
        </Checkbox>
    );
}

const GroupR: React.FC<CheckboxGroupProps & React.RefAttributes<HTMLDivElement>> = ({
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

export { GroupR as Group };
CheckboxR.Group = GroupR;
// eslint-disable-next-line no-underscore-dangle
CheckboxR.__ANT_CHECKBOX = __ANT_CHECKBOX;
export default CheckboxR;
