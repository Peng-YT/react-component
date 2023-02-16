import type { SelectProps } from 'antd';
import type { SelectValue } from 'antd/es/select';
import React from 'react';
declare const OptGroup: import("rc-select/lib/OptGroup").OptionGroupFC, Option: import("rc-select/lib/Option").OptionFC, SECRET_COMBOBOX_MODE_DO_NOT_USE: string;
declare function DraggableSelect<VT extends SelectValue = SelectValue>({ children, ...props }: SelectProps<VT> & {
    ref?: React.Ref<any> | undefined;
}): JSX.Element;
declare namespace DraggableSelect {
    var Option: import("rc-select/lib/Option").OptionFC;
    var OptGroup: import("rc-select/lib/OptGroup").OptionGroupFC;
    var SECRET_COMBOBOX_MODE_DO_NOT_USE: string;
}
export { SECRET_COMBOBOX_MODE_DO_NOT_USE, Option, OptGroup, DraggableSelect as Select };
export default DraggableSelect;
