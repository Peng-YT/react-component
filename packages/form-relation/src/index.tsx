/* eslint-disable react-hooks/exhaustive-deps */
/*
 * @Author: @ppeng
 * @Date: 2021-08-16 17:33:33
 * @LastEditTime: 2021-12-29 15:17:33
 * @LastEditors: OBKoro1
 * @Description: 能控制各个字段之间联动的表单
 */
/* eslint-disable react-hooks/exhaustive-deps */

import { Form, FormItemProps } from 'antd';
import type { FormProps, FormInstance } from 'antd';
import React, { useContext, createContext, useState, ReactNode } from 'react';
import Checkbox from './Checkbox';
import Radio from './Radio';
import Select from './Select';
import Switch from './Switch';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useDebounce, useMount } from 'react-use';
import { FormRelationDetailType, FormRelationType } from '../types/common';

const { useForm } = Form;

export const RelationInfoContext = createContext<FormRelationType[]>([]);

export const FormInstanceContext = createContext<FormInstance | null>(null);

export const OtherFormDataContext = createContext<Record<string, any> | undefined | null>(null);

export const TriggerRelationContext = createContext<boolean>(true);

export const NameContext = createContext('');

const isSame = (value1, value2) => {
    if (Array.isArray(value1) && Array.isArray(value2)) {
        return (
            value1.length === value2.length &&
            value1.every((input) => value2.includes(input))
        )
    }
    if (Array.isArray(value2) && !Array.isArray(value1)) {
        return value2.includes(value1)
    }
    if (!Array.isArray(value2) && Array.isArray(value1)) {
        return value1.includes(value2)
    }
    /* if (typeof value1 === 'symbol' || typeof value2 === 'symbol') {
        return value1 === value2;
    } */
    if (Number.isNaN(value1) && Number.isNaN(value2)) {
        return true
    }
    return value1 === value2
}

// 判断表单值是否匹配到了某个联动关系的条件
const formValueIsMatchInCondition = (formValue, conditionVal) => {
    if (typeof conditionVal === 'function') {
        return conditionVal(formValue)
    }
    return isSame(formValue, conditionVal)
}

const hasProp = (obj: Record<string, any>, key) => {
    return Object.keys(obj).includes(key);
};

/**
 * 在表单联动的影响下 该字段是否可设置
 * @param field
 * @returns
 */
export const getFieldIsOpen = (field?: FormRelationDetailType) => {
    return field !== false
}

/** 根据表单值，获取条件匹配的表单联动关系信息 */
export function getMatchRelationResByFormData<Info extends any>(
    relationInfoList: FormRelationType<Info>[],
    formData: Partial<Record<keyof Info, any>>,
    otherFormData?: Partial<Record<keyof Info, any>> | null,
) {
    // 是否匹配到了这个条件
    const isMatchCondition = (
        conditions: FormRelationType<Info>['conditions'],
        matchRule: 'OR' | 'AND' = 'AND',
    ) => {
        if (conditions === 'default') {
            return true
        }
        const matchFn = matchRule === 'AND' ? conditions.every : conditions.some
        return matchFn.call(conditions, (condition) => {
            let formValue: any
            if (otherFormData) {
                formValue = hasProp(formData, condition.key)
                    ? formData[condition.key as string]
                    : otherFormData[condition.key as string]
            } else {
                formValue = formData[condition.key as string]
            }
            const isMatch = formValueIsMatchInCondition(
                formValue,
                condition.value,
            )
            if (isMatch && condition.conditions) {
                return isMatchCondition(
                    condition.conditions,
                    condition.matchRule,
                )
            }
            return isMatch
        })
    }
    return relationInfoList
        .filter((item) => {
            return isMatchCondition(item.conditions, item.matchRule)
        })
        .sort((a, b) => (a.weight || 0) - (b.weight || 0))
}

export const optionIsDisabled = (
    props: Record<string, any>,
    relationDetail: FormRelationDetailType,
    optionsValueProp?: string,
) => {
    if(props.disabled !== undefined) {
        return props.disabled
    }
    const optionValue = optionsValueProp ? props[optionsValueProp] : props.value;
    if (relationDetail && relationDetail.disableOptions) {
        return relationDetail.disableOptions.includes(optionValue);
    }
    return props.disabled;
};

export const optionIsHide = (
    props: Record<string, any>,
    relationDetail: FormRelationDetailType,
    optionsValueProp?: string,
) => {
    const optionValue = optionsValueProp ? props[optionsValueProp] : props.value;
    if (relationDetail && relationDetail.hideOptions) {
        return relationDetail.hideOptions.includes(optionValue);
    }
    return false;
};

export const isDisabled = (props: Record<string, any>, relationDetail: FormRelationDetailType) => {
    if (props.disabled !== undefined) {
        return props.disabled
    }
    if (relationDetail && relationDetail.disabled !== undefined) {
        return relationDetail.disabled;
    }
    return props.disabled;
};

export const mergeRelation = (
    prevRelation: Partial<Record<any, FormRelationDetailType>>,
    nextRelation: Partial<Record<any, FormRelationDetailType>>,
) => {
    const newRelation: Partial<Record<string, FormRelationDetailType>> = {};
    Object.keys(prevRelation).forEach((key) => {
        newRelation[key] = prevRelation[key];
    });
    Object.keys(nextRelation).forEach((key) => {
        const prevRelationItemInfo = newRelation[key];
        const nextRelationItemInfo = nextRelation[key];
        if (prevRelationItemInfo && nextRelationItemInfo) {
            const prevDisableOptions = prevRelationItemInfo.disableOptions;
            const nextDisableOptions = nextRelationItemInfo.disableOptions;
            let disableOptions;
            if (prevDisableOptions || nextDisableOptions) {
                disableOptions = [...(prevDisableOptions || []), ...(nextDisableOptions || [])];
            }
            const prevHideOptions = prevRelationItemInfo.hideOptions;
            const nextHideOptions = nextRelationItemInfo.hideOptions;
            let hideOptions;
            if (prevHideOptions || nextHideOptions) {
                hideOptions = [...(prevHideOptions || []), ...(nextHideOptions || [])];
            }
            newRelation[key] = {
                ...newRelation[key],
                ...nextRelation[key],
                disableOptions,
                hideOptions,
            };
        } else {
            newRelation[key] = nextRelation[key];
        }
    });
    return newRelation;
};

const getHandleValue = (curValue, disableOptions?: string[], excludeDisableOption = true) => {
    if (!excludeDisableOption) {
        return curValue;
    }
    if (!disableOptions || !disableOptions.length) {
        return curValue;
    }
    if (Array.isArray(curValue)) {
        return curValue.filter((item) => {
            return !disableOptions.includes(item);
        });
    }
    if (disableOptions.includes(curValue)) {
        return undefined;
    }
    return curValue;
};

const getValuesFromRelation = (
    relation: Record<string, FormRelationDetailType>,
    pendingFormValues: Record<string, any>,
) => {
    return Object.entries(relation).reduce((prev, cur) => {
        const [key, detail] = cur;
        const curValue = pendingFormValues[key];
        let newValue;
        const curValueUnable =
            curValue === undefined ||
            (detail && detail.disableOptions?.includes(curValue)) ||
            (detail && detail.hideOptions?.includes(curValue)) ||
            curValue?.some?.((item) => detail && detail.disableOptions?.includes(item)) ||
            curValue?.some?.((item) => detail && detail.hideOptions?.includes(item));
        if (
            curValueUnable &&
            detail &&
            hasProp(detail, 'resetValue') &&
            !hasProp(detail, 'value')
        ) {
            newValue = getHandleValue(
                detail.resetValue,
                [...(detail.disableOptions || []), ...(detail.hideOptions || [])],
                detail.valueExcludeDisableOption,
            );
        } else if (detail && hasProp(detail, 'value')) {
            if (typeof detail.value === 'function') {
                newValue = getHandleValue(
                    detail.value(curValue),
                    [...(detail.disableOptions || []), ...(detail.hideOptions || [])],
                    detail.valueExcludeDisableOption,
                );
            } else {
                newValue = getHandleValue(
                    detail.value,
                    [...(detail.disableOptions || []), ...(detail.hideOptions || [])],
                    detail.valueExcludeDisableOption,
                );
            }
        } else if (detail === false) {
            newValue = undefined;
        } else {
            newValue = curValue;
        }
        return {
            ...prev,
            [key]: newValue,
        };
    }, {});
};
const cmpArray = (
    match1: FormRelationType<any>[],
    match2: FormRelationType<any>[],
) => {
    if (match1.length !== match2.length) {
        return false
    }
    return match1.every((item) => {
        return match2.indexOf(item) > -1
    })
}
/** 获取 值发生了变化的key */
const getValueChangeKeys = (prevValues, curValues) => {
    const allKeys = [...new Set(Object.keys(prevValues).concat(Object.keys(curValues)))];
    const valueChangeKeys: string[] = [];
    allKeys.forEach((key) => {
        if (prevValues[key] !== curValues[key]) {
            valueChangeKeys.push(key);
        }
    });
    return valueChangeKeys;
};

/**
 * 获取发生联动之后表单的最终值
 * @param relationInfo 联动关系
 * @param pendingFormValues 即将要渲染的表单的值
 * @param prevEffectValues 上一次联动关系计算后得到的 受到了影响的表单的值
 * @param triggerChangeKeys 触发了此次更新的表单key
 * @returns 联动计算之后最终的表单值
 */
export function initRelationValue<Info extends any>(
    relationInfo: FormRelationType<Info>[],
    pendingFormValues: Partial<Record<keyof Info, any>>,
    prevEffectValues: Partial<Record<keyof Info, any>>,
    triggerChangeKeys: any[],
    needTriggerReset = true,
): Partial<Record<keyof Info, any>> {
    const match = getMatchRelationResByFormData(relationInfo, pendingFormValues)

    const relation: Record<string, FormRelationDetailType> = match.reduce(
        (prev, cur) => {
            const isTrigger =
                cur.conditions === 'default' ||
                cur.conditions.find((item) =>
                    triggerChangeKeys.includes(item.key),
                )
            const isDefault = cur.conditions === 'default'
            const curRelation: FormRelationType<any>['relation'] = {
                ...cur.relation,
            }
            if (isTrigger && needTriggerReset) {
                // eslint-disable-next-line no-restricted-syntax, guard-for-in
                for (const prop in curRelation) {
                    const curRelationDetail = curRelation[prop]
                    const needResetWhenOnlyEmpty =
                        curRelationDetail === false ||
                        (curRelationDetail?.needResetWhenOnlyEmpty ?? true)
                    const curRelationResetValueIsValid = // 重置值是否可用
                        curRelationDetail &&
                        hasProp(curRelationDetail, 'resetValue') && // 拥有重置值
                        !hasProp(curRelationDetail, 'value') // 没有固定值value
                    const needResetValue = // 需要重置的条件
                        !needResetWhenOnlyEmpty || // 关闭了【值为空时进行重置】
                        (needResetWhenOnlyEmpty && !pendingFormValues[prop]) || // 值为空、并且开启了【值为空时进行重置】
                        (isDefault && !pendingFormValues[prop]) // 值为空、并且拥有默认值
                    if (curRelationResetValueIsValid && needResetValue) {
                        curRelation[prop] = {
                            ...curRelationDetail,
                            value: curRelationDetail.resetValue,
                        }
                    }
                }
            }
            return mergeRelation(prev, curRelation)
        },
        {},
    )
    const effectValues = getValuesFromRelation(relation, pendingFormValues)
    const newFormValues = {
        ...pendingFormValues,
        ...effectValues,
    }
    const nextMatch = getMatchRelationResByFormData(relationInfo, newFormValues)
    const equalMatch = cmpArray(match, nextMatch)
    let allEffectRes = { ...prevEffectValues, ...effectValues }
    if (!equalMatch) {
        allEffectRes = initRelationValue(
            relationInfo,
            newFormValues,
            allEffectRes,
            getValueChangeKeys(pendingFormValues, newFormValues),
            needTriggerReset,
        )
    }
    return allEffectRes
}
type FormItemType = typeof Form.Item
function ItemComponent<Values = any>({ children, ...props }: FormItemProps<Values>) {
    const relationInfo = useContext(RelationInfoContext);
    const form = useContext(FormInstanceContext);
    const name = (props.name || '') as string;
    const otherFormData = useContext(OtherFormDataContext);
    const matchController = getMatchRelationResByFormData(
        relationInfo,
        form?.getFieldsValue(true) || {},
        otherFormData,
    );
    const FormItemIsShow = (() => {
        if (!matchController.length) {
            return true;
        }
        const relationDetail = matchController.reduce((prev, cur) => {
            return {
                ...prev,
                ...cur.relation,
            };
        }, {})[name];
        if (relationDetail === undefined || relationDetail === null) {
            return true;
        }
        return !!relationDetail;
    })();
    return (
        <NameContext.Provider value={name}>
            {FormItemIsShow ? (
                <Form.Item<Values>
                    {...props}
                    style={{
                        ...(props.style || {}),
                        display: FormItemIsShow ? props?.style?.display : 'none',
                    }}
                    rules={FormItemIsShow ? props.rules : undefined}
                >
                    {children}
                </Form.Item>
            ) : null}
        </NameContext.Provider>
    );
}
const ItemR: typeof ItemComponent & Omit<FormItemType, ''> = Object.assign(ItemComponent, Form.Item)
interface FormRPropsType<Values = any> extends FormProps<Values> {
    relationInfo: FormRelationType[];
    onRelationValueChange: (effect: Record<string, any>, relation: boolean) => any;
    otherFormData?: Record<string, any>;
    /** 是否触发表单联动 */
    triggerRelation?: boolean;
    triggerResetValue?: boolean;
}

type FormType = typeof Form

function FormComponent<Values = any>({
    onRelationValueChange,
    relationInfo,
    children,
    triggerRelation = true,
    triggerResetValue = true,
    otherFormData,
    ...props
}: FormRPropsType<Values> & {
    ref?: React.Ref<FormInstance<Values>> | undefined;
}) {
    const [form] = useForm(props.form);
    const originFormData = form.getFieldsValue(true);
    const formDataRef = useRef<{
        data: Record<string, any>;
        triggerKeys: string[];
    }>({
        data: {
            ...originFormData,
            ...(otherFormData || {}),
        },
        triggerKeys: [],
    });
    const [, triggerUpdate] = useState(`${+new Date()}`);
    const onChange = (effectValues: Record<string, any>) => {
        const { data } = formDataRef.current;
        const valueHasChange = Object.keys(effectValues).some((key) => {
            return !isSame(effectValues[key], data[key]);
        });
        if (valueHasChange) {
            onRelationValueChange(effectValues, true);
        }
        formDataRef.current.data = {
            ...formDataRef.current.data,
            ...effectValues,
        };
    };
    const run = (triggerKeys: string[]) => {
        const { data } = formDataRef.current;
        const effectValues = initRelationValue(relationInfo, data, {}, triggerKeys, triggerResetValue);
        onChange(effectValues);
    };
    useEffect(() => {
        const oldFormData = formDataRef.current.data;
        formDataRef.current.data = {
            ...originFormData,
            ...(otherFormData || {}),
        };
        const triggerKeys = getValueChangeKeys(oldFormData, formDataRef.current.data);
        formDataRef.current.triggerKeys =
            formDataRef.current.triggerKeys.concat(triggerKeys)
    }, [originFormData, otherFormData]);
    useDebounce(
        () => {
            if (!triggerRelation) {
                return;
            }
            run(formDataRef.current.triggerKeys);
            formDataRef.current.triggerKeys = []
        },
        100,
        [originFormData, otherFormData],
    );
    useMount(() => {
        if (!triggerRelation) {
            return;
        }
        run([]);
    });
    return (
        <Form<Values>
            colon={false}
            {...props}
            form={form}
            // eslint-disable-next-line consistent-return
            onValuesChange={(...arg) => {
                triggerUpdate(`${+new Date()}`);
                if (props.onValuesChange) {
                    return props.onValuesChange(...arg);
                }
            }}
        >
            <FormInstanceContext.Provider value={form}>
                <RelationInfoContext.Provider value={relationInfo}>
                    <OtherFormDataContext.Provider value={otherFormData}>
                        <TriggerRelationContext.Provider value={triggerRelation}>
                            {typeof children === 'function' ? children({
                                form,
                                relationInfo,
                                otherFormData,
                                triggerRelation
                            }, form) : children}
                        </TriggerRelationContext.Provider>
                    </OtherFormDataContext.Provider>
                </RelationInfoContext.Provider>
            </FormInstanceContext.Provider>
        </Form>
    );
}
const FormR: typeof FormComponent & Omit<FormType, ''> = Object.assign(FormComponent, Form)
export * from 'antd'
FormR.Item = ItemR;
export {
    ItemR as Item,
    Checkbox,
    Radio,
    Select,
    Switch,
    FormR as Form
};
export default FormR;
