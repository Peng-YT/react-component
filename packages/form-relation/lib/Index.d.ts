import { FormItemProps } from 'antd';
import type { FormProps, FormInstance } from 'antd';
import React from 'react';
import Checkbox from './Checkbox';
import Radio from './Radio';
import Select from './Select';
import { FormRelationDetailType, FormRelationType } from '../types/common';
declare const useForm: typeof import("antd/lib/form/Form").useForm, List: React.FC<import("antd/lib/form").FormListProps>, ErrorList: typeof import("antd/lib/form/ErrorList").default, Provider: React.FC<import("antd/lib/form/context").FormProviderProps>;
export declare const RelationInfoContext: React.Context<FormRelationType<any>[]>;
export declare const FormInstanceContext: React.Context<FormInstance<any>>;
export declare const OtherFormDataContext: React.Context<Record<string, any>>;
export declare const TriggerRelationContext: React.Context<boolean>;
export declare const NameContext: React.Context<string>;
export declare const getMatchController: (relationInfoList: FormRelationType[], formData: Record<string, any>, otherFormData?: Record<string, any> | null) => FormRelationType<any>[];
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
export declare const initRelationValue: (relationInfo: FormRelationType[], pendingFormValues: Record<string, any>, prevEffectValues: Record<string, any>, triggerChangeKeys: any[], needTriggerRest?: boolean) => Record<string, any>;
declare function ItemR<Values = any>({ children, ...props }: FormItemProps<Values>): JSX.Element;
interface FormRPropsType<Values = any> extends FormProps<Values> {
    relationInfo: FormRelationType[];
    onRelationValueChange: (effect: Record<string, any>, relation: boolean) => any;
    formData?: Record<string, any>;
    otherFormData?: Record<string, any>;
    /** 是否触发表单联动 */
    triggerRelation?: boolean;
    triggerResetValue?: boolean;
}
declare function FormR<Values = any>({ onRelationValueChange, relationInfo, children, triggerRelation, triggerResetValue, otherFormData, formData, ...props }: FormRPropsType<Values> & {
    ref?: React.Ref<FormInstance<Values>> | undefined;
}): JSX.Element;
declare namespace FormR {
    var Item: typeof ItemR;
    var useForm: typeof import("antd/lib/form/Form").useForm;
    var List: React.FC<import("antd/lib/form").FormListProps>;
    var ErrorList: typeof import("antd/lib/form/ErrorList").default;
    var Provider: React.FC<import("antd/lib/form/context").FormProviderProps>;
}
export * from 'antd';
export { ItemR as Item, useForm, List, ErrorList, Provider, Checkbox, Radio, Select, FormR as Form };
export default FormR;
