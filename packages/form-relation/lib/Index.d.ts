import type { FormInstance, FormProps } from 'antd';
import { Form } from 'antd';
import { FormItemProps, RuleObject } from 'antd/es/form';
import { FormRelationDetailType, FormRelationType, FormValidateType } from 'form-relation/types/common';
import React from 'react';
import Checkbox from './Checkbox';
import Radio from './Radio';
import Select from './Select';
import Switch from './Switch';
export declare const RelationInfoContext: React.Context<FormRelationType<any>[]>;
export declare const FormInstanceContext: React.Context<FormInstance<any>>;
export declare const OtherFormDataContext: React.Context<Record<string, any>>;
export declare const FormValidateInfoContext: React.Context<{
    [x: string]: {
        rules?: RuleObject[] | ((inject: any) => RuleObject[]);
        deeps?: any;
    };
}>;
export declare const TriggerRelationContext: React.Context<boolean>;
export declare const NameContext: React.Context<string>;
export declare const OtherPropsContext: React.Context<{
    onVisibleChange?: (visible: boolean, name: string) => any;
}>;
/** 根据表单值，获取条件匹配的表单联动关系信息 */
export declare function getMatchRelationResByFormData<Info extends any>(relationInfoList: FormRelationType<Info>[], formData: Partial<Record<keyof Info, any>>, otherFormData?: Partial<Record<keyof Info, any>> | null): FormRelationType<Info>[];
/**
 *
 * @param relationInfo 表单联动配置
 * @param formValue 表单校验依赖的数据，需要传入哪些数据，根据传入的relationInfo的类型决定 如果relationInfo的ts类型为 FormRelationType(Dep)[]  那么formValue就需要传入Dep类型的数据
 * @param validateInfo 校验配置
 * @returns
 */
export declare function validateFromRelationInfo<Info extends any>(relationInfo: FormRelationType<Info>[], props: {
    formValue: Partial<Info>;
    validateInfo: FormValidateType;
}): Promise<{
    errorMsg?: string;
}[]>;
/**
 * 某个选项是否被禁用
 * @param props
 * @param relationDetail
 */
export declare const optionIsDisabled: (props: Record<string, any>, relationDetail: FormRelationDetailType, optionsValueProp?: string) => any;
/**
 * 某个选项是否被隐藏
 * @param props
 * @param relationDetail
 */
export declare const optionIsHide: (props: Record<string, any>, relationDetail: FormRelationDetailType, optionsValueProp?: string) => any;
/** 表单是否被禁用 */
export declare const isDisabled: (props: Record<string, any>, relationDetail: FormRelationDetailType) => any;
export declare function mergeRelation<Info extends any>(prevRelation: Partial<Record<keyof Info, FormRelationDetailType>>, nextRelation: Partial<Record<keyof Info, FormRelationDetailType>>): Partial<Record<keyof Info, FormRelationDetailType>>;
/**
 * 获取表单字段联动后的信息
 * @param relationInfoList 表单联动配置
 * @param formData 表单校验依赖的数据，需要传入哪些数据，根据传入的relationInfoList的类型决定 如果relationInfoList的ts类型为 FormRelationTypeFormRelationType(Dep)[]  那么formData就需要传入Dep类型的数据
 * @returns
 */
export declare function getCondition<Info extends any>(relationInfoList: FormRelationType<Info>[], formData: Partial<Record<keyof Info, any>>): Partial<Record<keyof Info, FormRelationDetailType>>;
/**
 * 在表单联动的影响下 该字段是否可设置
 * @param field
 * @returns
 */
export declare const getFieldIsOpen: (field?: FormRelationDetailType) => boolean;
/**
 * 根据表单联动关系和现有的表单值，生成一些需要变化的值
 * @param relationInfo 联动关系
 * @param pendingFormValues 即将要渲染的表单的值
 * @param prevEffectValues 上一次联动关系计算后得到的 表单变化的值
 * @param triggerChangeKeys 触发了此次更新的表单key
 * @returns 表单变化的值
 */
export declare function initRelationValue<Info extends any>(relationInfo: FormRelationType<Info>[], pendingFormValues: Partial<Record<keyof Info, any>>, prevEffectValues: Partial<Record<keyof Info, any>>, triggerChangeKeys: any[], needTriggerReset?: boolean, props?: {
    noResetValuesProp?: string[];
    recoverData?: Record<string, any>;
}): Partial<Record<keyof Info, any>>;
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
}
type FormType = Omit<typeof Form, 'Item'> & {
    Item: FormItemType;
};
declare function FormComponent<Values = any>({ onRelationValueChange, relationInfo, children, triggerRelation, triggerResetValue, validateFormInfo, otherFormData, formData, ...props }: FormRPropsType<Values> & {
    ref?: React.Ref<FormInstance<Values>> | undefined;
}): JSX.Element;
declare const FormR: typeof FormComponent & Omit<FormType, ''>;
export { ItemR as Item, Checkbox, Radio, Select, Switch, FormR as Form, };
export default FormR;
