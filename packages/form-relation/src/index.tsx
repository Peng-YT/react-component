/* eslint-disable react-hooks/exhaustive-deps */
/*
 * @Author: 彭越腾
 * @Date: 2021-08-16 17:33:33
 * @LastEditTime: 2021-12-29 15:17:33
 * @LastEditors: OBKoro1
 * @Description: 能控制各个字段之间联动的表单
 */
/* eslint-disable react-hooks/exhaustive-deps */

import { Form, FormItemProps } from 'antd';
import type { FormProps, FormInstance } from 'antd';
import React, { useContext, createContext, useState } from 'react';
import Checkbox from './Checkbox';
import Radio from './Radio';
import Select from './Select';
import { useMount, useUpdateEffect } from 'react-use';

const { useForm, List, ErrorList, Provider } = Form;

export const RelationInfoContext = createContext<FormRelationType[]>([]);

export const FormInstanceContext = createContext<FormInstance | null>(null);

export const OtherFormDataContext = createContext<Record<string, any> | undefined | null>(null);

export const TriggerRelationContext = createContext<boolean>(true);

export const NameContext = createContext('');

const cmpValues = (userInput, controllerValue) => {
    if (typeof controllerValue === 'function') {
        return controllerValue(userInput);
    }
    if (Array.isArray(userInput) && Array.isArray(controllerValue)) {
        return (
            userInput.length === controllerValue.length &&
            userInput.every((input) => controllerValue.includes(input))
        );
    }
    if (Array.isArray(controllerValue) && !Array.isArray(userInput)) {
        return controllerValue.includes(userInput);
    }
    if (!Array.isArray(controllerValue) && Array.isArray(userInput)) {
        return userInput.includes(controllerValue);
    }
    if (typeof userInput === 'symbol' || typeof controllerValue === 'symbol') {
        return userInput === controllerValue;
    }
    return `${userInput || ''}` === `${controllerValue || ''}`;
};

export const getMatchController = (
    relationInfoList: FormRelationType[],
    formData: Record<string, any>,
    otherFormData?: Record<string, any> | null,
) => {
    return relationInfoList
        .filter((item) => {
            const rule = item.matchRule || 'AND';
            const matchFn = rule === 'AND' ? item.controller.every : item.controller.some;
            return matchFn.call(item.controller, (ctr) => {
                if (otherFormData) {
                    const userInput =
                        formData[ctr.key as string] || otherFormData[ctr.key as string];
                    return cmpValues(userInput, ctr.value);
                }
                const userInput = formData[ctr.key as string];
                return cmpValues(userInput, ctr.value);
            });
        })
        .sort((a, b) => (a.weight || 0) - (b.weight || 0));
};

export const optionIsDisabled = (
    props: Record<string, any>,
    relationDetail: FormRelationDetailType,
    optionsValueProp?: string,
) => {
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

function ItemR<Values = any>({ children, ...props }: FormItemProps<Values>) {
    const relationInfo = useContext(RelationInfoContext);
    const form = useContext(FormInstanceContext);
    const name = (props.name || '') as string;
    const otherFormData = useContext(OtherFormDataContext);
    const matchController = getMatchController(
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
                        display: FormItemIsShow ? '' : 'none',
                    }}
                    rules={FormItemIsShow ? props.rules : undefined}
                >
                    {children}
                </Form.Item>
            ) : null}
        </NameContext.Provider>
    );
}

interface FormRPropsType<Values = any> extends FormProps<Values> {
    relationInfo: FormRelationType[];
    onRelationValueChange: (effect: Record<string, any>) => any;
    otherFormData?: Record<string, any>;
    /** 是否触发表单联动 */
    triggerRelation?: boolean;
}

function FormR<Values = any>({
    onRelationValueChange,
    relationInfo,
    children,
    otherFormData,
    triggerRelation = true,
    ...props
}: FormRPropsType<Values> & {
    ref?: React.Ref<FormInstance<Values>> | undefined;
}) {
    const [form] = useForm(props.form);
    const [oldFormValues, setOldFormValues] = useState<Record<string, any>>({});
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
    const hasProp = (obj: Record<string, any>, key) => {
        return Object.keys(obj).includes(key);
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
                curValue.some?.((item) => detail && detail.disableOptions?.includes(item)) ||
                curValue.some?.((item) => detail && detail.hideOptions?.includes(item));
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
    const cmpMatch = (match1: FormRelationType<any>[], match2: FormRelationType<any>[]) => {
        if (match1.length !== match2.length) {
            return false;
        }
        return match1.every((item) => {
            return match2.indexOf(item) > -1;
        });
    };
    const getValueChangeKeys = (prevValues, curValues) => {
        const allKeys = [...new Set(Object.keys(prevValues).concat(Object.keys(curValues)))];
        const valueChangeKeys: string[] = [];
        allKeys.forEach((key) => {
            if (!cmpValues(prevValues[key], curValues[key])) {
                valueChangeKeys.push(key);
            }
        });
        return valueChangeKeys;
    };
    const initRelationValue = (
        pendingFormValues,
        prevEffectValues: Record<string, any>,
        triggerChangeKeys: any[],
    ): Record<string, any> => {
        const match = getMatchController(relationInfo, pendingFormValues, otherFormData);
        const relation: Record<string, FormRelationDetailType> = match.reduce((prev, cur) => {
            const isTrigger = cur.controller.find((item) => triggerChangeKeys.includes(item.key));
            let curRelation: FormRelationType<any>['relation'] = {
                ...cur.relation,
            };
            if (isTrigger) {
                for (const key in curRelation) {
                    const detail = curRelation[key];
                    if (detail && hasProp(detail, 'resetValue') && !hasProp(detail, 'value')) {
                        curRelation[key] = {
                            ...detail,
                            value: detail.resetValue,
                        };
                    }
                }
            }
            return mergeRelation(prev, curRelation);
        }, {});
        const effectValues = getValuesFromRelation(relation, pendingFormValues);
        const newFormValues = {
            ...pendingFormValues,
            ...effectValues,
        };
        const nextMatch = getMatchController(relationInfo, newFormValues, otherFormData);
        const equalMatch = cmpMatch(match, nextMatch);
        let res = { ...prevEffectValues, ...effectValues };
        if (!equalMatch) {
            res = initRelationValue(
                newFormValues,
                res,
                getValueChangeKeys(pendingFormValues, newFormValues),
            );
        }
        return res;
    };
    const onChange = (effectValues: Record<string, any>) => {
        const valueHasChange = Object.keys(effectValues).some((key) => {
            return !cmpValues(effectValues[key], form.getFieldsValue(true)[key]);
        });
        /* if (props.className?.includes('ad-launch-form')) {
            console.log('valueHasChange', valueHasChange);
            console.log('effectValues', effectValues, form.getFieldsValue(true));
        } */
        if (valueHasChange) {
            onRelationValueChange(effectValues);
        }
        setOldFormValues({
            ...form.getFieldsValue(true),
            ...otherFormData,
            ...effectValues,
        });
    };
    useUpdateEffect(() => {
        if (!triggerRelation) {
            return;
        }
        const effectValues = initRelationValue(
            form.getFieldsValue(true),
            {},
            getValueChangeKeys(oldFormValues, {
                ...form.getFieldsValue(true),
                ...otherFormData,
            }),
        );
        onChange(effectValues);
    }, [form.getFieldsValue(true), otherFormData]);
    useMount(() => {
        const pendingFormValues = form.getFieldsValue(true);
        const match = getMatchController(relationInfo, pendingFormValues, otherFormData);
        const relation: Record<string, FormRelationDetailType> = match.reduce((prev, cur) => {
            return mergeRelation(prev, cur.relation);
        }, {});
        const effectValues = getValuesFromRelation(relation, pendingFormValues);
        const newFormValues = {
            ...pendingFormValues,
            ...effectValues,
        };
        onChange(newFormValues);
    });
    return (
        <Form<Values> colon={false} form={form} {...props}>
            <FormInstanceContext.Provider value={form}>
                <RelationInfoContext.Provider value={relationInfo}>
                    <OtherFormDataContext.Provider value={otherFormData}>
                        <TriggerRelationContext.Provider value={triggerRelation}>
                            {children}
                        </TriggerRelationContext.Provider>
                    </OtherFormDataContext.Provider>
                </RelationInfoContext.Provider>
            </FormInstanceContext.Provider>
        </Form>
    );
}

export * from 'antd'
FormR.Item = ItemR;
FormR.useForm = useForm;
FormR.List = List;
FormR.ErrorList = ErrorList;
FormR.Provider = Provider;
export {
    ItemR as Item,
    useForm,
    List,
    ErrorList,
    Provider,
    Checkbox,
    Radio,
    Select,
    FormR as Form
};
export default FormR;
