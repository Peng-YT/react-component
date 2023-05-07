import { Form, FormItemProps } from 'antd';
import type { FormProps, FormInstance } from 'antd';
import React from 'react';
import Checkbox from './Checkbox';
import Radio from './Radio';
import Select from './Select';
import Switch from './Switch';
import { FormRelationDetailType, FormRelationType } from '../types/common';
export declare const RelationInfoContext: React.Context<FormRelationType<any>[]>;
export declare const FormInstanceContext: React.Context<FormInstance<any>>;
export declare const OtherFormDataContext: React.Context<Record<string, any>>;
export declare const TriggerRelationContext: React.Context<boolean>;
export declare const NameContext: React.Context<string>;
/**
 * 在表单联动的影响下 该字段是否可设置
 * @param field
 * @returns
 */
export declare const getFieldIsOpen: (field?: FormRelationDetailType) => boolean;
/** 根据表单值，获取条件匹配的表单联动关系信息 */
export declare function getMatchRelationResByFormData<Info extends any>(relationInfoList: FormRelationType<Info>[], formData: Partial<Record<keyof Info, any>>, otherFormData?: Partial<Record<keyof Info, any>> | null): FormRelationType<Info>[];
export declare const optionIsDisabled: (props: Record<string, any>, relationDetail: FormRelationDetailType, optionsValueProp?: string) => any;
export declare const optionIsHide: (props: Record<string, any>, relationDetail: FormRelationDetailType, optionsValueProp?: string) => any;
export declare const isDisabled: (props: Record<string, any>, relationDetail: FormRelationDetailType) => any;
export declare const mergeRelation: (prevRelation: Partial<Record<any, FormRelationDetailType>>, nextRelation: Partial<Record<any, FormRelationDetailType>>) => Partial<Record<string, FormRelationDetailType>>;
/**
 * 获取发生联动之后表单的最终值
 * @param relationInfo 联动关系
 * @param pendingFormValues 即将要渲染的表单的值
 * @param prevEffectValues 上一次联动关系计算后得到的 受到了影响的表单的值
 * @param triggerChangeKeys 触发了此次更新的表单key
 * @returns 联动计算之后最终的表单值
 */
export declare function initRelationValue<Info extends any>(relationInfo: FormRelationType<Info>[], pendingFormValues: Partial<Record<keyof Info, any>>, prevEffectValues: Partial<Record<keyof Info, any>>, triggerChangeKeys: any[], needTriggerReset?: boolean): Partial<Record<keyof Info, any>>;
type FormItemType = typeof Form.Item;
declare function ItemComponent<Values = any>({ children, ...props }: FormItemProps<Values>): JSX.Element;
declare const ItemR: typeof ItemComponent & Omit<FormItemType, ''>;
interface FormRPropsType<Values = any> extends FormProps<Values> {
    relationInfo: FormRelationType[];
    onRelationValueChange: (effect: Record<string, any>, relation: boolean) => any;
    otherFormData?: Record<string, any>;
    /** 是否触发表单联动 */
    triggerRelation?: boolean;
    triggerResetValue?: boolean;
}
type FormType = typeof Form;
declare function FormComponent<Values = any>({ onRelationValueChange, relationInfo, children, triggerRelation, triggerResetValue, otherFormData, ...props }: FormRPropsType<Values> & {
    ref?: React.Ref<FormInstance<Values>> | undefined;
}): JSX.Element;
declare const FormR: typeof FormComponent & Omit<FormType, ''>;
export * from 'antd';
export { ItemR as Item, Checkbox, Radio, Select, Switch, FormR as Form };
export default FormR;
