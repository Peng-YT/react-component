/* eslint-disable react-hooks/exhaustive-deps */
/*
 * @Author: @ppeng
 * @Date: 2021-08-16 17:33:33
 * @LastEditTime: 2021-12-29 15:17:33
 * @LastEditors: OBKoro1
 * @Description: 能控制各个字段之间联动的表单
 */
/* eslint-disable react-hooks/exhaustive-deps */
import { Form } from 'antd';
import React, { useContext, createContext, useState } from 'react';
import Checkbox from './Checkbox';
import Radio from './Radio';
import Select from './Select';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useDebounce, useMount } from 'react-use';
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
const hasProp = (obj, key) => {
    return Object.keys(obj).includes(key);
};
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
export const optionIsDisabled = (props, relationDetail, optionsValueProp) => {
    const optionValue = optionsValueProp ? props[optionsValueProp] : props.value;
    if (relationDetail && relationDetail.disableOptions) {
        return relationDetail.disableOptions.includes(optionValue);
    }
    return props.disabled;
};
export const optionIsHide = (props, relationDetail, optionsValueProp) => {
    const optionValue = optionsValueProp ? props[optionsValueProp] : props.value;
    if (relationDetail && relationDetail.hideOptions) {
        return relationDetail.hideOptions.includes(optionValue);
    }
    return false;
};
export const isDisabled = (props, relationDetail) => {
    if (relationDetail && relationDetail.disabled !== undefined) {
        return relationDetail.disabled;
    }
    return props.disabled;
};
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
            display: FormItemIsShow ? props?.style?.display : 'none',
        }, rules: FormItemIsShow ? props.rules : undefined }, children)) : null));
}
function FormR({ onRelationValueChange, relationInfo, children, triggerRelation = true, triggerResetValue = true, otherFormData, formData, ...props }) {
    const [form] = useForm(props.form);
    const originFormData = formData || form.getFieldsValue(true);
    const formDataRef = useRef({
        data: {
            ...originFormData,
            ...(otherFormData || {}),
        },
        triggerKeys: [],
    });
    const [, triggerUpdate] = useState(`${+new Date()}`);
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
    const getValuesFromRelation = (relation, pendingFormValues) => {
        return Object.entries(relation).reduce((prev, cur) => {
            const [key, detail] = cur;
            const curValue = pendingFormValues[key];
            let newValue;
            const curValueUnable = curValue === undefined ||
                (detail && detail.disableOptions?.includes(curValue)) ||
                (detail && detail.hideOptions?.includes(curValue)) ||
                curValue?.some?.((item) => detail && detail.disableOptions?.includes(item)) ||
                curValue?.some?.((item) => detail && detail.hideOptions?.includes(item));
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
    /** 获取 值发生了变化的key */
    const getValueChangeKeys = (prevValues, curValues) => {
        const allKeys = [...new Set(Object.keys(prevValues).concat(Object.keys(curValues)))];
        const valueChangeKeys = [];
        allKeys.forEach((key) => {
            if (prevValues[key] !== curValues[key]) {
                valueChangeKeys.push(key);
            }
        });
        return valueChangeKeys;
    };
    /**
     * 获取发生联动之后表单的最终值
     * @param pendingFormValues 即将要渲染的表单的值
     * @param prevEffectValues 上一次联动关系计算后得到的 受到了影响的表单的值
     * @param triggerChangeKeys 触发了此次更新的表单key
     * @returns 最总需要渲染的表单值
     */
    const initRelationValue = (pendingFormValues, prevEffectValues, triggerChangeKeys, needTriggerRest = true) => {
        const match = getMatchController(relationInfo, pendingFormValues);
        const relation = match.reduce((prev, cur) => {
            const isTrigger = cur.controller.find((item) => triggerChangeKeys.includes(item.key));
            const curRelation = {
                ...cur.relation,
            };
            if (isTrigger && needTriggerRest) {
                // eslint-disable-next-line no-restricted-syntax, guard-for-in
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
        const nextMatch = getMatchController(relationInfo, newFormValues);
        const equalMatch = cmpMatch(match, nextMatch);
        let res = { ...prevEffectValues, ...effectValues };
        if (!equalMatch) {
            res = initRelationValue(newFormValues, res, getValueChangeKeys(pendingFormValues, newFormValues), needTriggerRest);
        }
        return res;
    };
    const onChange = (effectValues) => {
        const { data } = formDataRef.current;
        const valueHasChange = Object.keys(effectValues).some((key) => {
            return !cmpValues(effectValues[key], data[key]);
        });
        if (valueHasChange) {
            onRelationValueChange(effectValues, true);
        }
        formDataRef.current.data = {
            ...formDataRef.current.data,
            ...effectValues,
        };
    };
    const run = (triggerKeys) => {
        const { data } = formDataRef.current;
        /* if (props.className?.includes('ad-position-form')) {
            console.log(`triggerChangeKeys run`, triggerKeys);
        } */
        const effectValues = initRelationValue(data, {}, triggerKeys, triggerResetValue);
        onChange(effectValues);
    };
    useEffect(() => {
        const oldFormData = formDataRef.current.data;
        formDataRef.current.data = {
            ...originFormData,
            ...(otherFormData || {}),
        };
        const triggerKeys = getValueChangeKeys(oldFormData, formDataRef.current.data);
        formDataRef.current.triggerKeys = triggerKeys;
        /*  if (props.className?.includes('ad-position-form')) {
            console.log(`triggerChangeKeys`, triggerKeys, oldFormData, formDataRef.current.data);
        } */
    }, [originFormData, otherFormData]);
    useDebounce(() => {
        /* formDataRef.current.data = {
            ...originFormData,
            ...(props?.otherFormData || {}),
        }; */
        if (!triggerRelation) {
            return;
        }
        run(formDataRef.current.triggerKeys);
    }, 100, [originFormData, otherFormData]);
    useMount(() => {
        /* const pendingFormValues = originFormData;
        const match = getMatchController(relationInfo, pendingFormValues, props.otherFormData);
        const relation: Record<string, FormRelationDetailType> = match.reduce((prev, cur) => {
            return mergeRelation(prev, cur.relation);
        }, {});
        const effectValues = getValuesFromRelation(relation, pendingFormValues);
        const newFormValues = {
            ...pendingFormValues,
            ...effectValues,
        };
        onChange(newFormValues); */
        if (!triggerRelation) {
            return;
        }
        run([]);
    });
    return (React.createElement(Form, { colon: false, ...props, form: form, 
        // eslint-disable-next-line consistent-return
        onValuesChange: (...arg) => {
            triggerUpdate(`${+new Date()}`);
            if (props.onValuesChange) {
                return props.onValuesChange(...arg);
            }
        } },
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
