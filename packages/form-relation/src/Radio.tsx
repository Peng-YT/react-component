/*
 * @Author: 彭越腾
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

function RadioR({ children, ...props }: RadioProps & React.RefAttributes<HTMLElement>) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? (
        ''
    ) : (
        <Radio {...props} disabled={optionIsDisabled}>
            {children}
        </Radio>
    );
}

const GroupR: React.FC<RadioGroupProps & React.RefAttributes<HTMLDivElement>> = ({
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

function ButtonR({ children, ...props }: RadioButtonProps & React.RefAttributes<any>) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? (
        ''
    ) : (
        <Button {...props} disabled={optionIsDisabled}>
            {children}
        </Button>
    );
}

export { GroupR as Group, ButtonR as Button };
RadioR.Button = ButtonR;
RadioR.Group = GroupR;
export default RadioR;
