import type { FormInstance, FormItemProps, FormProps } from 'antd';
import { Form } from 'antd';
import { FormRelationType, FormValidateType } from './types';
import React from 'react';
import Checkbox from './Checkbox';
import Radio from './Radio';
import Select from './Select';
import Switch from './Switch';
type FormItemType = typeof Form.Item;
declare function ItemComponent<Values = any>({ children, ...props }: FormItemProps<Values>): JSX.Element;
declare const ItemR: typeof ItemComponent & Omit<FormItemType, ''>;
interface FormRPropsType<Values = any> extends FormProps<Values> {
    relationInfo: FormRelationType[];
    onRelationValueChange: (effect: Record<string, any>, relation: boolean) => any;
    formData?: Record<string, any>;
    otherFormData?: Record<string, any>;
    validateFormInfo?: FormValidateType;
    /** 是否触发表单联动 */
    triggerRelation?: boolean;
    triggerResetValue?: boolean;
    /** 触发表单联动后生成的新的表单值，对原字段值进行合并还是对原字段值进行覆盖 */
    changeDataType?: 'merge' | 'cover';
}
type FormType = Omit<typeof Form, 'Item'> & {
    Item: FormItemType;
};
declare function FormComponent<Values = any>({ onRelationValueChange, relationInfo, children, triggerRelation, triggerResetValue, validateFormInfo, otherFormData, formData, changeDataType, ...props }: FormRPropsType<Values> & {
    ref?: React.Ref<FormInstance<Values>> | undefined;
}): JSX.Element;
declare const FormR: typeof FormComponent & Omit<FormType, ''>;
export { ItemR as Item, Checkbox, Radio, Select, Switch, FormR as Form, };
export default FormR;
