import { Radio, Tooltip, Select, Typography, Switch, Form, Checkbox } from 'antd';
import { isEqual } from 'lodash';
import React, { useContext, useMemo, createContext, useState, useRef, useEffect } from 'react';
import { useUpdateEffect, useDebounce } from 'react-use';
import { InfoCircleOutlined } from '@ant-design/icons';

/*
 * @Author: 彭越腾
 * @Date: 2021-08-18 18:34:55
 * @LastEditTime: 2023-05-12 14:59:59
 * @LastEditors: 彭越腾
 * @Description: In User Settings Edit
 * @FilePath: \admin-market\src\components\Common\RelationForm\Radio.tsx
 */
const { Button, Group: Group$1 } = Radio;
function RadioComponent({ children, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (React.createElement(Radio, { ...props, disabled: optionIsDisabled }, children));
}
const RadioR = Object.assign(RadioComponent, Radio);
const GroupComponent$1 = ({ children, ...props }) => {
    const { isDisabled } = useRelation(props);
    return (React.createElement(Group$1, { ...props, disabled: isDisabled }, children));
};
const GroupR$1 = GroupComponent$1;
function ButtonComponent({ children, desc, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (React.createElement(Button, { ...props, disabled: optionIsDisabled },
        children,
        desc ? (React.createElement(Tooltip, { overlay: desc },
            "\u00A0",
            React.createElement(InfoCircleOutlined, null))) : null));
}
const ButtonR = Object.assign(ButtonComponent, Button);
RadioR.Button = ButtonR;
RadioR.Group = GroupR$1;

/*
 * @Author: 彭越腾
 * @Date: 2021-08-18 17:55:28
 * @LastEditTime: 2023-03-20 10:12:09
 * @LastEditors: 彭越腾
 * @Description: In User Settings Edit
 * @FilePath: \admin-market\src\components\Common\RelationForm\Select.tsx
 */
function SelectComponent({ children, ...props }) {
    const name = useContext(NameContext$1);
    const relationInfo = useContext(RelationInfoContext$1);
    const form = useContext(FormInstanceContext$1);
    const otherFormData = useContext(OtherFormDataContext$1);
    const triggerRelation = useContext(TriggerRelationContext$1);
    const matchController = useMemo(() => getMatchRelationResByFormData$1(relationInfo, form?.getFieldsValue(true) || {}, otherFormData), [relationInfo, form?.getFieldsValue(true), otherFormData]);
    const relationDetail = useMemo(() => matchController.reduce((prev, cur) => {
        return mergeRelation$1(prev, cur.relation);
    }, {})[name], [matchController, name]);
    return (React.createElement(Select, { ...props, disabled: triggerRelation
            ? isDisabled$1(props, relationDetail)
            : props.disabled }, children
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
const SelectR = Object.assign(SelectComponent, Select);
const OptionComponent = ({ children, desc, ...props }) => {
    const relation = useRelation(props);
    return relation.optionIsHide ? null : (React.createElement(Select.Option, { ...props, disabled: relation.optionIsDisabled }, desc ? (React.createElement("div", null,
        React.createElement("p", null, children),
        React.createElement(Typography.Text, { type: 'secondary' }, desc))) : (children)));
};
const Option = Object.assign(OptionComponent, Select.Option);
SelectR.Option = Option;

const SwitchComponent = (props) => {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (React.createElement(Switch, { ...props, disabled: optionIsDisabled }));
};
const SwitchR = Object.assign(SwitchComponent, Switch);

const { useForm: useForm$1 } = Form;
const RelationInfoContext$1 = createContext([]);
const FormInstanceContext$1 = createContext(null);
const OtherFormDataContext$1 = createContext(null);
const FormValidateInfoContext$1 = createContext(null);
const TriggerRelationContext$1 = createContext(true);
const NameContext$1 = createContext('');
const OtherPropsContext$1 = createContext({});
const hasProp$1 = (obj, key) => {
    return Object.keys(obj).includes(key);
};
const isMatch$1 = (value1, value2) => {
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
const formValueIsMatchInCondition$1 = (formValue, conditionVal) => {
    if (typeof conditionVal === 'function') {
        return conditionVal(formValue);
    }
    return isMatch$1(formValue, conditionVal);
};
// 是否匹配到了这个条件
const isMatchCondition$1 = (conditions, matchRule = 'AND', formData, otherFormData) => {
    if (conditions === 'default') {
        return true;
    }
    const matchFn = matchRule === 'AND' ? conditions.every : conditions.some;
    return matchFn.call(conditions, (condition) => {
        let formValue;
        if (otherFormData) {
            formValue = hasProp$1(formData, condition.key)
                ? formData[condition.key]
                : otherFormData[condition.key];
        }
        else {
            formValue = formData[condition.key];
        }
        const isMatch = formValueIsMatchInCondition$1(formValue, condition.value);
        if (isMatch && condition.conditions) {
            return isMatchCondition$1(condition.conditions, condition.matchRule, formData, otherFormData);
        }
        return isMatch;
    });
};
/** 根据表单值，获取条件匹配的表单联动关系信息 */
function getMatchRelationResByFormData$1(relationInfoList, formData, otherFormData) {
    return relationInfoList
        .filter((item) => {
        return isMatchCondition$1(item.conditions, item.matchRule, formData, otherFormData);
    })
        .sort((a, b) => (a.weight || 0) - (b.weight || 0));
}
/**
 *
 * @param relationInfo 表单联动配置
 * @param formValue 表单校验依赖的数据，需要传入哪些数据，根据传入的relationInfo的类型决定 如果relationInfo的ts类型为 FormRelationType(Dep)[]  那么formValue就需要传入Dep类型的数据
 * @param validateInfo 校验配置
 * @returns
 */
async function validateFromRelationInfo$1(relationInfo, props) {
    const errors = [];
    const condition = getCondition$1(relationInfo, // 传入联动配置
    props.formValue);
    const handler = async (validateInfo, value) => {
        const rulesOrigin = validateInfo?.rules;
        const rules = typeof rulesOrigin === 'function'
            ? rulesOrigin(props.formValue)
            : rulesOrigin;
        await Promise.allSettled(Object.entries(validateInfo?.deeps || {}).map(async ([prop, info]) => {
            await handler(info, value?.[prop]);
        }));
        await Promise.allSettled(rules?.map(async (rule) => {
            const empty = Array.isArray(value)
                ? !value.length
                : !value && value !== false;
            if (rule.validator) {
                try {
                    await rule.validator(rule, value, (err) => {
                        errors.push({
                            errorMsg: err,
                        });
                    });
                }
                catch (error) {
                    errors.push({
                        errorMsg: error.message,
                    });
                }
                return;
            }
            if ((value && rule.pattern && !rule.pattern.test(value)) ||
                (empty && rule.required)) {
                errors.push({
                    errorMsg: typeof rule.message === 'string'
                        ? rule.message
                        : '',
                });
                return;
            }
        }) || []);
    };
    await Promise.allSettled(Object.entries(props.validateInfo || {}).map(async ([prop, validateInfo]) => {
        const relationInfo = condition[prop];
        if (!getFieldIsOpen$1(relationInfo)) {
            return;
        }
        const value = props.formValue[prop];
        await handler(validateInfo, value);
    }));
    return errors;
}
/**
 * 某个选项是否被禁用
 * @param props
 * @param relationDetail
 */
const optionIsDisabled$1 = (props, relationDetail, optionsValueProp) => {
    const optionValue = optionsValueProp ? props[optionsValueProp] : props.value;
    if (relationDetail &&
        relationDetail.disableOptions?.includes(optionValue)) {
        return true;
    }
    return props.disabled;
};
/**
 * 某个选项是否被隐藏
 * @param props
 * @param relationDetail
 */
const optionIsHide$1 = (props, relationDetail, optionsValueProp) => {
    const optionValue = optionsValueProp ? props[optionsValueProp] : props.value;
    if (relationDetail && relationDetail.hideOptions) {
        return relationDetail.hideOptions.includes(optionValue);
    }
    return false;
};
/** 表单是否被禁用 */
const isDisabled$1 = (props, relationDetail) => {
    if (relationDetail && relationDetail.disabled) {
        return true;
    }
    return props.disabled;
};
function mergeRelation$1(prevRelation, nextRelation) {
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
                disableOptions = [
                    ...(prevDisableOptions || []),
                    ...(nextDisableOptions || []),
                ];
            }
            const prevHideOptions = prevRelationItemInfo.hideOptions;
            const nextHideOptions = nextRelationItemInfo.hideOptions;
            let hideOptions;
            if (prevHideOptions || nextHideOptions) {
                hideOptions = [
                    ...(prevHideOptions || []),
                    ...(nextHideOptions || []),
                ];
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
}
/**
 * 获取表单字段联动后的信息
 * @param relationInfoList 表单联动配置
 * @param formData 表单校验依赖的数据，需要传入哪些数据，根据传入的relationInfoList的类型决定 如果relationInfoList的ts类型为 FormRelationTypeFormRelationType(Dep)[]  那么formData就需要传入Dep类型的数据
 * @returns
 */
function getCondition$1(relationInfoList, formData) {
    return getMatchRelationResByFormData$1(relationInfoList, formData).reduce((prev, cur) => {
        return mergeRelation$1(prev, cur.relation);
    }, {});
}
/**
 * 在表单联动的影响下 该字段是否可设置
 * @param field
 * @returns
 */
const getFieldIsOpen$1 = (field) => {
    return field !== false;
};
const getHandleValue$1 = (curValue, disableOptions, excludeDisableOption = true) => {
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
const getValuesFromRelation$1 = (relation, pendingFormValues) => {
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
            newValue = getHandleValue$1(detail.resetValue, [
                ...(detail.disableOptions || []),
                ...(detail.hideOptions || []),
            ], detail.valueExcludeDisableOption);
        }
        else if (detail && hasProp$1(detail, 'value')) {
            if (typeof detail.value === 'function') {
                newValue = getHandleValue$1(detail.value(curValue), [
                    ...(detail.disableOptions || []),
                    ...(detail.hideOptions || []),
                ], detail.valueExcludeDisableOption);
            }
            else {
                newValue = getHandleValue$1(detail.value, [
                    ...(detail.disableOptions || []),
                    ...(detail.hideOptions || []),
                ], detail.valueExcludeDisableOption);
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
const cmpArray$1 = (match1, match2) => {
    if (match1.length !== match2.length) {
        return false;
    }
    return match1.every((item) => {
        return match2.indexOf(item) > -1;
    });
};
/** 获取 值发生了变化的key */
const getValueChangeKeys$1 = (prevValues, curValues) => {
    const allKeys = [
        ...new Set(Object.keys(prevValues).concat(Object.keys(curValues))),
    ];
    const valueChangeKeys = [];
    allKeys.forEach((key) => {
        if (prevValues[key] !== curValues[key]) {
            valueChangeKeys.push(key);
        }
    });
    return valueChangeKeys;
};
/**
 * 根据表单联动关系和现有的表单值，生成一些需要变化的值
 * @param relationInfo 联动关系
 * @param pendingFormValues 即将要渲染的表单的值
 * @param prevEffectValues 上一次联动关系计算后得到的 表单变化的值
 * @param triggerChangeKeys 触发了此次更新的表单key
 * @returns 表单变化的值
 */
function initRelationValue$1(relationInfo, pendingFormValues, prevEffectValues, triggerChangeKeys, needTriggerReset = true, props) {
    const match = getMatchRelationResByFormData$1(relationInfo, pendingFormValues);
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
                const valueIsEmpty = !hasProp$1(pendingFormValues, prop) ||
                    pendingFormValues[prop] === undefined;
                const curRelationDetail = curRelation[prop];
                const needResetWhenOnlyEmpty = // 仅值为空时才进行值的重置
                 curRelationDetail === false ||
                    (curRelationDetail?.needResetWhenOnlyEmpty ?? true);
                const hasResetValueFromRelation = // 通过表单联动判断 该属性是否有重置值
                 curRelationDetail &&
                    hasProp$1(curRelationDetail, 'resetValue');
                const resetValueIsValid = // 没有固定值value、并且没有传入noResetValuesProp 才能使用表单联动的重置值
                 (!curRelationDetail ||
                    !hasProp$1(curRelationDetail, 'value')) &&
                    (!props?.noResetValuesProp ||
                        !props?.noResetValuesProp.includes(prop));
                const needResetValueFromRelation = // 通过个联动条件判断是否需要做值得重置
                 !needResetWhenOnlyEmpty || // 不是【仅值为空时进行重置】（也就是无论是否值为空，只要条件触发了就重置）
                    (needResetWhenOnlyEmpty && valueIsEmpty) || // 值为空、并且是【仅值为空时进行重置】
                    (isDefault && valueIsEmpty); // 值为空、并且拥有默认值
                if (hasResetValueFromRelation &&
                    needResetValueFromRelation &&
                    resetValueIsValid) {
                    curRelation[prop] = {
                        ...curRelationDetail,
                        value: curRelationDetail.resetValue,
                    };
                }
            }
        }
        return mergeRelation$1(prev, curRelation);
    }, {});
    const effectValues = getValuesFromRelation$1(relation, pendingFormValues);
    const newFormValues = {
        ...pendingFormValues,
        ...effectValues,
    };
    const nextMatch = getMatchRelationResByFormData$1(relationInfo, newFormValues);
    const equalMatch = cmpArray$1(match, nextMatch);
    let allEffectRes = { ...prevEffectValues, ...effectValues };
    /* if (props.className?.includes('ad-position-form')) {
        console.log(`initRelationValue`, match);
        console.log(`pendingFormValues`, pendingFormValues);
        console.log(`effectValues`, effectValues);
        console.log(`getValueChangeKeys`, pendingFormValues, newFormValues);
        console.log(`triggerChangeKeys`, getValueChangeKeys(pendingFormValues, newFormValues));
        console.log(`equalMatch`, equalMatch);
        console.log(`res`, res);
    } */
    if (!equalMatch) {
        allEffectRes = initRelationValue$1(relationInfo, newFormValues, allEffectRes, getValueChangeKeys$1(pendingFormValues, newFormValues), needTriggerReset, props);
    }
    Object.keys(props?.recoverData || {}).forEach((recoverProp) => {
        const recoverValue = props?.recoverData?.[recoverProp];
        const curValue = pendingFormValues?.[recoverProp];
        /* 加入恢复值之后的表单数据 */
        const formValuesWithRecoverProp = {
            ...pendingFormValues,
            ...allEffectRes,
            [recoverProp]: recoverValue,
        };
        /* 加入恢复值之后的表单联动关系，用于下面计算effectValuesWithRecoverProp */
        const matchWithRecoverProp = getMatchRelationResByFormData$1(relationInfo, formValuesWithRecoverProp);
        /* 加入恢复值之后的表单联动关系的具体值，用于下面计算effectValuesWithRecoverProp */
        const relationWithRecoverProp = matchWithRecoverProp.reduce((prev, cur) => {
            const curRelation = {
                ...cur.relation,
            };
            return mergeRelation$1(prev, curRelation);
        }, {});
        const curPropRelation = relationWithRecoverProp[recoverProp];
        const recoverValueIsValid = curPropRelation === undefined ||
            (curPropRelation !== false &&
                !hasProp$1(curPropRelation, 'value') &&
                !curPropRelation.disableOptions?.includes(recoverProp) &&
                !curPropRelation?.hideOptions?.includes(recoverProp));
        /* 加入恢复值之后 最后联动出来的表单数据 */
        const effectValuesWithRecoverProp = getValuesFromRelation$1(relationWithRecoverProp, formValuesWithRecoverProp);
        const curValueIsEmpty = Array.isArray(curValue)
            ? !curValue.length
            : curValue === undefined || curValue === null;
        /** 加入恢复值之后生成的表单数据中 triggerChangeKeys的表单值没有发生变化，才可以进行恢复：
         * triggerChangeKeys代表触发了此次表单联动的某些表单属性，
         * 因为本来就是triggerChangeKeys对应的表单触发了此次联动，反过来去修改triggerChangeKeys的表单值，会陷入一个循环，导致页面修改的东西会失效
         */
        if (triggerChangeKeys.every((trigger) => {
            if (!hasProp$1(effectValuesWithRecoverProp, trigger)) {
                return true;
            }
            return (effectValuesWithRecoverProp[trigger] ===
                formValuesWithRecoverProp[trigger]);
        }) &&
            recoverValueIsValid && // 恢复值是否可用
            curValueIsEmpty && // 是否为空值，为空才需要恢复
            typeof recoverValue !== 'boolean' // 布尔值不用恢复，个人感觉更加符合用户习惯，准确说是更符合投放平台的习惯？
        ) {
            allEffectRes[recoverProp] = recoverValue;
        }
    });
    return allEffectRes;
}
function ItemComponent$1({ children, ...props }) {
    const relationInfo = useContext(RelationInfoContext$1);
    const form = useContext(FormInstanceContext$1);
    const validateFormInfo = useContext(FormValidateInfoContext$1);
    const name = (props.name || '');
    const otherFormData = useContext(OtherFormDataContext$1);
    const otherProps = useContext(OtherPropsContext$1);
    const matchController = getMatchRelationResByFormData$1(relationInfo, form?.getFieldsValue(true) || {}, otherFormData);
    const formItemIsShow = (() => {
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
    const rulesFromContext = validateFormInfo?.[name]?.rules;
    const rules = props?.rules ||
        (typeof rulesFromContext === 'function'
            ? rulesFromContext(form?.getFieldsValue(true) || {})
            : rulesFromContext);
    useUpdateEffect(() => {
        otherProps?.onVisibleChange?.(formItemIsShow, name);
    }, [formItemIsShow]);
    return (React.createElement(NameContext$1.Provider, { value: name }, formItemIsShow ? (React.createElement(Form.Item, { ...props, style: props.style, rules: formItemIsShow ? rules : undefined }, children)) : null));
}
const ItemR$1 = Object.assign(ItemComponent$1, Form.Item);
function FormComponent$1({ onRelationValueChange, relationInfo, children, triggerRelation = true, triggerResetValue = true, validateFormInfo, otherFormData, formData, ...props }) {
    const [form] = useForm$1(props.form);
    /* 存储值不为空的表单数据 */
    const [noEmptyFormData, setNoEmptyFormData] = useState({});
    /* 用于恢复表单上一次的非空数据 */
    const recoverData = useRef({
        data: {},
    });
    const originFormData = formData || form.getFieldsValue(true);
    const formDataRef = useRef({
        data: {
            ...(props.initialValues || {}),
            ...originFormData,
            ...(otherFormData || {}),
        },
        triggerKeys: [],
    });
    // const [, triggerUpdate] = useState(`${+new Date()}`)
    const onChange = (effectValues) => {
        const { data } = formDataRef.current;
        const valueHasChange = Object.keys(effectValues).some((key) => {
            return !isEqual(effectValues[key], data[key]);
        });
        if (valueHasChange) {
            onRelationValueChange(effectValues, true);
        }
        formDataRef.current.data = {
            ...formDataRef.current.data,
            ...effectValues,
        };
    };
    /**
     * 如果表单显示出来，则把数据恢复到上一次的非空数据
     * @param visible
     * @param name
     */
    const onFormItemVisibleChange = (visible, name) => {
        const prevValue = formDataRef.current.data?.[name];
        const prevIsEmpty = Array.isArray(prevValue)
            ? !prevValue.length
            : prevValue === undefined || prevValue === null;
        if (visible &&
            prevIsEmpty &&
            triggerRelation &&
            triggerResetValue &&
            hasProp$1(noEmptyFormData, name)) {
            recoverData.current.data[name] = noEmptyFormData[name];
        }
    };
    const run = (triggerKeys) => {
        const { data } = formDataRef.current;
        const effectValues = initRelationValue$1(relationInfo, data, {}, triggerKeys, triggerResetValue, {
            recoverData: recoverData.current.data,
        });
        recoverData.current.data = {};
        onChange(effectValues);
    };
    useEffect(() => {
        const oldFormData = formDataRef.current.data;
        formDataRef.current.data = {
            ...originFormData,
            ...(otherFormData || {}),
        };
        const triggerKeys = getValueChangeKeys$1(oldFormData, formDataRef.current.data);
        formDataRef.current.triggerKeys =
            formDataRef.current.triggerKeys.concat(triggerKeys);
        setNoEmptyFormData((prev) => {
            return {
                ...prev,
                ...Object.keys(originFormData).reduce((prevFormDataHandle, formDataProp) => {
                    const res = {
                        ...prevFormDataHandle,
                    };
                    const val = originFormData[formDataProp];
                    const noEmpty = Array.isArray(val)
                        ? !!val.length
                        : !!val;
                    if (noEmpty) {
                        res[formDataProp] = val;
                    }
                    return res;
                }, {}),
            };
        });
    }, [originFormData, otherFormData]);
    useDebounce(() => {
        if (!triggerRelation) {
            return;
        }
        run(formDataRef.current.triggerKeys);
        formDataRef.current.triggerKeys = [];
    }, 100, [originFormData, otherFormData]);
    return (React.createElement(Form, { colon: false, ...props, form: form, 
        // eslint-disable-next-line consistent-return
        onValuesChange: props.onValuesChange },
        React.createElement(FormValidateInfoContext$1.Provider, { value: validateFormInfo },
            React.createElement(FormInstanceContext$1.Provider, { value: form },
                React.createElement(RelationInfoContext$1.Provider, { value: relationInfo },
                    React.createElement(OtherFormDataContext$1.Provider, { value: otherFormData },
                        React.createElement(TriggerRelationContext$1.Provider, { value: triggerRelation },
                            React.createElement(OtherPropsContext$1.Provider, { value: {
                                    onVisibleChange: onFormItemVisibleChange,
                                } }, typeof children === 'function'
                                ? children({
                                    form,
                                    relationInfo,
                                    otherFormData,
                                    triggerRelation,
                                }, form)
                                : children))))))));
}
const FormR$1 = Object.assign(FormComponent$1, Form);
FormR$1.Item = ItemR$1;

/*
 * @Author: your name
 * @Date: 2021-11-26 15:56:44
 * @LastEditTime: 2023-05-12 14:58:25
 * @LastEditors: 彭越腾
 * @Description: In User Settings Edit
 * @FilePath: \admin-market\src\components\Common\RelationForm\hook.tsx
 */
const useRelation = (props) => {
    const name = useContext(NameContext$1);
    const relationInfo = useContext(RelationInfoContext$1);
    const form = useContext(FormInstanceContext$1);
    const otherFormData = useContext(OtherFormDataContext$1);
    // const triggerRelation = useContext(TriggerRelationContext)
    const matchController = useMemo(() => getMatchRelationResByFormData$1(relationInfo, form?.getFieldsValue(true) || {}, otherFormData), [relationInfo, form?.getFieldsValue(true), otherFormData]);
    const relationDetail = useMemo(() => matchController.reduce((prev, cur) => {
        return mergeRelation$1(prev, cur.relation);
    }, {})[name], [matchController, name]);
    return {
        optionIsDisabled: optionIsDisabled$1(props, relationDetail),
        optionIsHide: optionIsHide$1(props, relationDetail),
        isDisabled: isDisabled$1(props, relationDetail),
    };
};

/*
 * @Author: 彭越腾
 * @Date: 2021-08-19 10:34:17
 * @LastEditTime: 2023-08-18 11:53:14
 * @LastEditors: 彭越腾
 * @Description: In User Settings Edit
 * @FilePath: \admin-market\src\components\Common\RelationForm\Checkbox.tsx
 */
const { Group } = Checkbox;
function CheckboxComponent({ children, desc, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (React.createElement(Checkbox, { ...props, disabled: optionIsDisabled },
        children,
        desc ? (React.createElement("div", null,
            React.createElement(Tooltip, { overlay: desc, style: { width: 'auto' } },
                "\u00A0",
                React.createElement(InfoCircleOutlined, null)))) : null));
}
const CheckboxR = Object.assign(CheckboxComponent, Checkbox);
const GroupComponent = ({ children, ...props }) => {
    const { isDisabled } = useRelation(props);
    return (React.createElement(Group, { ...props, disabled: isDisabled }, children));
};
const GroupR = GroupComponent;
CheckboxR.Group = GroupR;
var CheckboxR$1 = CheckboxR;

const { useForm } = Form;
const RelationInfoContext = createContext([]);
const FormInstanceContext = createContext(null);
const OtherFormDataContext = createContext(null);
const FormValidateInfoContext = createContext(null);
const TriggerRelationContext = createContext(true);
const NameContext = createContext('');
const OtherPropsContext = createContext({});
const hasProp = (obj, key) => {
    return Object.keys(obj).includes(key);
};
const isMatch = (value1, value2) => {
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
    return isMatch(formValue, conditionVal);
};
// 是否匹配到了这个条件
const isMatchCondition = (conditions, matchRule = 'AND', formData, otherFormData) => {
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
            return isMatchCondition(condition.conditions, condition.matchRule, formData, otherFormData);
        }
        return isMatch;
    });
};
/** 根据表单值，获取条件匹配的表单联动关系信息 */
function getMatchRelationResByFormData(relationInfoList, formData, otherFormData) {
    return relationInfoList
        .filter((item) => {
        return isMatchCondition(item.conditions, item.matchRule, formData, otherFormData);
    })
        .sort((a, b) => (a.weight || 0) - (b.weight || 0));
}
/**
 *
 * @param relationInfo 表单联动配置
 * @param formValue 表单校验依赖的数据，需要传入哪些数据，根据传入的relationInfo的类型决定 如果relationInfo的ts类型为 FormRelationType(Dep)[]  那么formValue就需要传入Dep类型的数据
 * @param validateInfo 校验配置
 * @returns
 */
async function validateFromRelationInfo(relationInfo, props) {
    const errors = [];
    const condition = getCondition(relationInfo, // 传入联动配置
    props.formValue);
    const handler = async (validateInfo, value) => {
        const rulesOrigin = validateInfo?.rules;
        const rules = typeof rulesOrigin === 'function'
            ? rulesOrigin(props.formValue)
            : rulesOrigin;
        await Promise.allSettled(Object.entries(validateInfo?.deeps || {}).map(async ([prop, info]) => {
            await handler(info, value?.[prop]);
        }));
        await Promise.allSettled(rules?.map(async (rule) => {
            const empty = Array.isArray(value)
                ? !value.length
                : !value && value !== false;
            if (rule.validator) {
                try {
                    await rule.validator(rule, value, (err) => {
                        errors.push({
                            errorMsg: err,
                        });
                    });
                }
                catch (error) {
                    errors.push({
                        errorMsg: error.message,
                    });
                }
                return;
            }
            if ((value && rule.pattern && !rule.pattern.test(value)) ||
                (empty && rule.required)) {
                errors.push({
                    errorMsg: typeof rule.message === 'string'
                        ? rule.message
                        : '',
                });
                return;
            }
        }) || []);
    };
    await Promise.allSettled(Object.entries(props.validateInfo || {}).map(async ([prop, validateInfo]) => {
        const relationInfo = condition[prop];
        if (!getFieldIsOpen(relationInfo)) {
            return;
        }
        const value = props.formValue[prop];
        await handler(validateInfo, value);
    }));
    return errors;
}
/**
 * 某个选项是否被禁用
 * @param props
 * @param relationDetail
 */
const optionIsDisabled = (props, relationDetail, optionsValueProp) => {
    const optionValue = optionsValueProp ? props[optionsValueProp] : props.value;
    if (relationDetail &&
        relationDetail.disableOptions?.includes(optionValue)) {
        return true;
    }
    return props.disabled;
};
/**
 * 某个选项是否被隐藏
 * @param props
 * @param relationDetail
 */
const optionIsHide = (props, relationDetail, optionsValueProp) => {
    const optionValue = optionsValueProp ? props[optionsValueProp] : props.value;
    if (relationDetail && relationDetail.hideOptions) {
        return relationDetail.hideOptions.includes(optionValue);
    }
    return false;
};
/** 表单是否被禁用 */
const isDisabled = (props, relationDetail) => {
    if (relationDetail && relationDetail.disabled) {
        return true;
    }
    return props.disabled;
};
function mergeRelation(prevRelation, nextRelation) {
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
                disableOptions = [
                    ...(prevDisableOptions || []),
                    ...(nextDisableOptions || []),
                ];
            }
            const prevHideOptions = prevRelationItemInfo.hideOptions;
            const nextHideOptions = nextRelationItemInfo.hideOptions;
            let hideOptions;
            if (prevHideOptions || nextHideOptions) {
                hideOptions = [
                    ...(prevHideOptions || []),
                    ...(nextHideOptions || []),
                ];
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
}
/**
 * 获取表单字段联动后的信息
 * @param relationInfoList 表单联动配置
 * @param formData 表单校验依赖的数据，需要传入哪些数据，根据传入的relationInfoList的类型决定 如果relationInfoList的ts类型为 FormRelationTypeFormRelationType(Dep)[]  那么formData就需要传入Dep类型的数据
 * @returns
 */
function getCondition(relationInfoList, formData) {
    return getMatchRelationResByFormData(relationInfoList, formData).reduce((prev, cur) => {
        return mergeRelation(prev, cur.relation);
    }, {});
}
/**
 * 在表单联动的影响下 该字段是否可设置
 * @param field
 * @returns
 */
const getFieldIsOpen = (field) => {
    return field !== false;
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
            newValue = getHandleValue(detail.resetValue, [
                ...(detail.disableOptions || []),
                ...(detail.hideOptions || []),
            ], detail.valueExcludeDisableOption);
        }
        else if (detail && hasProp(detail, 'value')) {
            if (typeof detail.value === 'function') {
                newValue = getHandleValue(detail.value(curValue), [
                    ...(detail.disableOptions || []),
                    ...(detail.hideOptions || []),
                ], detail.valueExcludeDisableOption);
            }
            else {
                newValue = getHandleValue(detail.value, [
                    ...(detail.disableOptions || []),
                    ...(detail.hideOptions || []),
                ], detail.valueExcludeDisableOption);
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
    const allKeys = [
        ...new Set(Object.keys(prevValues).concat(Object.keys(curValues))),
    ];
    const valueChangeKeys = [];
    allKeys.forEach((key) => {
        if (prevValues[key] !== curValues[key]) {
            valueChangeKeys.push(key);
        }
    });
    return valueChangeKeys;
};
/**
 * 根据表单联动关系和现有的表单值，生成一些需要变化的值
 * @param relationInfo 联动关系
 * @param pendingFormValues 即将要渲染的表单的值
 * @param prevEffectValues 上一次联动关系计算后得到的 表单变化的值
 * @param triggerChangeKeys 触发了此次更新的表单key
 * @returns 表单变化的值
 */
function initRelationValue(relationInfo, pendingFormValues, prevEffectValues, triggerChangeKeys, needTriggerReset = true, props) {
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
                const valueIsEmpty = !hasProp(pendingFormValues, prop) ||
                    pendingFormValues[prop] === undefined;
                const curRelationDetail = curRelation[prop];
                const needResetWhenOnlyEmpty = // 仅值为空时才进行值的重置
                 curRelationDetail === false ||
                    (curRelationDetail?.needResetWhenOnlyEmpty ?? true);
                const hasResetValueFromRelation = // 通过表单联动判断 该属性是否有重置值
                 curRelationDetail &&
                    hasProp(curRelationDetail, 'resetValue');
                const resetValueIsValid = // 没有固定值value、并且没有传入noResetValuesProp 才能使用表单联动的重置值
                 (!curRelationDetail ||
                    !hasProp(curRelationDetail, 'value')) &&
                    (!props?.noResetValuesProp ||
                        !props?.noResetValuesProp.includes(prop));
                const needResetValueFromRelation = // 通过个联动条件判断是否需要做值得重置
                 !needResetWhenOnlyEmpty || // 不是【仅值为空时进行重置】（也就是无论是否值为空，只要条件触发了就重置）
                    (needResetWhenOnlyEmpty && valueIsEmpty) || // 值为空、并且是【仅值为空时进行重置】
                    (isDefault && valueIsEmpty); // 值为空、并且拥有默认值
                if (hasResetValueFromRelation &&
                    needResetValueFromRelation &&
                    resetValueIsValid) {
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
    /* if (props.className?.includes('ad-position-form')) {
        console.log(`initRelationValue`, match);
        console.log(`pendingFormValues`, pendingFormValues);
        console.log(`effectValues`, effectValues);
        console.log(`getValueChangeKeys`, pendingFormValues, newFormValues);
        console.log(`triggerChangeKeys`, getValueChangeKeys(pendingFormValues, newFormValues));
        console.log(`equalMatch`, equalMatch);
        console.log(`res`, res);
    } */
    if (!equalMatch) {
        allEffectRes = initRelationValue(relationInfo, newFormValues, allEffectRes, getValueChangeKeys(pendingFormValues, newFormValues), needTriggerReset, props);
    }
    Object.keys(props?.recoverData || {}).forEach((recoverProp) => {
        const recoverValue = props?.recoverData?.[recoverProp];
        const curValue = pendingFormValues?.[recoverProp];
        /* 加入恢复值之后的表单数据 */
        const formValuesWithRecoverProp = {
            ...pendingFormValues,
            ...allEffectRes,
            [recoverProp]: recoverValue,
        };
        /* 加入恢复值之后的表单联动关系，用于下面计算effectValuesWithRecoverProp */
        const matchWithRecoverProp = getMatchRelationResByFormData(relationInfo, formValuesWithRecoverProp);
        /* 加入恢复值之后的表单联动关系的具体值，用于下面计算effectValuesWithRecoverProp */
        const relationWithRecoverProp = matchWithRecoverProp.reduce((prev, cur) => {
            const curRelation = {
                ...cur.relation,
            };
            return mergeRelation(prev, curRelation);
        }, {});
        const curPropRelation = relationWithRecoverProp[recoverProp];
        const recoverValueIsValid = curPropRelation === undefined ||
            (curPropRelation !== false &&
                !hasProp(curPropRelation, 'value') &&
                !curPropRelation.disableOptions?.includes(recoverProp) &&
                !curPropRelation?.hideOptions?.includes(recoverProp));
        /* 加入恢复值之后 最后联动出来的表单数据 */
        const effectValuesWithRecoverProp = getValuesFromRelation(relationWithRecoverProp, formValuesWithRecoverProp);
        const curValueIsEmpty = Array.isArray(curValue)
            ? !curValue.length
            : curValue === undefined || curValue === null;
        /** 加入恢复值之后生成的表单数据中 triggerChangeKeys的表单值没有发生变化，才可以进行恢复：
         * triggerChangeKeys代表触发了此次表单联动的某些表单属性，
         * 因为本来就是triggerChangeKeys对应的表单触发了此次联动，反过来去修改triggerChangeKeys的表单值，会陷入一个循环，导致页面修改的东西会失效
         */
        if (triggerChangeKeys.every((trigger) => {
            if (!hasProp(effectValuesWithRecoverProp, trigger)) {
                return true;
            }
            return (effectValuesWithRecoverProp[trigger] ===
                formValuesWithRecoverProp[trigger]);
        }) &&
            recoverValueIsValid && // 恢复值是否可用
            curValueIsEmpty && // 是否为空值，为空才需要恢复
            typeof recoverValue !== 'boolean' // 布尔值不用恢复，个人感觉更加符合用户习惯，准确说是更符合投放平台的习惯？
        ) {
            allEffectRes[recoverProp] = recoverValue;
        }
    });
    return allEffectRes;
}
function ItemComponent({ children, ...props }) {
    const relationInfo = useContext(RelationInfoContext);
    const form = useContext(FormInstanceContext);
    const validateFormInfo = useContext(FormValidateInfoContext);
    const name = (props.name || '');
    const otherFormData = useContext(OtherFormDataContext);
    const otherProps = useContext(OtherPropsContext);
    const matchController = getMatchRelationResByFormData(relationInfo, form?.getFieldsValue(true) || {}, otherFormData);
    const formItemIsShow = (() => {
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
    const rulesFromContext = validateFormInfo?.[name]?.rules;
    const rules = props?.rules ||
        (typeof rulesFromContext === 'function'
            ? rulesFromContext(form?.getFieldsValue(true) || {})
            : rulesFromContext);
    useUpdateEffect(() => {
        otherProps?.onVisibleChange?.(formItemIsShow, name);
    }, [formItemIsShow]);
    return (React.createElement(NameContext.Provider, { value: name }, formItemIsShow ? (React.createElement(Form.Item, { ...props, style: props.style, rules: formItemIsShow ? rules : undefined }, children)) : null));
}
const ItemR = Object.assign(ItemComponent, Form.Item);
function FormComponent({ onRelationValueChange, relationInfo, children, triggerRelation = true, triggerResetValue = true, validateFormInfo, otherFormData, formData, ...props }) {
    const [form] = useForm(props.form);
    /* 存储值不为空的表单数据 */
    const [noEmptyFormData, setNoEmptyFormData] = useState({});
    /* 用于恢复表单上一次的非空数据 */
    const recoverData = useRef({
        data: {},
    });
    const originFormData = formData || form.getFieldsValue(true);
    const formDataRef = useRef({
        data: {
            ...(props.initialValues || {}),
            ...originFormData,
            ...(otherFormData || {}),
        },
        triggerKeys: [],
    });
    // const [, triggerUpdate] = useState(`${+new Date()}`)
    const onChange = (effectValues) => {
        const { data } = formDataRef.current;
        const valueHasChange = Object.keys(effectValues).some((key) => {
            return !isEqual(effectValues[key], data[key]);
        });
        if (valueHasChange) {
            onRelationValueChange(effectValues, true);
        }
        formDataRef.current.data = {
            ...formDataRef.current.data,
            ...effectValues,
        };
    };
    /**
     * 如果表单显示出来，则把数据恢复到上一次的非空数据
     * @param visible
     * @param name
     */
    const onFormItemVisibleChange = (visible, name) => {
        const prevValue = formDataRef.current.data?.[name];
        const prevIsEmpty = Array.isArray(prevValue)
            ? !prevValue.length
            : prevValue === undefined || prevValue === null;
        if (visible &&
            prevIsEmpty &&
            triggerRelation &&
            triggerResetValue &&
            hasProp(noEmptyFormData, name)) {
            recoverData.current.data[name] = noEmptyFormData[name];
        }
    };
    const run = (triggerKeys) => {
        const { data } = formDataRef.current;
        const effectValues = initRelationValue(relationInfo, data, {}, triggerKeys, triggerResetValue, {
            recoverData: recoverData.current.data,
        });
        recoverData.current.data = {};
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
        setNoEmptyFormData((prev) => {
            return {
                ...prev,
                ...Object.keys(originFormData).reduce((prevFormDataHandle, formDataProp) => {
                    const res = {
                        ...prevFormDataHandle,
                    };
                    const val = originFormData[formDataProp];
                    const noEmpty = Array.isArray(val)
                        ? !!val.length
                        : !!val;
                    if (noEmpty) {
                        res[formDataProp] = val;
                    }
                    return res;
                }, {}),
            };
        });
    }, [originFormData, otherFormData]);
    useDebounce(() => {
        if (!triggerRelation) {
            return;
        }
        run(formDataRef.current.triggerKeys);
        formDataRef.current.triggerKeys = [];
    }, 100, [originFormData, otherFormData]);
    return (React.createElement(Form, { colon: false, ...props, form: form, 
        // eslint-disable-next-line consistent-return
        onValuesChange: props.onValuesChange },
        React.createElement(FormValidateInfoContext.Provider, { value: validateFormInfo },
            React.createElement(FormInstanceContext.Provider, { value: form },
                React.createElement(RelationInfoContext.Provider, { value: relationInfo },
                    React.createElement(OtherFormDataContext.Provider, { value: otherFormData },
                        React.createElement(TriggerRelationContext.Provider, { value: triggerRelation },
                            React.createElement(OtherPropsContext.Provider, { value: {
                                    onVisibleChange: onFormItemVisibleChange,
                                } }, typeof children === 'function'
                                ? children({
                                    form,
                                    relationInfo,
                                    otherFormData,
                                    triggerRelation,
                                }, form)
                                : children))))))));
}
const FormR = Object.assign(FormComponent, Form);
FormR.Item = ItemR;

export { CheckboxR$1 as Checkbox, FormR as Form, FormInstanceContext, FormValidateInfoContext, ItemR as Item, NameContext, OtherFormDataContext, OtherPropsContext, RadioR as Radio, RelationInfoContext, SelectR as Select, SwitchR as Switch, TriggerRelationContext, FormR as default, getCondition, getFieldIsOpen, getMatchRelationResByFormData, initRelationValue, isDisabled, mergeRelation, optionIsDisabled, optionIsHide, validateFromRelationInfo };
