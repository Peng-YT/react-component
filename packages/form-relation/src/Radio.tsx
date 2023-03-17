/*
 * @Author: @ppeng
 * @Date: 2021-08-18 18:34:55
 * @LastEditTime: 2021-11-26 16:09:51
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */
import { Radio } from 'antd';
import type { RadioProps, RadioGroupProps } from 'antd';
import React from 'react';
import type { RadioButtonProps } from 'antd/lib/radio/radioButton';
import { useRelation } from './hook';

const { Button, Group } = Radio;

function RadioComponent({ children, ...props }: RadioProps & React.RefAttributes<HTMLElement>) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? (
        ''
    ) : (
        <Radio {...props} disabled={optionIsDisabled}>
            {children}
        </Radio>
    );
}
const RadioR: typeof Radio = Object.assign(RadioComponent, Radio)

const GroupComponent: React.FC<RadioGroupProps & React.RefAttributes<HTMLDivElement>> = ({
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
function ButtonComponent({ children, ...props }: RadioButtonProps & React.RefAttributes<any>) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? (
        ''
    ) : (
        <Button {...props} disabled={optionIsDisabled}>
            {children}
        </Button>
    );
}
const ButtonR: typeof Button = Object.assign(ButtonComponent, Button)
RadioR.Button = ButtonR;
RadioR.Group = GroupR;
export default RadioR;
