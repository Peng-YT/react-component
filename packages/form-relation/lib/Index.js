import { Radio, Select, Form, Checkbox } from 'antd';
export * from 'antd';
import React, { useContext, useMemo, createContext, useRef, useState, useEffect } from 'react';
import { useDebounce, useMount } from 'react-use';

/*
 * @Author: @ppeng
 * @Date: 2021-08-18 18:34:55
 * @LastEditTime: 2021-11-26 16:09:51
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */
const { Button, Group: Group$1 } = Radio;
function RadioR({ children, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? ('') : (React.createElement(Radio, { ...props, disabled: optionIsDisabled }, children));
}
const GroupR$1 = ({ children, ...props }) => {
    const { isDisabled } = useRelation(props);
    return (React.createElement(Group$1, { ...props, disabled: isDisabled }, children));
};
function ButtonR({ children, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? ('') : (React.createElement(Button, { ...props, disabled: optionIsDisabled }, children));
}
RadioR.Button = ButtonR;
RadioR.Group = GroupR$1;

/*
 * @Author: @ppeng
 * @Date: 2021-08-18 17:55:28
 * @LastEditTime: 2022-03-10 14:38:07
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */
const { OptGroup, SECRET_COMBOBOX_MODE_DO_NOT_USE } = Select;
function SelectR({ children, ...props }) {
    const name = useContext(NameContext$1);
    const relationInfo = useContext(RelationInfoContext$1);
    const form = useContext(FormInstanceContext$1);
    const otherFormData = useContext(OtherFormDataContext$1);
    const triggerRelation = useContext(TriggerRelationContext$1);
    const matchController = useMemo(() => getMatchController$1(relationInfo, form?.getFieldsValue(true) || {}, otherFormData), [relationInfo, form?.getFieldsValue(true), otherFormData]);
    const relationDetail = useMemo(() => matchController.reduce((prev, cur) => {
        return mergeRelation$1(prev, cur.relation);
    }, {})[name], [matchController, name]);
    return (React.createElement(Select, { ...props, disabled: triggerRelation ? isDisabled$1(props, relationDetail) : undefined }, children
        ?.filter?.((item) => {
        if (!item) {
            return false;
        }
        const isHide = triggerRelation
            ? optionIsHide$1(item.props || {}, relationDetail)
            : false;
        return !isHide;
    })
        ?.map?.((item) => ({
        ...item,
        props: {
            ...(item.props || {}),
            disabled: triggerRelation
                ? optionIsDisabled$1(item.props || {}, relationDetail)
                : undefined,
        },
    }))));
}
const Option = ({ children, ...props }) => {
    const relation = useRelation(props);
    return relation.optionIsHide ? null : (React.createElement(Select.Option, { ...props, disabled: relation.optionIsDisabled }, children));
};
Option.isSelectOption = true;
SelectR.Option = Select.Option;
SelectR.OptGroup = OptGroup;
SelectR.SECRET_COMBOBOX_MODE_DO_NOT_USE = SECRET_COMBOBOX_MODE_DO_NOT_USE;

/* eslint-disable react-hooks/exhaustive-deps */
const { useForm: useForm$1, List: List$1, ErrorList: ErrorList$1, Provider: Provider$1 } = Form;
const RelationInfoContext$1 = createContext([]);
const FormInstanceContext$1 = createContext(null);
const OtherFormDataContext$1 = createContext(null);
const TriggerRelationContext$1 = createContext(true);
const NameContext$1 = createContext('');
const cmpValues$1 = (userInput, controllerValue) => {
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
const hasProp$1 = (obj, key) => {
    return Object.keys(obj).includes(key);
};
const getMatchController$1 = (relationInfoList, formData, otherFormData) => {
    return relationInfoList
        .filter((item) => {
        const rule = item.matchRule || 'AND';
        const matchFn = rule === 'AND' ? item.controller.every : item.controller.some;
        return matchFn.call(item.controller, (ctr) => {
            if (otherFormData) {
                const userInput = formData[ctr.key] || otherFormData[ctr.key];
                return cmpValues$1(userInput, ctr.value);
            }
            const userInput = formData[ctr.key];
            return cmpValues$1(userInput, ctr.value);
        });
    })
        .sort((a, b) => (a.weight || 0) - (b.weight || 0));
};
const optionIsDisabled$1 = (props, relationDetail, optionsValueProp) => {
    const optionValue = optionsValueProp ? props[optionsValueProp] : props.value;
    if (relationDetail && relationDetail.disableOptions) {
        return relationDetail.disableOptions.includes(optionValue);
    }
    return props.disabled;
};
const optionIsHide$1 = (props, relationDetail, optionsValueProp) => {
    const optionValue = optionsValueProp ? props[optionsValueProp] : props.value;
    if (relationDetail && relationDetail.hideOptions) {
        return relationDetail.hideOptions.includes(optionValue);
    }
    return false;
};
const isDisabled$1 = (props, relationDetail) => {
    if (relationDetail && relationDetail.disabled !== undefined) {
        return relationDetail.disabled;
    }
    return props.disabled;
};
const mergeRelation$1 = (prevRelation, nextRelation) => {
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
function ItemR$1({ children, ...props }) {
    const relationInfo = useContext(RelationInfoContext$1);
    const form = useContext(FormInstanceContext$1);
    const name = (props.name || '');
    const otherFormData = useContext(OtherFormDataContext$1);
    const matchController = getMatchController$1(relationInfo, form?.getFieldsValue(true) || {}, otherFormData);
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
    return (React.createElement(NameContext$1.Provider, { value: name }, FormItemIsShow ? (React.createElement(Form.Item, { ...props, style: {
            ...(props.style || {}),
            display: FormItemIsShow ? props?.style?.display : 'none',
        }, rules: FormItemIsShow ? props.rules : undefined }, children)) : null));
}
function FormR$1({ onRelationValueChange, relationInfo, children, triggerRelation = true, triggerResetValue = true, otherFormData, formData, ...props }) {
    const [form] = useForm$1(props.form);
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
                hasProp$1(detail, 'resetValue') &&
                !hasProp$1(detail, 'value')) {
                newValue = getHandleValue(detail.resetValue, [...(detail.disableOptions || []), ...(detail.hideOptions || [])], detail.valueExcludeDisableOption);
            }
            else if (detail && hasProp$1(detail, 'value')) {
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
        const match = getMatchController$1(relationInfo, pendingFormValues);
        const relation = match.reduce((prev, cur) => {
            const isTrigger = cur.controller.find((item) => triggerChangeKeys.includes(item.key));
            const curRelation = {
                ...cur.relation,
            };
            if (isTrigger && needTriggerRest) {
                // eslint-disable-next-line no-restricted-syntax, guard-for-in
                for (const key in curRelation) {
                    const detail = curRelation[key];
                    if (detail && hasProp$1(detail, 'resetValue') && !hasProp$1(detail, 'value')) {
                        curRelation[key] = {
                            ...detail,
                            value: detail.resetValue,
                        };
                    }
                }
            }
            return mergeRelation$1(prev, curRelation);
        }, {});
        const effectValues = getValuesFromRelation(relation, pendingFormValues);
        const newFormValues = {
            ...pendingFormValues,
            ...effectValues,
        };
        const nextMatch = getMatchController$1(relationInfo, newFormValues);
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
            return !cmpValues$1(effectValues[key], data[key]);
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
        React.createElement(FormInstanceContext$1.Provider, { value: form },
            React.createElement(RelationInfoContext$1.Provider, { value: relationInfo },
                React.createElement(OtherFormDataContext$1.Provider, { value: otherFormData },
                    React.createElement(TriggerRelationContext$1.Provider, { value: triggerRelation }, children))))));
}
FormR$1.Item = ItemR$1;
FormR$1.useForm = useForm$1;
FormR$1.List = List$1;
FormR$1.ErrorList = ErrorList$1;
FormR$1.Provider = Provider$1;

/*
 * @Author: your name
 * @Date: 2021-11-26 15:56:44
 * @LastEditTime: 2021-11-26 16:03:33
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */
const useRelation = (props) => {
    const name = useContext(NameContext$1);
    const relationInfo = useContext(RelationInfoContext$1);
    const form = useContext(FormInstanceContext$1);
    const otherFormData = useContext(OtherFormDataContext$1);
    const triggerRelation = useContext(TriggerRelationContext$1);
    const matchController = useMemo(() => getMatchController$1(relationInfo, form?.getFieldsValue(true) || {}, otherFormData), [relationInfo, form?.getFieldsValue(true), otherFormData]);
    const relationDetail = useMemo(() => matchController.reduce((prev, cur) => {
        return mergeRelation$1(prev, cur.relation);
    }, {})[name], [matchController, name]);
    return {
        optionIsDisabled: triggerRelation ? optionIsDisabled$1(props, relationDetail) : undefined,
        optionIsHide: triggerRelation ? optionIsHide$1(props, relationDetail) : undefined,
        isDisabled: triggerRelation ? isDisabled$1(props, relationDetail) : undefined,
    };
};

/*
 * @Author: @ppeng
 * @Date: 2021-08-19 10:34:17
 * @LastEditTime: 2021-11-26 16:06:48
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */
const { Group } = Checkbox;
function CheckboxR({ children, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (React.createElement(Checkbox, { ...props, disabled: optionIsDisabled }, children));
}
const GroupR = ({ children, ...props }) => {
    const { isDisabled } = useRelation(props);
    return (React.createElement(Group, { ...props, disabled: isDisabled }, children));
};
CheckboxR.Group = GroupR;

/* eslint-disable react-hooks/exhaustive-deps */
const { useForm, List, ErrorList, Provider } = Form;
const RelationInfoContext = createContext([]);
const FormInstanceContext = createContext(null);
const OtherFormDataContext = createContext(null);
const TriggerRelationContext = createContext(true);
const NameContext = createContext('');
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
const getMatchController = (relationInfoList, formData, otherFormData) => {
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
const optionIsDisabled = (props, relationDetail, optionsValueProp) => {
    const optionValue = optionsValueProp ? props[optionsValueProp] : props.value;
    if (relationDetail && relationDetail.disableOptions) {
        return relationDetail.disableOptions.includes(optionValue);
    }
    return props.disabled;
};
const optionIsHide = (props, relationDetail, optionsValueProp) => {
    const optionValue = optionsValueProp ? props[optionsValueProp] : props.value;
    if (relationDetail && relationDetail.hideOptions) {
        return relationDetail.hideOptions.includes(optionValue);
    }
    return false;
};
const isDisabled = (props, relationDetail) => {
    if (relationDetail && relationDetail.disabled !== undefined) {
        return relationDetail.disabled;
    }
    return props.disabled;
};
const mergeRelation = (prevRelation, nextRelation) => {
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
FormR.Item = ItemR;
FormR.useForm = useForm;
FormR.List = List;
FormR.ErrorList = ErrorList;
FormR.Provider = Provider;

export { CheckboxR as Checkbox, ErrorList, FormR as Form, FormInstanceContext, ItemR as Item, List, NameContext, OtherFormDataContext, Provider, RadioR as Radio, RelationInfoContext, SelectR as Select, TriggerRelationContext, FormR as default, getMatchController, isDisabled, mergeRelation, optionIsDisabled, optionIsHide, useForm };
