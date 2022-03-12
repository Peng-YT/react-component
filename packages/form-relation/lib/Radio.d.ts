import type { RadioProps, RadioGroupProps } from 'antd';
import React from 'react';
import type { RadioButtonProps } from 'antd/lib/radio/radioButton';
declare function RadioR({ children, ...props }: RadioProps & React.RefAttributes<HTMLElement>): "" | JSX.Element;
declare namespace RadioR {
    var Button: typeof ButtonR;
    var Group: React.FC<RadioGroupProps & React.RefAttributes<HTMLDivElement>>;
}
declare const GroupR: React.FC<RadioGroupProps & React.RefAttributes<HTMLDivElement>>;
declare function ButtonR({ children, ...props }: RadioButtonProps & React.RefAttributes<any>): "" | JSX.Element;
export { GroupR as Group, ButtonR as Button };
export default RadioR;
