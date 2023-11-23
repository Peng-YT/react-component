import { RuleObject } from 'antd/es/form'
import { NamePath } from 'antd/es/form/interface'
import { AllRelationType, FormRelationDetailType, FormRelationOpParamType, FormRelationOpResType, FormRelationType, FormValidateType } from '../types/common'
import { isPlainObject } from 'lodash'
export const hasProp = (obj: Record<string, any>, key) => {
    if (Array.isArray(key)) {
        let has = true
        key.reduce((prev, cur) => {
            if (!Object.keys(prev || {}).includes(cur)) {
                has = false
            }
            return prev?.[cur]
        }, obj)
        return has
    } else {
        return Object.keys(obj).includes(key)
    }
}
/**
 * 合并两个对象
 * @param origin
 * @param newData
 * @param {
* mutable： 可变性，会直接修改origin里面的值
* }
* @returns
*/
export const assignDeep = (
   origin: unknown,
   newData: unknown,
   { mutable }: { mutable?: boolean },
) => {
   if (!isPlainObject(origin) || !isPlainObject(newData)) {
       return origin
   }
   const originCopy = mutable
       ? origin
       : {
             ...(origin as object),
         }
   const loopNewDataProp = (context: object, key: string, val: unknown) => {
       if (isPlainObject(val) && isPlainObject(context[key])) {
           Object.entries(val as object).forEach(([key1, val1]) => {
               loopNewDataProp(val as object, key1, val1)
               if (mutable) {
                   context[key][key1] = val1
               }
           })
           if (!mutable) {
               context[key] = { ...context[key], ...(val as object) }
           }
       } else {
           context[key] = val
       }
   }
   Object.entries(newData as object).forEach(([key, val]) => {
       loopNewDataProp(originCopy as object, key, val)
   })
   return originCopy
}
export const getObjVal = (obj: Record<string, any>, key) => {
    if (Array.isArray(key)) {
        return key.reduce((prev, cur) => {
            return prev?.[cur]
        }, obj)
    } else {
        return obj[key]
    }
}
export const isMatch = (value1, value2) => {
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
export const formValueIsMatchInCondition = (formValue, conditionVal, formData, { prevVal, prevFormData }) => {
    if (typeof conditionVal === 'function') {
        return conditionVal(formValue, formData, {
            prevVal,
            prevFormData,
        })
    }
    return isMatch(formValue, conditionVal)
}

// 是否匹配到了这个条件
export function isMatchCondition<Info>(
    conditions: FormRelationType<Info>['conditions'],
    matchRule: 'OR' | 'AND' = 'AND',
    formData: Info,
    props: {
        oldFormData: Info
    },
): boolean {
    if (conditions === 'default') {
        return true
    }
    if (!Array.isArray(conditions)) {
        return conditions.result(
            {
                ...formData,
            },
            props.oldFormData,
        )
    }
    const matchFn = matchRule === 'AND' ? conditions.every : conditions.some
    return matchFn.call(conditions, (condition) => {
        const formValue = getObjVal(formData, condition.key)
        const prevFormValue = getObjVal(props.oldFormData, condition.key)
        const isMatch = formValueIsMatchInCondition(
            formValue,
            condition.value,
            {
                ...formData,
            },
            {
                prevFormData: props.oldFormData,
                prevVal: prevFormValue,
            },
        )
        if (isMatch && condition.conditions) {
            return isMatchCondition<Info>(
                condition.conditions,
                condition.matchRule,
                formData,
                props,
            )
        }
        return isMatch
    })
}
export function and<Info extends any>(
    params: FormRelationOpParamType<Info>,
): FormRelationOpResType<Info> {
    return {
        isOpRes: true,
        result: (info: Info, prevInfo: Info) => {
            return params.reduce((prev, cur) => {
                return (
                    isMatchCondition<Info>(
                        cur === 'default' || cur.isOpRes ? cur : [cur],
                        'AND',
                        info,
                        {
                            oldFormData: prevInfo,
                        },
                    ) && prev
                )
            }, true)
        },
    }
}
export function or<Info extends any>(
    params: FormRelationOpParamType<Info>,
): FormRelationOpResType<Info> {
    return {
        isOpRes: true,
        result: (info: Info,  prevInfo: Info) => {
            const res = params.reduce((prev, cur) => {
                return (
                    isMatchCondition<Info>(
                        cur === 'default' || cur.isOpRes ? cur : [cur],
                        'OR',
                        info,
                        {
                            oldFormData: prevInfo,
                        },
                    ) || prev
                )
            }, false)
            return res
        },
    }
}
/** 根据表单值，获取条件匹配的表单联动关系信息 */
export function getMatchRelationResByFormData<Info extends object>(
    relationInfoList: FormRelationType<Info>[],
    formData: Info,
    props?: {
        oldFormData?: Info
    },
) {
    return relationInfoList
        .filter((item) => {
            return isMatchCondition<Info>(
                item.conditions,
                item.matchRule,
                formData,
                {
                    oldFormData: props?.oldFormData || {} as Info,
                }
            )
        })
        .sort((a, b) => (a.weight || 0) - (b.weight || 0))
}

/**
 *
 * @param relationInfo 表单联动配置
 * @param formValue 表单校验依赖的数据，需要传入哪些数据，根据传入的relationInfo的类型决定 如果relationInfo的ts类型为 FormRelationType(Dep)[]  那么formValue就需要传入Dep类型的数据
 * @param validateInfo 校验配置
 * @returns
 */
export async function validateFromRelationInfo<Info extends object>(
    relationInfo: FormRelationType<Info>[],
    props: {
        formValue: Partial<Info>
        validateInfo: FormValidateType
    },
) {
    const errors: {
        errorMsg?: string
    }[] = []
    const condition = getCondition(
        relationInfo, // 传入联动配置
        props.formValue,
    )
    const handler = async (
        validateInfo:
            | {
                rules?: RuleObject[] | ((inject) => RuleObject[])
                deeps?: FormValidateType
            }
            | undefined,
        value: any,
    ) => {
        const rulesOrigin = validateInfo?.rules
        const rules =
            typeof rulesOrigin === 'function'
                ? rulesOrigin(props.formValue)
                : rulesOrigin
        await Promise.allSettled(
            Object.entries(validateInfo?.deeps || {}).map(
                async ([prop, info]) => {
                    await handler(info, value?.[prop])
                },
            ),
        )
        await Promise.allSettled(
            rules?.map(async (rule) => {
                const empty = Array.isArray(value)
                    ? !value.length
                    : !value && value !== false
                if (rule.validator) {
                    try {
                        await rule.validator(rule, value, (err) => {
                            errors.push({
                                errorMsg: err,
                            })
                        })
                    } catch (error: any) {
                        errors.push({
                            errorMsg: error.message,
                        })
                    }
                    return
                }
                if (
                    (value && rule.pattern && !rule.pattern.test(value)) ||
                    (empty && rule.required)
                ) {
                    errors.push({
                        errorMsg:
                            typeof rule.message === 'string'
                                ? rule.message
                                : '',
                    })
                    return
                }
            }) || [],
        )
    }
    await Promise.allSettled(
        Object.entries(props.validateInfo || {}).map(
            async ([prop, validateInfo]) => {
                const relationInfo = condition[prop]
                if (!getFieldIsOpen(relationInfo)) {
                    return
                }

                const value = props.formValue[prop]
                await handler(validateInfo, value)
            },
        ),
    )
    return errors
}

/**
 * 某个选项是否被禁用
 * @param props
 * @param relationDetail
 */
export const optionIsDisabled = (
    props: Record<string, any>,
    relationDetail: FormRelationDetailType,
    optionsValueProp?: string,
) => {
    const optionValue = optionsValueProp ? props[optionsValueProp] : props.value
    if (
        relationDetail &&
        relationDetail.disableOptions?.includes(optionValue)
    ) {
        return true
    }
    return props.disabled
}

/**
 * 某个选项是否被隐藏
 * @param props
 * @param relationDetail
 */
export const optionIsHide = (
    props: Record<string, any>,
    relationDetail: FormRelationDetailType,
    optionsValueProp?: string,
) => {
    const optionValue = optionsValueProp ? props[optionsValueProp] : props.value
    if (relationDetail && relationDetail.hideOptions) {
        return relationDetail.hideOptions.includes(optionValue)
    }
    return false
}

/** 表单是否被禁用 */
export const isDisabled = (
    props: Record<string, any>,
    relationDetail: FormRelationDetailType,
) => {
    if (relationDetail && relationDetail.disabled) {
        return true
    }
    return props.disabled
}

export function mergeRelation<Info extends object>(
    prevRelation: AllRelationType<Info>,
    nextRelation: AllRelationType<Info>,
): AllRelationType<Info> {
    const newRelation: AllRelationType<Info> = {}
    Object.keys(prevRelation).forEach((key: keyof Info | string) => {
        newRelation[key] = prevRelation[key]
    })
    Object.keys(nextRelation).forEach((key: keyof Info | string) => {
        const prevRelationItemInfo = newRelation[key]
        const nextRelationItemInfo = nextRelation[key]
        if (prevRelationItemInfo && nextRelationItemInfo) {
            const prevDisableOptions = prevRelationItemInfo.disableOptions
            const nextDisableOptions = nextRelationItemInfo.disableOptions
            let disableOptions
            if (prevDisableOptions || nextDisableOptions) {
                disableOptions = [
                    ...(prevDisableOptions || []),
                    ...(nextDisableOptions || []),
                ]
            }
            const prevHideOptions = prevRelationItemInfo.hideOptions
            const nextHideOptions = nextRelationItemInfo.hideOptions
            let hideOptions
            if (prevHideOptions || nextHideOptions) {
                hideOptions = [
                    ...(prevHideOptions || []),
                    ...(nextHideOptions || []),
                ]
            }
            newRelation[key] = {
                ...newRelation[key],
                ...nextRelation[key],
                disableOptions,
                hideOptions,
            } as any
        } else {
            newRelation[key] = nextRelation[key]
        }
    })
    return newRelation
}

/**
 * 获取表单字段联动后的信息
 * @param relationInfoList 表单联动配置
 * @param formData 表单校验依赖的数据，需要传入哪些数据，根据传入的relationInfoList的类型决定 如果relationInfoList的ts类型为 FormRelationTypeFormRelationType(Dep)[]  那么formData就需要传入Dep类型的数据
 * @returns
 */
export function getCondition<Info extends object>(
    relationInfoList: FormRelationType<Info>[],
    formData: Info,
    props?: {
        oldFormData?: Info
    },
): Partial<Record<keyof Info, FormRelationDetailType>> {
    return getMatchRelationResByFormData<Info>(relationInfoList, formData, {
        oldFormData: props?.oldFormData || {} as Info,
    }).reduce(
        (prev, cur) => {
            return mergeRelation<Info>(prev, cur.relation)
        },
        {},
    )
}
/**
 * 在表单联动的影响下 该字段是否可设置
 * @param field
 * @returns
 */
export const getFieldIsOpen = (field?: FormRelationDetailType) => {
    return field !== false && !field?.close
}
const getHandleValue = (
    curValue,
    disableOptions?: string[],
    excludeDisableOption = true,
) => {
    if (!excludeDisableOption) {
        return curValue
    }
    if (!disableOptions || !disableOptions.length) {
        return curValue
    }
    if (Array.isArray(curValue)) {
        return curValue.filter((item) => {
            return !disableOptions.includes(item)
        })
    }
    if (disableOptions.includes(curValue)) {
        return undefined
    }
    return curValue
}

export function getValuesFromRelation<Info>(
    relation: AllRelationType<Info>,
    pendingFormValues: Record<string, any>,
) {
    return Object.entries(relation).reduce((prev, cur) => {
        const [key, detail] = cur
        const isClose = detail === false || detail.close
        const curValue =
            detail && detail.keyPath
                ? getObjVal(pendingFormValues, detail.keyPath)
                : pendingFormValues[key]
        let newValue
        const curValueUnable =
            curValue === undefined ||
            (detail && detail.disableOptions?.includes(curValue)) ||
            (detail && detail.hideOptions?.includes(curValue)) ||
            curValue?.some?.(
                (item) => detail && detail.disableOptions?.includes(item),
            ) ||
            curValue?.some?.(
                (item) => detail && detail.hideOptions?.includes(item),
            )
        if (isClose) {
            newValue =
                detail && hasProp(detail, 'closeValue')
                    ? detail.closeValue
                    : undefined
        } else if (
            curValueUnable &&
            detail &&
            hasProp(detail, 'resetValue') &&
            !hasProp(detail, 'value')
        ) {
            newValue = getHandleValue(
                detail.resetValue,
                [
                    ...(detail.disableOptions || []),
                    ...(detail.hideOptions || []),
                ],
                detail.valueExcludeDisableOption,
            )
        } else if (detail && hasProp(detail, 'value')) {
            if (typeof detail.value === 'function') {
                newValue = getHandleValue(
                    detail.value(curValue),
                    [
                        ...(detail.disableOptions || []),
                        ...(detail.hideOptions || []),
                    ],
                    detail.valueExcludeDisableOption,
                )
            } else {
                newValue = getHandleValue(
                    detail.value,
                    [
                        ...(detail.disableOptions || []),
                        ...(detail.hideOptions || []),
                    ],
                    detail.valueExcludeDisableOption,
                )
            }
        } else {
            newValue = curValue
        }
        let objVal = {}
        if (detail && detail.keyPath?.length) {
            ; (detail.keyPath as string[]).reduce((prevObj, key, index) => {
                if (index === (detail.keyPath?.length || 0) - 1) {
                    prevObj[key] = newValue
                } else {
                    prevObj[key] = {}
                }
                return prevObj[key]
            }, objVal)
        } else {
            objVal = {
                [key]: newValue,
            }
        }
        return assignDeep(prev, objVal, {}) as Record<string, any>
    }, {})
}
export const cpmNamePath = (name1: any[], name2: any[]) => {
    if (name1.length !== name2.length) {
        return false
    }
    return name1.every((item, index) => {
        return item === name2[index]
    })
}
export const cmpArray = (
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
export function initRelationValue<Info extends object>(
    relationInfo: FormRelationType<Info>[],
    pendingFormValues: Info,
    prevEffectValues: Partial<Record<keyof Info, any>>,
    needTriggerReset = true,
    props?: {
        recoverData?: Record<string, any>
        oldFormValues?: Info
        triggerChangeKey?: NamePath
    },
): Partial<Record<keyof Info, any>> {
    const match = getMatchRelationResByFormData<Info>(relationInfo, pendingFormValues, {
        oldFormData: props?.oldFormValues || {} as Info,
    },)
    const oldMatch = props?.oldFormValues
        ? getMatchRelationResByFormData<Info>(relationInfo, props?.oldFormValues, {
            oldFormData: props?.oldFormValues || {} as Info,
        },)
        : undefined

    const relation: AllRelationType<Info> = match.reduce(
        (prev, cur) => {
            /** 该条件是默认触发的，或者旧的表单没有满足该条件，但新的表单满足了该条件，则证明该条件是新达成的 */
            const isDefaultOrNewCondition =
                cur.conditions === 'default' ||
                (oldMatch && !oldMatch.find((old) => old === cur))
            const isDefault = cur.conditions === 'default'
            const curRelation: AllRelationType<Info> = {
                ...cur.relation,
            }
            /** 如果该条件是默认条件或者是新达成的条件，则该条件所关联的表单字段需要进行值重置 */
            if (isDefaultOrNewCondition && needTriggerReset) {
                // eslint-disable-next-line no-restricted-syntax, guard-for-in
                for (const prop in curRelation) {
                    const valueIsEmpty =
                        !hasProp(pendingFormValues, prop) ||
                        pendingFormValues[prop] === undefined
                    const curRelationDetail = curRelation[prop]
                    const needResetWhenOnlyEmpty = // 仅值为空时才进行值的重置
                        curRelationDetail === false ||
                        (curRelationDetail?.needResetWhenOnlyEmpty ?? true)

                    const hasResetValueFromRelation = // 通过表单联动判断 该属性是否有重置值
                        curRelationDetail &&
                        hasProp(curRelationDetail, 'resetValue')
                    const resetValueIsValid = // 没有固定值value、才能使用表单联动的重置值
                        !curRelationDetail ||
                        !hasProp(curRelationDetail, 'value')
                    const needResetValueFromRelation = // 通过个联动条件判断是否需要做值得重置
                        !needResetWhenOnlyEmpty || // 不是【仅值为空时进行重置】（也就是无论是否值为空，只要条件触发了就重置）
                        (needResetWhenOnlyEmpty && valueIsEmpty) || // 值为空、并且是【仅值为空时进行重置】
                        (isDefault && valueIsEmpty) // 值为空、并且是默认条件
                    if (
                        hasResetValueFromRelation &&
                        needResetValueFromRelation &&
                        resetValueIsValid
                    ) {
                        curRelation[prop as keyof Info | string] = {
                            ...curRelationDetail,
                            value: curRelationDetail.resetValue,
                        } as any
                    }
                }
            }
            return mergeRelation(prev, curRelation)
        },
        {},
    )
    const effectValues = getValuesFromRelation(relation, pendingFormValues)
    const newFormValues = assignDeep(
        pendingFormValues,
        effectValues,
        {},
    ) as Partial<Record<keyof Info, any>>

    const nextMatch = getMatchRelationResByFormData(relationInfo, newFormValues, {
        oldFormData: props?.oldFormValues || {},
    })
    const equalMatch = cmpArray(match, nextMatch)
    let allEffectRes = assignDeep(
        prevEffectValues,
        effectValues,
        {},
    ) as Partial<Record<keyof Info, any>>
    if (!equalMatch) {
        allEffectRes = initRelationValue(
            relationInfo,
            newFormValues,
            allEffectRes,
            needTriggerReset,
            props,
        )
    }

    /** 未加入恢复值之前的表单数据 */
    const finalResBeforeRecoverProp = assignDeep(
        pendingFormValues,
        allEffectRes,
        {},
    ) as Partial<Record<keyof Info, any>>

    /* 加入恢复值之后的表单数据 */
    const formValuesWithRecoverProp = assignDeep(
        finalResBeforeRecoverProp,
        props?.recoverData || {},
        {},
    ) as Partial<Record<keyof Info, any>>
    /* 加入恢复值之后的表单联动关系，用于下面计算effectValuesWithRecoverProp */
    const matchWithRecoverProp = getMatchRelationResByFormData(
        relationInfo,
        formValuesWithRecoverProp,
        {
            oldFormData: props?.oldFormValues || {},
        },
    )
    /* 加入恢复值之后的表单联动关系的具体值，用于下面计算effectValuesWithRecoverProp */
    const relationWithRecoverProp: AllRelationType<Info> =
        matchWithRecoverProp.reduce((prev, cur) => {
            const curRelation = {
                ...cur.relation,
            }
            return mergeRelation<Info>(prev, curRelation)
        }, {})
    /* 加入恢复值之后 最后联动出来的表单数据 */
    const effectValuesWithRecoverProp = getValuesFromRelation(
        relationWithRecoverProp,
        formValuesWithRecoverProp,
    )
    /** 加入恢复值之后最终的表单数据结果 */
    const finalResWithRecoverProp = assignDeep(
        formValuesWithRecoverProp,
        effectValuesWithRecoverProp,
        {},
    ) as Partial<Record<keyof Info, any>>
    if (props?.triggerChangeKey) {
        /**
         * 加入恢复值之后生成的表单数据中 前后triggerChangeKey的表单值没有发生变化，才可以进行恢复：
         * triggerChangeKey代表触发了此次表单联动的某些表单控件的key，
         * 因为本来就是triggerChangeKeys对应的表单触发了此次联动，反过来去修改triggerChangeKeys的表单值，会陷入一个循环，导致页面修改的东西会失效
         */
        if (
            getObjVal(finalResBeforeRecoverProp, props?.triggerChangeKey) ===
            getObjVal(finalResWithRecoverProp, props?.triggerChangeKey)
        ) {
            return assignDeep(
                allEffectRes,
                assignDeep(
                    props?.recoverData || {},
                    effectValuesWithRecoverProp,
                    {},
                ),
                {},
            ) as Partial<Record<keyof Info, any>>
        } else {
            return allEffectRes
        }
    } else {
        return assignDeep(
            allEffectRes,
            assignDeep(
                props?.recoverData || {},
                effectValuesWithRecoverProp,
                {},
            ),
            {},
        ) as Partial<Record<keyof Info, any>>
    }
}