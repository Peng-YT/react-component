import { NamePath } from 'antd/es/form/interface';
import { AllRelationType, FormRelationDetailType, FormRelationOpParamType, FormRelationOpResType, FormRelationType, FormValidateType } from '../types/common';
export declare const hasProp: (obj: Record<string, any>, key: any) => boolean;
/**
 * 合并两个对象
 * @param origin
 * @param newData
 * @param {
* mutable： 可变性，会直接修改origin里面的值
* }
* @returns
*/
export declare const assignDeep: (origin: unknown, newData: unknown, { mutable }: {
    mutable?: boolean;
}) => unknown;
export declare const getObjVal: (obj: Record<string, any>, key: any) => any;
export declare const isMatch: (value1: any, value2: any) => boolean;
export declare const formValueIsMatchInCondition: (formValue: any, conditionVal: any, formData: any, { prevVal, prevFormData }: {
    prevVal: any;
    prevFormData: any;
}) => any;
export declare function isMatchCondition<Info>(conditions: FormRelationType<Info>['conditions'], matchRule: 'OR' | 'AND', formData: Info, props: {
    oldFormData: Info;
}): boolean;
export declare function and<Info extends any>(params: FormRelationOpParamType<Info>): FormRelationOpResType<Info>;
export declare function or<Info extends any>(params: FormRelationOpParamType<Info>): FormRelationOpResType<Info>;
/** 根据表单值，获取条件匹配的表单联动关系信息 */
export declare function getMatchRelationResByFormData<Info extends object>(relationInfoList: FormRelationType<Info>[], formData: Info, props?: {
    oldFormData?: Info;
}): FormRelationType<Info>[];
/**
 *
 * @param relationInfo 表单联动配置
 * @param formValue 表单校验依赖的数据，需要传入哪些数据，根据传入的relationInfo的类型决定 如果relationInfo的ts类型为 FormRelationType(Dep)[]  那么formValue就需要传入Dep类型的数据
 * @param validateInfo 校验配置
 * @returns
 */
export declare function validateFromRelationInfo<Info extends object>(relationInfo: FormRelationType<Info>[], props: {
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
export declare function mergeRelation<Info extends object>(prevRelation: AllRelationType<Info>, nextRelation: AllRelationType<Info>): AllRelationType<Info>;
/**
 * 获取表单字段联动后的信息
 * @param relationInfoList 表单联动配置
 * @param formData 表单校验依赖的数据，需要传入哪些数据，根据传入的relationInfoList的类型决定 如果relationInfoList的ts类型为 FormRelationTypeFormRelationType(Dep)[]  那么formData就需要传入Dep类型的数据
 * @returns
 */
export declare function getCondition<Info extends object>(relationInfoList: FormRelationType<Info>[], formData: Info, props?: {
    oldFormData?: Info;
}): Partial<Record<keyof Info, FormRelationDetailType>>;
/**
 * 在表单联动的影响下 该字段是否可设置
 * @param field
 * @returns
 */
export declare const getFieldIsOpen: (field?: FormRelationDetailType) => boolean;
export declare function getValuesFromRelation<Info>(relation: AllRelationType<Info>, pendingFormValues: Record<string, any>): {};
export declare const cpmNamePath: (name1: any[], name2: any[]) => boolean;
export declare const isEqualName: (name1: NamePath, name2: NamePath) => boolean;
export declare const cmpArray: (match1: FormRelationType<any>[], match2: FormRelationType<any>[]) => boolean;
/**
 * 根据表单联动关系和现有的表单值，生成一些需要变化的值
 * @param relationInfo 联动关系
 * @param pendingFormValues 即将要渲染的表单的值
 * @param prevEffectValues 上一次联动关系计算后得到的 表单变化的值
 * @param needTriggerReset 是否需要触发值的重置
 * @param recoverData 用于值重置的数据
 * @param needTriggerReset 是否需要触发值的重置
 * @param oldFormValues 旧的表单值
 * @param triggerChangeKey 触发此次联动的表单控件的key
 * @returns 表单变化的值
 */
export declare function initRelationValue<Info extends object>(relationInfo: FormRelationType<Info>[], pendingFormValues: Info, prevEffectValues: Partial<Record<keyof Info, any>>, needTriggerReset?: boolean, props?: {
    recoverData?: Record<string, any>;
    oldFormValues?: Info;
    triggerChangeKey?: NamePath;
}): Partial<Record<keyof Info, any>>;
