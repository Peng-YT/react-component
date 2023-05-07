import { Checkbox, Radio, Select, Switch, Form } from 'antd';
export * from 'antd';
import React, { useContext, useMemo, createContext, useRef, useState, useEffect } from 'react';
import { useDebounce, useMount } from 'react-use';

/*
 * @Author: your name
 * @Date: 2021-11-26 15:56:44
 * @LastEditTime: 2021-11-26 16:03:33
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */
const useRelation = (props) => {
    const name = useContext(NameContext);
    const relationInfo = useContext(RelationInfoContext);
    const form = useContext(FormInstanceContext);
    const otherFormData = useContext(OtherFormDataContext);
    const triggerRelation = useContext(TriggerRelationContext);
    const matchController = useMemo(() => getMatchRelationResByFormData(relationInfo, form?.getFieldsValue(true) || {}, otherFormData), [relationInfo, form?.getFieldsValue(true), otherFormData]);
    const relationDetail = useMemo(() => matchController.reduce((prev, cur) => {
        return mergeRelation(prev, cur.relation);
    }, {})[name], [matchController, name]);
    return {
        optionIsDisabled: triggerRelation ? optionIsDisabled(props, relationDetail) : props.disabled,
        optionIsHide: triggerRelation ? optionIsHide(props, relationDetail) : undefined,
        isDisabled: triggerRelation ? isDisabled(props, relationDetail) : props.disabled,
    };
};

/*
 * @Author: @ppeng
 * @Date: 2021-08-19 10:34:17
 * @LastEditTime: 2021-11-26 16:06:48
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */
const { Group: Group$1 } = Checkbox;
function CheckboxComponent({ children, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (React.createElement(Checkbox, { ...props, disabled: optionIsDisabled }, children));
}
const CheckboxR = Object.assign(CheckboxComponent, Checkbox);
const GroupComponent$1 = ({ children, ...props }) => {
    const { isDisabled } = useRelation(props);
    return (React.createElement(Group$1, { ...props, disabled: isDisabled }, children));
};
const GroupR$1 = Object.assign(GroupComponent$1, Group$1);
CheckboxR.Group = GroupR$1;

/*
 * @Author: @ppeng
 * @Date: 2021-08-18 18:34:55
 * @LastEditTime: 2021-11-26 16:09:51
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */
const { Button, Group } = Radio;
function RadioComponent({ children, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? ('') : (React.createElement(Radio, { ...props, disabled: optionIsDisabled }, children));
}
const RadioR = Object.assign(RadioComponent, Radio);
const GroupComponent = ({ children, ...props }) => {
    const { isDisabled } = useRelation(props);
    return (React.createElement(Group, { ...props, disabled: isDisabled }, children));
};
const GroupR = Object.assign(GroupComponent, Group);
function ButtonComponent({ children, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? ('') : (React.createElement(Button, { ...props, disabled: optionIsDisabled }, children));
}
const ButtonR = Object.assign(ButtonComponent, Button);
RadioR.Button = ButtonR;
RadioR.Group = GroupR;

/*
 * @Author: @ppeng
 * @Date: 2021-08-18 17:55:28
 * @LastEditTime: 2022-03-10 14:38:07
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */
function SelectComponent({ children, ...props }) {
    const name = useContext(NameContext);
    const relationInfo = useContext(RelationInfoContext);
    const form = useContext(FormInstanceContext);
    const otherFormData = useContext(OtherFormDataContext);
    const triggerRelation = useContext(TriggerRelationContext);
    const matchController = useMemo(() => getMatchRelationResByFormData(relationInfo, form?.getFieldsValue(true) || {}, otherFormData), [relationInfo, form?.getFieldsValue(true), otherFormData]);
    const relationDetail = useMemo(() => matchController.reduce((prev, cur) => {
        return mergeRelation(prev, cur.relation);
    }, {})[name], [matchController, name]);
    return (React.createElement(Select, { ...props, disabled: triggerRelation ? isDisabled(props, relationDetail) : props.disabled }, children
        ?.filter?.((item) => {
        if (!item) {
            return false;
        }
        const isHide = triggerRelation
            ? optionIsHide(item.props || {}, relationDetail)
            : false;
        return !isHide;
    })
        ?.map?.((item) => ({
        ...item,
        props: {
            ...(item.props || {}),
            disabled: triggerRelation
                ? optionIsDisabled(item.props || {}, relationDetail)
                : undefined,
        },
    }))));
}
const SelectR = Object.assign(SelectComponent, Select);
const OptionComponent = ({ children, ...props }) => {
    const relation = useRelation(props);
    return relation.optionIsHide ? null : (React.createElement(Select.Option, { ...props, disabled: relation.optionIsDisabled }, children));
};
const Option = Object.assign(OptionComponent, Select.Option);
SelectR.Option = Option;

/*
 * @Author: @ppeng
 * @Date: 2021-08-19 10:34:17
 * @LastEditTime: 2021-11-26 16:06:48
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */
const SwitchComponent = (props) => {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (React.createElement(Switch, { ...props, disabled: optionIsDisabled }));
};
const SwitchR = Object.assign(SwitchComponent, Switch);

/* eslint-disable react-hooks/exhaustive-deps */
const { useForm } = Form;
const RelationInfoContext = createContext([]);
const FormInstanceContext = createContext(null);
const OtherFormDataContext = createContext(null);
const TriggerRelationContext = createContext(true);
const NameContext = createContext('');
const isSame = (value1, value2) => {
    if (Array.isArray(value1) && Array.isArray(value2)) {
        return (value1.length === value2.length &&
            value1.every((input) => value2.includes(input)));
    }
    if (Array.isArray(value2) && !Array.isArray(value1)) {
        return value2.includes(value1);
    }
    if (!Array.isArray(value2) && Array.isArray(value1)) {
        return value1.includes(value2);
    }
    /* if (typeof value1 === 'symbol' || typeof value2 === 'symbol') {
        return value1 === value2;
    } */
    if (Number.isNaN(value1) && Number.isNaN(value2)) {
        return true;
    }
    return value1 === value2;
};
// 判断表单值是否匹配到了某个联动关系的条件
const formValueIsMatchInCondition = (formValue, conditionVal) => {
    if (typeof conditionVal === 'function') {
        return conditionVal(formValue);
    }
    return isSame(formValue, conditionVal);
};
const hasProp = (obj, key) => {
    return Object.keys(obj).includes(key);
};
/**
 * 在表单联动的影响下 该字段是否可设置
 * @param field
 * @returns
 */
const getFieldIsOpen = (field) => {
    return field !== false;
};
/** 根据表单值，获取条件匹配的表单联动关系信息 */
function getMatchRelationResByFormData(relationInfoList, formData, otherFormData) {
    // 是否匹配到了这个条件
    const isMatchCondition = (conditions, matchRule = 'AND') => {
        if (conditions === 'default') {
            return true;
        }
        const matchFn = matchRule === 'AND' ? conditions.every : conditions.some;
        return matchFn.call(conditions, (condition) => {
            let formValue;
            if (otherFormData) {
                formValue = hasProp(formData, condition.key)
                    ? formData[condition.key]
                    : otherFormData[condition.key];
            }
            else {
                formValue = formData[condition.key];
            }
            const isMatch = formValueIsMatchInCondition(formValue, condition.value);
            if (isMatch && condition.conditions) {
                return isMatchCondition(condition.conditions, condition.matchRule);
            }
            return isMatch;
        });
    };
    return relationInfoList
        .filter((item) => {
        return isMatchCondition(item.conditions, item.matchRule);
    })
        .sort((a, b) => (a.weight || 0) - (b.weight || 0));
}
const optionIsDisabled = (props, relationDetail, optionsValueProp) => {
    if (props.disabled !== undefined) {
        return props.disabled;
    }
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
    if (props.disabled !== undefined) {
        return props.disabled;
    }
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
const cmpArray = (match1, match2) => {
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
 * @param relationInfo 联动关系
 * @param pendingFormValues 即将要渲染的表单的值
 * @param prevEffectValues 上一次联动关系计算后得到的 受到了影响的表单的值
 * @param triggerChangeKeys 触发了此次更新的表单key
 * @returns 联动计算之后最终的表单值
 */
function initRelationValue(relationInfo, pendingFormValues, prevEffectValues, triggerChangeKeys, needTriggerReset = true) {
    const match = getMatchRelationResByFormData(relationInfo, pendingFormValues);
    const relation = match.reduce((prev, cur) => {
        const isTrigger = cur.conditions === 'default' ||
            cur.conditions.find((item) => triggerChangeKeys.includes(item.key));
        const isDefault = cur.conditions === 'default';
        const curRelation = {
            ...cur.relation,
        };
        if (isTrigger && needTriggerReset) {
            // eslint-disable-next-line no-restricted-syntax, guard-for-in
            for (const prop in curRelation) {
                const curRelationDetail = curRelation[prop];
                const needResetWhenOnlyEmpty = curRelationDetail === false ||
                    (curRelationDetail?.needResetWhenOnlyEmpty ?? true);
                const curRelationResetValueIsValid = // 重置值是否可用
                 curRelationDetail &&
                    hasProp(curRelationDetail, 'resetValue') && // 拥有重置值
                    !hasProp(curRelationDetail, 'value'); // 没有固定值value
                const needResetValue = // 需要重置的条件
                 !needResetWhenOnlyEmpty || // 关闭了【值为空时进行重置】
                    (needResetWhenOnlyEmpty && !pendingFormValues[prop]) || // 值为空、并且开启了【值为空时进行重置】
                    (isDefault && !pendingFormValues[prop]); // 值为空、并且拥有默认值
                if (curRelationResetValueIsValid && needResetValue) {
                    curRelation[prop] = {
                        ...curRelationDetail,
                        value: curRelationDetail.resetValue,
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
    const nextMatch = getMatchRelationResByFormData(relationInfo, newFormValues);
    const equalMatch = cmpArray(match, nextMatch);
    let allEffectRes = { ...prevEffectValues, ...effectValues };
    if (!equalMatch) {
        allEffectRes = initRelationValue(relationInfo, newFormValues, allEffectRes, getValueChangeKeys(pendingFormValues, newFormValues), needTriggerReset);
    }
    return allEffectRes;
}
function ItemComponent({ children, ...props }) {
    const relationInfo = useContext(RelationInfoContext);
    const form = useContext(FormInstanceContext);
    const name = (props.name || '');
    const otherFormData = useContext(OtherFormDataContext);
    const matchController = getMatchRelationResByFormData(relationInfo, form?.getFieldsValue(true) || {}, otherFormData);
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
const ItemR = Object.assign(ItemComponent, Form.Item);
function FormComponent({ onRelationValueChange, relationInfo, children, triggerRelation = true, triggerResetValue = true, otherFormData, ...props }) {
    const [form] = useForm(props.form);
    const originFormData = form.getFieldsValue(true);
    const formDataRef = useRef({
        data: {
            ...originFormData,
            ...(otherFormData || {}),
        },
        triggerKeys: [],
    });
    const [, triggerUpdate] = useState(`${+new Date()}`);
    const onChange = (effectValues) => {
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
    const run = (triggerKeys) => {
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
            formDataRef.current.triggerKeys.concat(triggerKeys);
    }, [originFormData, otherFormData]);
    useDebounce(() => {
        if (!triggerRelation) {
            return;
        }
        run(formDataRef.current.triggerKeys);
        formDataRef.current.triggerKeys = [];
    }, 100, [originFormData, otherFormData]);
    useMount(() => {
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
                    React.createElement(TriggerRelationContext.Provider, { value: triggerRelation }, typeof children === 'function' ? children({
                        form,
                        relationInfo,
                        otherFormData,
                        triggerRelation
                    }, form) : children))))));
}
const FormR = Object.assign(FormComponent, Form);
FormR.Item = ItemR;

export { CheckboxR as Checkbox, FormR as Form, FormInstanceContext, ItemR as Item, NameContext, OtherFormDataContext, RadioR as Radio, RelationInfoContext, SelectR as Select, SwitchR as Switch, TriggerRelationContext, FormR as default, getFieldIsOpen, getMatchRelationResByFormData, initRelationValue, isDisabled, mergeRelation, optionIsDisabled, optionIsHide };
