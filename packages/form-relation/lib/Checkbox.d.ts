import type { CheckboxProps } from 'antd';
import React from 'react';
import type { CheckboxGroupProps } from 'antd/es/checkbox';
declare function CheckboxR({ children, ...props }: CheckboxProps & React.RefAttributes<HTMLInputElement>): JSX.Element;
declare namespace CheckboxR {
    var Group: React.FC<CheckboxGroupProps & React.RefAttributes<HTMLDivElement>>;
    var __ANT_CHECKBOX: boolean;
}
declare const GroupR: React.FC<CheckboxGroupProps & React.RefAttributes<HTMLDivElement>>;
export { GroupR as Group };
export default CheckboxR;
