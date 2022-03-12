/* eslint-disable react-hooks/exhaustive-deps */
/*
 * @Author: 彭越腾
 * @Date: 2021-08-16 17:33:33
 * @LastEditTime: 2021-12-29 15:17:33
 * @LastEditors: OBKoro1
 * @Description: 能控制各个字段之间联动的表单
 */
import { Form } from 'antd';
import React, { useContext, createContext } from 'react';
import Checkbox from './Checkbox';
import Radio from './Radio';
import Select from './Select';
import { useMount, useUpdateEffect } from 'react-use';
const { useForm, List, ErrorList, Provider } = Form;
export const RelationInfoContext = createContext([]);
export const FormInstanceContext = createContext(null);
export const OtherFormDataContext = createContext(null);
export const TriggerRelationContext = createContext(true);
export const NameContext = createContext('');
const cmpValues = (userInput, controllerValue) => {
    if (typeof controllerValue === 'function') {
        return controllerValue(userInput);
    }
    if (Array.isArray(userInput) && Array.isArray(controllerValue)) {
        return (userInput.length === controllerValue.length &&
            userInput.every((input) => controllerValue.includes(input)));
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
/** 获取表单字段联动关系信息 */
export const getMatchController = (relationInfoList, formData, otherFormData) => {
    return relationInfoList
        .filter((item) => {
        const rule = item.matchRule || 'AND';
        const matchFn = rule === 'AND' ? item.controller.every : item.controller.some;
        return matchFn.call(item.controller, (ctr) => {
            if (otherFormData) {
                const userInput = formData[ctr.key] || otherFormData[ctr.key];
                return cmpValues(userInput, ctr.value);
            }
            const userInput = formData[ctr.key];
            return cmpValues(userInput, ctr.value);
        });
    })
        .sort((a, b) => (a.weight || 0) - (b.weight || 0));
};
/**
 * 某个选项是否被禁用
 * @param props
 * @param relationDetail
 */
export const optionIsDisabled = (props, relationDetail, optionsValueProp) => {
    const optionValue = optionsValueProp ? props[optionsValueProp] : props.value;
    if (relationDetail && relationDetail.disableOptions) {
        return relationDetail.disableOptions.includes(optionValue);
    }
    return props.disabled;
};
/**
 * 某个选项是否被隐藏
 * @param props
 * @param relationDetail
 */
export const optionIsHide = (props, relationDetail, optionsValueProp) => {
    const optionValue = optionsValueProp ? props[optionsValueProp] : props.value;
    if (relationDetail && relationDetail.hideOptions) {
        return relationDetail.hideOptions.includes(optionValue);
    }
    return false;
};
/** 表单是否被禁用 */
export const isDisabled = (props, relationDetail) => {
    if (relationDetail && relationDetail.disabled !== undefined) {
        return relationDetail.disabled;
    }
    return props.disabled;
};
/** 表单联动是否发生改变 */
/* const controllerValueIsChange = (
    relationInfo: FormRelationType,
    newFormValues: Record<string, any>,
    oldFormValues: Record<string, any>,
) => {
    return relationInfo.controller.some((item) => {
        const userInput = newFormValues[item.key as string];
        return !cmpValues(userInput, oldFormValues[item.key as string]);
    });
}; */
export const mergeRelation = (prevRelation, nextRelation) => {
    const newRelation = {};
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
        }
        else {
            newRelation[key] = nextRelation[key];
        }
    });
    return newRelation;
};
function ItemR({ children, ...props }) {
    const relationInfo = useContext(RelationInfoContext);
    const form = useContext(FormInstanceContext);
    const name = (props.name || '');
    const otherFormData = useContext(OtherFormDataContext);
    const matchController = getMatchController(relationInfo, form?.getFieldsValue(true) || {}, otherFormData);
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
    return (React.createElement(NameContext.Provider, { value: name }, FormItemIsShow ? (React.createElement(Form.Item, { ...props, style: {
            ...(props.style || {}),
            display: FormItemIsShow ? '' : 'none',
        }, rules: FormItemIsShow ? props.rules : undefined }, children)) : null));
}
function FormR({ onRelationValueChange, relationInfo, children, otherFormData, triggerRelation = true, ...props }) {
    const [form] = useForm(props.form);
    const getHandleValue = (curValue, disableOptions, excludeDisableOption = true) => {
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
    const hasProp = (obj, key) => {
        return Object.keys(obj).includes(key);
    };
    const getValuesFromRelation = (relation, pendingFormValues) => {
        return Object.entries(relation).reduce((prev, cur) => {
            const [key, detail] = cur;
            const curValue = pendingFormValues[key];
            let newValue;
            const curValueUnable = curValue === undefined ||
                (detail && detail.disableOptions?.includes(curValue)) ||
                (detail && detail.hideOptions?.includes(curValue)) ||
                curValue.some?.((item) => detail && detail.disableOptions?.includes(item)) ||
                curValue.some?.((item) => detail && detail.hideOptions?.includes(item));
            if (curValueUnable &&
                detail &&
                hasProp(detail, 'resetValue') &&
                !hasProp(detail, 'value')) {
                newValue = getHandleValue(detail.resetValue, [...(detail.disableOptions || []), ...(detail.hideOptions || [])], detail.valueExcludeDisableOption);
            }
            else if (detail && hasProp(detail, 'value')) {
                if (typeof detail.value === 'function') {
                    newValue = getHandleValue(detail.value(curValue), [...(detail.disableOptions || []), ...(detail.hideOptions || [])], detail.valueExcludeDisableOption);
                }
                else {
                    newValue = getHandleValue(detail.value, [...(detail.disableOptions || []), ...(detail.hideOptions || [])], detail.valueExcludeDisableOption);
                }
            }
            else if (detail === false) {
                newValue = undefined;
            }
            else {
                newValue = curValue;
            }
            return {
                ...prev,
                [key]: newValue,
            };
        }, {});
    };
    const cmpMatch = (match1, match2) => {
        if (match1.length !== match2.length) {
            return false;
        }
        return match1.every((item) => {
            return match2.indexOf(item) > -1;
        });
    };
    const initRelationValue = (pendingFormValues, prevEffectValues) => {
        const match = getMatchController(relationInfo, pendingFormValues, otherFormData);
        const relation = match.reduce((prev, cur) => {
            return mergeRelation(prev, cur.relation);
        }, {});
        const effectValues = getValuesFromRelation(relation, pendingFormValues);
        const newFormValues = {
            ...pendingFormValues,
            ...effectValues,
        };
        const nextMatch = getMatchController(relationInfo, newFormValues, otherFormData);
        const equalMatch = cmpMatch(match, nextMatch);
        let res = { ...prevEffectValues, ...effectValues };
        /* if (props.className?.includes('ad-app-website-form')) {
            console.log('initRelationValue', match)
            console.log('pendingFormValues', pendingFormValues)
            console.log('effectValues', effectValues)
        } */
        if (!equalMatch) {
            res = initRelationValue(newFormValues, res);
        }
        return res;
    };
    const onChange = (newFormValues) => {
        const valueHasChange = Object.keys(newFormValues).some((key) => {
            return !cmpValues(newFormValues[key], form.getFieldsValue(true)[key]);
        });
        if (valueHasChange) {
            onRelationValueChange(newFormValues);
        }
    };
    useUpdateEffect(() => {
        if (!triggerRelation) {
            return;
        }
        const newFormValues = initRelationValue(form.getFieldsValue(true), {});
        /* if (props.className?.includes('ad-budget-schedule-form')) {
            console.log('pendingFormValues', form.getFieldsValue(true))
            console.log('newFormValues', newFormValues)
            console.log('hasChange', Object.keys(newFormValues).some((key) => {
                return !cmpValues(newFormValues[key], form.getFieldsValue(true)[key]);
            }))
        } */
        onChange(newFormValues);
    }, [form.getFieldsValue(true), otherFormData]);
    useMount(() => {
        const pendingFormValues = form.getFieldsValue(true);
        const match = getMatchController(relationInfo, pendingFormValues, otherFormData);
        const relation = match.reduce((prev, cur) => {
            return mergeRelation(prev, cur.relation);
        }, {});
        const effectValues = getValuesFromRelation(relation, pendingFormValues);
        const newFormValues = {
            ...pendingFormValues,
            ...effectValues,
        };
        /* if (props.className?.includes('ad-budget-schedule-form')) {
            console.log('initRelationValue', match)
            console.log('pendingFormValues', pendingFormValues)
            console.log('newFormValues', newFormValues)
        } */
        onChange(newFormValues);
    });
    return (React.createElement(Form, { colon: false, form: form, ...props },
        React.createElement(FormInstanceContext.Provider, { value: form },
            React.createElement(RelationInfoContext.Provider, { value: relationInfo },
                React.createElement(OtherFormDataContext.Provider, { value: otherFormData },
                    React.createElement(TriggerRelationContext.Provider, { value: triggerRelation }, children))))));
}
export * from 'antd';
FormR.Item = ItemR;
FormR.useForm = useForm;
FormR.List = List;
FormR.ErrorList = ErrorList;
FormR.Provider = Provider;
export { ItemR as Item, useForm, List, ErrorList, Provider, Checkbox, Radio, Select, FormR as Form };
export default FormR;
