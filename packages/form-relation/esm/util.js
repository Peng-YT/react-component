import { isPlainObject } from 'lodash';

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
    if (!isPlainObject(origin) || !isPlainObject(newData)) {
        return origin;
    }
    const originCopy = mutable
        ? origin
        : {
            ...origin,
        };
    const loopNewDataProp = (context, key, val) => {
        if (isPlainObject(val) && isPlainObject(context[key])) {
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
const formValueIsMatchInCondition = (formValue, conditionVal, formData) => {
    if (typeof conditionVal === 'function') {
        return conditionVal(formValue, formData);
    }
    return isMatch(formValue, conditionVal);
};
// 是否匹配到了这个条件
function isMatchCondition(conditions, matchRule = 'AND', formData, otherFormData) {
    if (conditions === 'default') {
        return true;
    }
    if (!Array.isArray(conditions)) {
        return conditions.result({
            ...(otherFormData || {}),
            ...formData,
        });
    }
    const matchFn = matchRule === 'AND' ? conditions.every : conditions.some;
    return matchFn.call(conditions, (condition) => {
        let formValue;
        if (otherFormData) {
            formValue = hasProp(formData, condition.key)
                ? getObjVal(formData, condition.key)
                : getObjVal(otherFormData, condition.key);
        }
        else {
            formValue = getObjVal(formData, condition.key);
        }
        const isMatch = formValueIsMatchInCondition(formValue, condition.value, {
            ...(otherFormData || {}),
            ...formData,
        });
        if (isMatch && condition.conditions) {
            return isMatchCondition(condition.conditions, condition.matchRule, formData, otherFormData);
        }
        return isMatch;
    });
}
function and(params) {
    return {
        isOpRes: true,
        result: (info) => {
            return params.reduce((prev, cur) => {
                return (isMatchCondition(cur === 'default' || cur.isOpRes ? cur : [cur], 'AND', info) && prev);
            }, true);
        },
    };
}
function or(params) {
    return {
        isOpRes: true,
        result: (info) => {
            const res = params.reduce((prev, cur) => {
                return (isMatchCondition(cur === 'default' || cur.isOpRes ? cur : [cur], 'OR', info) || prev);
            }, false);
            return res;
        },
    };
}
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
    const match = getMatchRelationResByFormData(relationInfo, pendingFormValues);
    const oldMatch = props?.oldFormValues
        ? getMatchRelationResByFormData(relationInfo, props?.oldFormValues)
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
                const valueIsEmpty = !hasProp(pendingFormValues, prop) ||
                    pendingFormValues[prop] === undefined;
                const curRelationDetail = curRelation[prop];
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
    const nextMatch = getMatchRelationResByFormData(relationInfo, newFormValues);
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
    const matchWithRecoverProp = getMatchRelationResByFormData(relationInfo, formValuesWithRecoverProp);
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

export { and, assignDeep, cmpArray, cpmNamePath, formValueIsMatchInCondition, getCondition, getFieldIsOpen, getMatchRelationResByFormData, getObjVal, getValuesFromRelation, hasProp, initRelationValue, isDisabled, isMatch, isMatchCondition, mergeRelation, optionIsDisabled, optionIsHide, or, validateFromRelationInfo };