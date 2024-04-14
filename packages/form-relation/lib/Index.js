'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var antd = require('antd');
var lodash = require('lodash');
var React = require('react');
var reactUse = require('react-use');
var icons = require('@ant-design/icons');

const RelationInfoContext = React.createContext([]);
const FormInstanceContext = React.createContext(null);
const FormDataContext = React.createContext({});
const OtherFormDataContext = React.createContext(null);
const FormValidateInfoContext = React.createContext(null);
const TriggerRelationContext = React.createContext(true);
const NameContext = React.createContext('');
const OtherPropsContext = React.createContext({});

const hasProp = (obj, key) => {
    if (Array.isArray(key)) {
        let has = true;
        key.reduce((prev, cur) => {
            if (!Object.keys(prev || {}).includes(cur)) {
                has = false;
            }
            return prev?.[cur];
        }, obj);
        return has;
    }
    else {
        return Object.keys(obj).includes(key);
    }
};
/**
 * 合并两个对象
 * @param origin
 * @param newData
 * @param {
* mutable： 可变性，会直接修改origin里面的值
* }
* @returns
*/
const assignDeep = (origin, newData, { mutable }) => {
    if (!lodash.isPlainObject(origin) || !lodash.isPlainObject(newData)) {
        return origin;
    }
    const originCopy = mutable
        ? origin
        : {
            ...origin,
        };
    const loopNewDataProp = (context, key, val) => {
        if (lodash.isPlainObject(val) && lodash.isPlainObject(context[key])) {
            Object.entries(val).forEach(([key1, val1]) => {
                loopNewDataProp(val, key1, val1);
                if (mutable) {
                    context[key][key1] = val1;
                }
            });
            if (!mutable) {
                context[key] = { ...context[key], ...val };
            }
        }
        else {
            context[key] = val;
        }
    };
    Object.entries(newData).forEach(([key, val]) => {
        loopNewDataProp(originCopy, key, val);
    });
    return originCopy;
};
const getObjVal = (obj, key) => {
    if (Array.isArray(key)) {
        return key.reduce((prev, cur) => {
            return prev?.[cur];
        }, obj);
    }
    else {
        return obj[key];
    }
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
const formValueIsMatchInCondition = (formValue, conditionVal, formData, { prevVal, prevFormData }) => {
    if (typeof conditionVal === 'function') {
        return conditionVal(formValue, formData, {
            prevVal,
            prevFormData,
        });
    }
    return isMatch(formValue, conditionVal);
};
// 是否匹配到了这个条件
function isMatchCondition(conditions, matchRule = 'AND', formData, props) {
    if (conditions === 'default') {
        return true;
    }
    if (!Array.isArray(conditions)) {
        return conditions.result({
            ...formData,
        }, props.oldFormData);
    }
    const matchFn = matchRule === 'AND' ? conditions.every : conditions.some;
    return matchFn.call(conditions, (condition) => {
        const formValue = getObjVal(formData, condition.key);
        const prevFormValue = getObjVal(props.oldFormData, condition.key);
        const isMatch = formValueIsMatchInCondition(formValue, condition.value, {
            ...formData,
        }, {
            prevFormData: props.oldFormData,
            prevVal: prevFormValue,
        });
        if (isMatch && condition.conditions) {
            return isMatchCondition(condition.conditions, condition.matchRule, formData, props);
        }
        return isMatch;
    });
}
function and(params) {
    return {
        isOpRes: true,
        result: (info, prevInfo) => {
            return params.reduce((prev, cur) => {
                return (isMatchCondition(cur === 'default' || cur.isOpRes ? cur : [cur], 'AND', info, {
                    oldFormData: prevInfo,
                }) && prev);
            }, true);
        },
    };
}
function or(params) {
    return {
        isOpRes: true,
        result: (info, prevInfo) => {
            const res = params.reduce((prev, cur) => {
                return (isMatchCondition(cur === 'default' || cur.isOpRes ? cur : [cur], 'OR', info, {
                    oldFormData: prevInfo,
                }) || prev);
            }, false);
            return res;
        },
    };
}
/** 根据表单值，获取条件匹配的表单联动关系信息 */
function getMatchRelationResByFormData(relationInfoList, formData, props) {
    return relationInfoList
        .filter((item) => {
        return isMatchCondition(item.conditions, item.matchRule, formData, {
            oldFormData: props?.oldFormData || {},
        });
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
function getCondition(relationInfoList, formData, props) {
    return getMatchRelationResByFormData(relationInfoList, formData, {
        oldFormData: props?.oldFormData || {},
    }).reduce((prev, cur) => {
        return mergeRelation(prev, cur.relation);
    }, {});
}
/**
 * 在表单联动的影响下 该字段是否可设置
 * @param field
 * @returns
 */
const getFieldIsOpen = (field) => {
    return field !== false && !field?.close;
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
function getValuesFromRelation(relation, pendingFormValues) {
    return Object.entries(relation).reduce((prev, cur) => {
        const [key, detail] = cur;
        const isClose = detail === false || detail.close;
        const curValue = detail && detail.keyPath
            ? getObjVal(pendingFormValues, detail.keyPath)
            : pendingFormValues[key];
        let newValue;
        const curValueUnable = curValue === undefined ||
            (detail && detail.disableOptions?.includes(curValue)) ||
            (detail && detail.hideOptions?.includes(curValue)) ||
            curValue?.some?.((item) => detail && detail.disableOptions?.includes(item)) ||
            curValue?.some?.((item) => detail && detail.hideOptions?.includes(item));
        if (isClose) {
            newValue =
                detail && hasProp(detail, 'closeValue')
                    ? detail.closeValue
                    : undefined;
        }
        else if (curValueUnable &&
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
        else {
            newValue = curValue;
        }
        let objVal = {};
        if (detail && detail.keyPath?.length) {
            ;
            detail.keyPath.reduce((prevObj, key, index) => {
                if (index === (detail.keyPath?.length || 0) - 1) {
                    prevObj[key] = newValue;
                }
                else {
                    prevObj[key] = {};
                }
                return prevObj[key];
            }, objVal);
        }
        else {
            objVal = {
                [key]: newValue,
            };
        }
        return assignDeep(prev, objVal, {});
    }, {});
}
const cpmNamePath = (name1, name2) => {
    if (name1.length !== name2.length) {
        return false;
    }
    return name1.every((item, index) => {
        return item === name2[index];
    });
};
const isEqualName = (name1, name2) => {
    if (Array.isArray(name1) && Array.isArray(name2)) {
        return cpmNamePath(name1, name2);
    }
    const name1Res = Array.isArray(name1) && name1.length === 1 ? name1[0] : name1;
    const name2Res = Array.isArray(name2) && name2.length === 1 ? name2[0] : name2;
    return name1Res === name2Res;
};
const cmpArray = (match1, match2) => {
    if (match1.length !== match2.length) {
        return false;
    }
    return match1.every((item) => {
        return match2.indexOf(item) > -1;
    });
};
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
function initRelationValue(relationInfo, pendingFormValues, prevEffectValues, needTriggerReset = true, props) {
    const match = getMatchRelationResByFormData(relationInfo, pendingFormValues, {
        oldFormData: props?.oldFormValues || {},
    });
    const oldMatch = props?.oldFormValues
        ? getMatchRelationResByFormData(relationInfo, props?.oldFormValues, {
            oldFormData: props?.oldFormValues || {},
        })
        : undefined;
    const relation = match.reduce((prev, cur) => {
        /** 该条件是默认触发的，或者旧的表单没有满足该条件，但新的表单满足了该条件，则证明该条件是新达成的 */
        const isDefaultOrNewCondition = cur.conditions === 'default' ||
            (oldMatch && !oldMatch.find((old) => old === cur));
        const isDefault = cur.conditions === 'default';
        const curRelation = {
            ...cur.relation,
        };
        /** 如果该条件是默认条件或者是新达成的条件，则该条件所关联的表单字段需要进行值重置 */
        if (isDefaultOrNewCondition && needTriggerReset) {
            // eslint-disable-next-line no-restricted-syntax, guard-for-in
            for (const prop in curRelation) {
                const curRelationDetail = curRelation[prop];
                /** 如果联动是由该字段引起的，则该字段无需做值重置，避免循环 */
                const name = curRelationDetail && curRelationDetail?.keyPath
                    ? curRelationDetail.keyPath
                    : prop;
                const isTriggerTarget = props?.triggerChangeKey
                    ? isEqualName(name, props?.triggerChangeKey)
                    : false;
                if (isTriggerTarget) {
                    continue;
                }
                const valueIsEmpty = !hasProp(pendingFormValues, prop) ||
                    pendingFormValues[prop] === undefined;
                const needResetWhenOnlyEmpty = // 仅值为空时才进行值的重置
                 curRelationDetail === false ||
                    (curRelationDetail?.needResetWhenOnlyEmpty ?? true);
                const hasResetValueFromRelation = // 通过表单联动判断 该属性是否有重置值
                 curRelationDetail &&
                    hasProp(curRelationDetail, 'resetValue');
                const resetValueIsValid = // 没有固定值value、才能使用表单联动的重置值
                 !curRelationDetail ||
                    !hasProp(curRelationDetail, 'value');
                const needResetValueFromRelation = // 通过个联动条件判断是否需要做值得重置
                 !needResetWhenOnlyEmpty || // 不是【仅值为空时进行重置】（也就是无论是否值为空，只要条件触发了就重置）
                    (needResetWhenOnlyEmpty && valueIsEmpty) || // 值为空、并且是【仅值为空时进行重置】
                    (isDefault && valueIsEmpty); // 值为空、并且是默认条件
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
    const newFormValues = assignDeep(pendingFormValues, effectValues, {});
    const nextMatch = getMatchRelationResByFormData(relationInfo, newFormValues, {
        oldFormData: props?.oldFormValues || {},
    });
    const equalMatch = cmpArray(match, nextMatch);
    let allEffectRes = assignDeep(prevEffectValues, effectValues, {});
    if (!equalMatch) {
        allEffectRes = initRelationValue(relationInfo, newFormValues, allEffectRes, needTriggerReset, props);
    }
    /** 未加入恢复值之前的表单数据 */
    const finalResBeforeRecoverProp = assignDeep(pendingFormValues, allEffectRes, {});
    /* 加入恢复值之后的表单数据 */
    const formValuesWithRecoverProp = assignDeep(finalResBeforeRecoverProp, props?.recoverData || {}, {});
    /* 加入恢复值之后的表单联动关系，用于下面计算effectValuesWithRecoverProp */
    const matchWithRecoverProp = getMatchRelationResByFormData(relationInfo, formValuesWithRecoverProp, {
        oldFormData: props?.oldFormValues || {},
    });
    /* 加入恢复值之后的表单联动关系的具体值，用于下面计算effectValuesWithRecoverProp */
    const relationWithRecoverProp = matchWithRecoverProp.reduce((prev, cur) => {
        const curRelation = {
            ...cur.relation,
        };
        return mergeRelation(prev, curRelation);
    }, {});
    /* 加入恢复值之后 最后联动出来的表单数据 */
    const effectValuesWithRecoverProp = getValuesFromRelation(relationWithRecoverProp, formValuesWithRecoverProp);
    /** 加入恢复值之后最终的表单数据结果 */
    const finalResWithRecoverProp = assignDeep(formValuesWithRecoverProp, effectValuesWithRecoverProp, {});
    if (props?.triggerChangeKey) {
        /**
         * 加入恢复值之后生成的表单数据中 前后triggerChangeKey的表单值没有发生变化，才可以进行恢复：
         * triggerChangeKey代表触发了此次表单联动的某些表单控件的key，
         * 因为本来就是triggerChangeKeys对应的表单触发了此次联动，反过来去修改triggerChangeKeys的表单值，会陷入一个循环，导致页面修改的东西会失效
         */
        if (getObjVal(finalResBeforeRecoverProp, props?.triggerChangeKey) ===
            getObjVal(finalResWithRecoverProp, props?.triggerChangeKey)) {
            return assignDeep(allEffectRes, assignDeep(props?.recoverData || {}, effectValuesWithRecoverProp, {}), {});
        }
        else {
            return allEffectRes;
        }
    }
    else {
        return assignDeep(allEffectRes, assignDeep(props?.recoverData || {}, effectValuesWithRecoverProp, {}), {});
    }
}

const useRelation = (props) => {
    const name = React.useContext(NameContext);
    const relationInfo = React.useContext(RelationInfoContext);
    const formData = React.useContext(FormDataContext);
    const otherFormData = React.useContext(OtherFormDataContext);
    // const triggerRelation = useContext(TriggerRelationContext)
    const matchController = React.useMemo(() => getMatchRelationResByFormData(relationInfo, {
        ...(otherFormData || {}),
        ...(formData || {}),
    }), [relationInfo, formData, otherFormData]);
    const relationDetail = React.useMemo(() => {
        const allRelation = matchController.reduce((prev, cur) => {
            return mergeRelation(prev, cur.relation);
        }, {});
        if (Array.isArray(name)) {
            return Object.values(allRelation).find(item => item && item.keyPath && cpmNamePath(item.keyPath, name));
        }
        else {
            return allRelation[name];
        }
    }, [matchController, name]);
    return {
        optionIsDisabled: optionIsDisabled(props, relationDetail),
        optionIsHide: optionIsHide(props, relationDetail),
        isDisabled: isDisabled(props, relationDetail),
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
const { Group: Group$1 } = antd.Checkbox;
function CheckboxComponent({ children, desc, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (React.createElement(antd.Checkbox, { ...props, disabled: optionIsDisabled },
        children,
        desc ? (React.createElement("div", null,
            React.createElement(antd.Tooltip, { overlay: desc, style: { width: 'auto' } },
                "\u00A0",
                React.createElement(icons.InfoCircleOutlined, { rev: undefined })))) : null));
}
const CheckboxR = Object.assign(CheckboxComponent, antd.Checkbox);
const GroupComponent$1 = ({ children, ...props }) => {
    const { isDisabled } = useRelation(props);
    return (React.createElement(Group$1, { ...props, disabled: isDisabled }, children));
};
const GroupR$1 = GroupComponent$1;
CheckboxR.Group = GroupR$1;

/*
 * @Author: 彭越腾
 * @Date: 2021-08-18 18:34:55
 * @LastEditTime: 2023-05-12 14:59:59
 * @LastEditors: 彭越腾
 * @Description: In User Settings Edit
 * @FilePath: \admin-market\src\components\Common\RelationForm\Radio.tsx
 */
const { Button, Group } = antd.Radio;
function RadioComponent({ children, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (React.createElement(antd.Radio, { ...props, disabled: optionIsDisabled }, children));
}
const RadioR = Object.assign(RadioComponent, antd.Radio);
const GroupComponent = ({ children, ...props }) => {
    const { isDisabled } = useRelation(props);
    return (React.createElement(Group, { ...props, disabled: isDisabled }, children));
};
const GroupR = GroupComponent;
function ButtonComponent({ children, desc, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (React.createElement(Button, { ...props, disabled: optionIsDisabled },
        children,
        desc ? (React.createElement(antd.Tooltip, { overlay: desc },
            "\u00A0",
            React.createElement(icons.InfoCircleOutlined, { rev: undefined }))) : null));
}
const ButtonR = Object.assign(ButtonComponent, Button);
RadioR.Button = ButtonR;
RadioR.Group = GroupR;

/*
 * @Author: 彭越腾
 * @Date: 2021-08-18 17:55:28
 * @LastEditTime: 2023-11-23 13:44:25
 * @LastEditors: 彭越腾
 * @Description: In User Settings Edit
 * @FilePath: \react-component\packages\form-relation\src\Select.tsx
 */
function SelectComponent({ children, ...props }) {
    const name = React.useContext(NameContext);
    const relationInfo = React.useContext(RelationInfoContext);
    // const form = useContext(FormInstanceContext)
    const formData = React.useContext(FormDataContext);
    const otherFormData = React.useContext(OtherFormDataContext);
    const triggerRelation = React.useContext(TriggerRelationContext);
    const matchController = React.useMemo(() => getMatchRelationResByFormData(relationInfo, {
        ...(formData || {}),
        ...(otherFormData || {}),
    }), [relationInfo, formData, otherFormData]);
    const relationDetail = React.useMemo(() => {
        const allRelation = matchController.reduce((prev, cur) => {
            return mergeRelation(prev, cur.relation);
        }, {});
        if (Array.isArray(name)) {
            return Object.values(allRelation).find(item => item && item.keyPath && cpmNamePath(item.keyPath, name));
        }
        else {
            return allRelation[name];
        }
    }, [matchController, name]);
    const filterChildren = (children) => {
        return children
            ?.filter?.((item) => {
            if (!item) {
                return false;
            }
            const isHide = optionIsHide(item.props || {}, relationDetail);
            return !isHide;
        })
            ?.map?.((item) => ({
            ...item,
            props: {
                ...(item.props || {}),
                disabled: optionIsDisabled(item.props || {}, relationDetail),
                children: item.type === antd.Select.OptGroup
                    ? filterChildren(item.props?.children)
                    : item.props?.children,
            },
        }));
    };
    return (React.createElement(antd.Select, { ...props, disabled: isDisabled(props, relationDetail) }, filterChildren(children)));
}
const SelectR = Object.assign(SelectComponent, antd.Select);
const OptionComponent = ({ children, desc, ...props }) => {
    const relation = useRelation(props);
    return relation.optionIsHide ? null : (React.createElement(antd.Select.Option, { ...props, disabled: relation.optionIsDisabled }, desc ? (React.createElement("div", null,
        React.createElement("p", null, children),
        React.createElement(antd.Typography.Text, { type: 'secondary' }, desc))) : (children)));
};
const Option = Object.assign(OptionComponent, antd.Select.Option);
SelectR.Option = Option;

const SwitchComponent = (props) => {
    const { isDisabled } = useRelation(props);
    return React.createElement(antd.Switch, { ...props, disabled: isDisabled });
};
const SwitchR = Object.assign(SwitchComponent, antd.Switch);

/*
 * @Author: 彭越腾
 * @Date: 2021-08-16 17:33:33
 * @LastEditTime: 2023-11-28 15:02:00
 * @LastEditors: 彭越腾
 * @Description: 能控制各个字段之间联动的表单
 * @FilePath: \react-component\packages\form-relation\src\index.tsx
 */
const { useForm } = antd.Form;
function ItemComponent({ children, ...props }) {
    const relationInfo = React.useContext(RelationInfoContext);
    // const form = useContext(FormInstanceContext)
    const formData = React.useContext(FormDataContext);
    const validateFormInfo = React.useContext(FormValidateInfoContext);
    const name = props.name || '';
    const otherFormData = React.useContext(OtherFormDataContext);
    const otherProps = React.useContext(OtherPropsContext);
    const matchController = getMatchRelationResByFormData(relationInfo, {
        ...(formData || {}),
        ...(otherFormData || {}),
    }, {
        oldFormData: {},
    });
    const allRelation = matchController.reduce((prev, cur) => {
        return {
            ...prev,
            ...cur.relation,
        };
    }, {});
    const formItemIsShow = (() => {
        if (!matchController.length) {
            return true;
        }
        const findRelationDetailFromKeyPath = (keyPath) => {
            return Object.values(allRelation).find((item) => {
                return (item &&
                    item.keyPath &&
                    cpmNamePath(keyPath, item.keyPath));
            });
        };
        /** 判断父级属性是否关闭，如果关闭，则该属性也关闭 */
        if (Array.isArray(name)) {
            let parentIsClose = false;
            name.forEach((cur, index) => {
                const keyPath = name.slice(0, index + 1);
                let parentRelation;
                if (keyPath.length === 1) {
                    parentRelation =
                        findRelationDetailFromKeyPath(keyPath) ??
                            allRelation[keyPath[0]];
                }
                else {
                    parentRelation = findRelationDetailFromKeyPath(keyPath);
                }
                if (!getFieldIsOpen(parentRelation)) {
                    parentIsClose = true;
                }
            });
            if (parentIsClose) {
                return false;
            }
        }
        const relationDetail = Array.isArray(name)
            ? findRelationDetailFromKeyPath(name)
            : allRelation[name];
        if (relationDetail === undefined || relationDetail === null) {
            return true;
        }
        return getFieldIsOpen(relationDetail);
    })();
    let rulesFromContext;
    if (Array.isArray(name)) {
        name.reduce((prev, curName, index) => {
            const curValidateInfo = prev?.[curName];
            if (index === name.length - 1) {
                rulesFromContext = curValidateInfo?.rules;
            }
            return curValidateInfo?.deeps;
        }, validateFormInfo);
    }
    else {
        rulesFromContext = validateFormInfo?.[name]?.rules;
    }
    const rules = props?.rules ||
        (typeof rulesFromContext === 'function'
            ? rulesFromContext(formData || {})
            : rulesFromContext);
    React.useEffect(() => {
        otherProps?.onVisibleChange?.(formItemIsShow, name);
    }, [formItemIsShow]);
    return (React.createElement(NameContext.Provider, { value: name }, formItemIsShow ? (React.createElement(antd.Form.Item, { ...props, style: props.style, rules: formItemIsShow ? rules : undefined }, children)) : null));
}
const ItemR = Object.assign(ItemComponent, antd.Form.Item);
function FormComponent({ onRelationValueChange, relationInfo, children, triggerRelation = true, triggerResetValue = true, validateFormInfo, otherFormData, formData, changeDataType = 'merge', ...props }) {
    const [form] = useForm(props.form);
    /* 存储值不为空的表单数据 */
    const [noEmptyFormData, setNoEmptyFormData] = React.useState({});
    /* 用于恢复表单上一次的非空数据 */
    const recoverData = React.useRef({
        data: {},
    });
    const emptyInitialVal = React.useMemo(() => ({}), []);
    const originFormData = formData || form.getFieldsValue(true);
    const formDataRef = React.useRef({
        data: {},
        triggerKeys: '',
        relationInfo: [],
    });
    const onChange = (effectValues) => {
        const valueHasChange = Object.keys(effectValues).some((key) => {
            return !lodash.isEqual(effectValues[key], originFormData[key]);
        });
        if (valueHasChange) {
            onRelationValueChange(effectValues, true);
        }
        formDataRef.current.data =
            changeDataType === 'merge'
                ? assignDeep({
                    ...(otherFormData || {}),
                    ...originFormData,
                }, effectValues, {})
                : {
                    ...(otherFormData || {}),
                    ...originFormData,
                    ...effectValues,
                };
        formDataRef.current.relationInfo = relationInfo;
    };
    /**
     * 如果表单显示出来，则把数据恢复到上一次的非空数据
     * @param visible
     * @param name
     */
    const onFormItemVisibleChange = (visible, name) => {
        /* const prevValue = Array.isArray(name)
            ? name.reduce((prev, cur) => {
                  return prev?.[cur]
              }, formDataRef.current.data)
            : formDataRef.current.data?.[name]
        const prevIsEmpty = isEmpty(prevValue) */
        const allRelation = relationInfo.reduce((prev, cur) => {
            return mergeRelation(prev, cur.relation);
        }, {});
        const relation = Array.isArray(name)
            ? Object.values(allRelation || {}).find((detail) => {
                return (detail &&
                    detail.keyPath &&
                    cpmNamePath(detail.keyPath, name));
            })
            : allRelation[name];
        const isNoRecover = relation && relation?.noRecoverValue;
        if (!isNoRecover &&
            visible &&
            /* prevIsEmpty && */
            triggerRelation &&
            triggerResetValue &&
            hasProp(noEmptyFormData, name)) {
            if (Array.isArray(name)) {
                const objVal = {};
                name.reduce((prevObj, key, index) => {
                    if (index === name.length - 1) {
                        prevObj[key] = name.reduce((prev, cur) => {
                            return prev?.[cur];
                        }, noEmptyFormData);
                    }
                    else {
                        prevObj[key] = {};
                    }
                    return prevObj[key];
                }, objVal);
                recoverData.current.data = assignDeep(recoverData.current.data, objVal, {});
            }
            else {
                recoverData.current.data[name] = noEmptyFormData[name];
            }
        }
    };
    const getEffectValues = (formData) => {
        return initRelationValue(relationInfo, formData, {}, triggerResetValue, {
            recoverData: recoverData.current.data,
            oldFormValues: formDataRef.current.data,
            triggerChangeKey: formDataRef.current.triggerKeys,
        });
    };
    const run = () => {
        const match = getMatchRelationResByFormData(relationInfo, {
            ...originFormData,
            ...(otherFormData || {}),
        });
        const oldMatch = getMatchRelationResByFormData(formDataRef.current.relationInfo, formDataRef.current.data);
        /** 前后两次联动关系一样，并且没有需要恢复的数据，则无需执行联动 */
        if (cmpArray(match, oldMatch) && lodash.isEmpty(recoverData.current.data)) {
            return;
        }
        const effectValues = getEffectValues({
            ...originFormData,
            ...(otherFormData || {}),
        });
        recoverData.current.data = {};
        onChange(effectValues);
        formDataRef.current.triggerKeys = '';
    };
    React.useEffect(() => {
        setNoEmptyFormData((prev) => {
            return {
                ...prev,
                ...Object.keys(originFormData).reduce((prevFormDataHandle, formDataProp) => {
                    const res = {
                        ...prevFormDataHandle,
                    };
                    const val = originFormData[formDataProp];
                    const noEmpty = !lodash.isEmpty(val) || val === false;
                    if (noEmpty) {
                        res[formDataProp] = val;
                    }
                    return res;
                }, {}),
            };
        });
    }, [originFormData, otherFormData]);
    React.useEffect(() => {
        if (!props.form) {
            form.setFieldsValue(originFormData);
        }
    }, [formData]);
    reactUse.useDebounce(() => {
        if (!triggerRelation) {
            return;
        }
        run();
    }, 200, [originFormData, otherFormData, relationInfo]);
    return (React.createElement(antd.Form, { colon: false, ...props, form: form, onFieldsChange: (fields, allFields) => {
            formDataRef.current.triggerKeys = fields?.[0]?.name;
            props?.onFieldsChange?.(fields, allFields);
        }, onValuesChange: (val, all) => {
            const effectValues = getEffectValues(assignDeep({
                ...originFormData,
                ...(otherFormData || {}),
            }, val, {}));
            props?.onValuesChange?.(changeDataType === 'merge'
                ? assignDeep(val, effectValues, {})
                : {
                    ...val,
                    ...effectValues,
                }, changeDataType === 'merge'
                ? assignDeep(all, effectValues, {})
                : {
                    ...all,
                    ...effectValues,
                });
        } },
        React.createElement(FormValidateInfoContext.Provider, { value: validateFormInfo },
            React.createElement(FormDataContext.Provider, { value: originFormData },
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
                                        validateFormInfo,
                                    }, form)
                                    : children)))))))));
}
const FormR = Object.assign(FormComponent, antd.Form);
FormR.Item = ItemR;

exports.Checkbox = CheckboxR;
exports.Form = FormR;
exports.Item = ItemR;
exports.Radio = RadioR;
exports.Select = SelectR;
exports.Switch = SwitchR;
exports.default = FormR;
