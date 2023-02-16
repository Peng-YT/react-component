import type { SelectProps } from 'antd';
import React from 'react';
import type { SelectValue, OptionProps } from 'antd/es/select';
declare const OptGroup: import("rc-select/lib/OptGroup").OptionGroupFC, SECRET_COMBOBOX_MODE_DO_NOT_USE: string;
declare function SelectR<VT extends SelectValue = SelectValue>({ children, ...props }: SelectProps<VT> & {
    ref?: React.Ref<any> | undefined;
}): JSX.Element;
declare namespace SelectR {
    var Option: import("rc-select/lib/Option").OptionFC;
    var OptGroup: import("rc-select/lib/OptGroup").OptionGroupFC;
    var SECRET_COMBOBOX_MODE_DO_NOT_USE: string;
}
declare const Option: React.FC<OptionProps> & {
    isSelectOption: boolean;
};
export { SECRET_COMBOBOX_MODE_DO_NOT_USE, Option, OptGroup };
export default SelectR;
