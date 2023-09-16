/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react-hooks/exhaustive-deps */
/*
 * @Author: 彭越腾
 * @Date: 2021-08-16 17:33:33
 * @LastEditTime: 2023-09-07 19:00:48
 * @LastEditors: 彭越腾
 * @Description: 能控制各个字段之间联动的表单
 * @FilePath: \admin-market\src\components\Common\RelationForm\Index.tsx
 */
import type { FormInstance, FormProps } from 'antd'
import { Form } from 'antd'
import { FormItemProps, RuleObject } from 'antd/es/form'
import { FormRelationDetailType, FormRelationType, FormValidateType } from 'form-relation/types/common'
import { isEqual } from 'lodash'
import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react'
import { useDebounce, useUpdateEffect } from 'react-use'
import Checkbox from './Checkbox'
import Radio from './Radio'
import Select from './Select'
import Switch from './Switch'

const { useForm } = Form

export const RelationInfoContext = createContext<FormRelationType[]>([])

export const FormInstanceContext = createContext<FormInstance | null>(null)

export const OtherFormDataContext = createContext<
    Record<string, any> | undefined | null
>(null)

export const FormValidateInfoContext = createContext<
    FormValidateType | undefined | null
>(null)

export const TriggerRelationContext = createContext<boolean>(true)

export const NameContext = createContext('')

export const OtherPropsContext = createContext<{
    onVisibleChange?: (visible: boolean, name: string) => any
}>({})

const hasProp = (obj: Record<string, any>, key) => {
    return Object.keys(obj).includes(key)
}
const isMatch = (value1, value2) => {
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
    return isMatch(formValue, conditionVal)
}

// 是否匹配到了这个条件
const isMatchCondition = (
    conditions: FormRelationType['conditions'],
    matchRule: 'OR' | 'AND' = 'AND',
    formData: Record<string, any>,
    otherFormData?: Record<string, any> | null,
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
        const isMatch = formValueIsMatchInCondition(formValue, condition.value)
        if (isMatch && condition.conditions) {
            return isMatchCondition(
                condition.conditions,
                condition.matchRule,
                formData,
                otherFormData,
            )
        }
        return isMatch
    })
}

/** 根据表单值，获取条件匹配的表单联动关系信息 */
export function getMatchRelationResByFormData<Info extends any>(
    relationInfoList: FormRelationType<Info>[],
    formData: Partial<Record<keyof Info, any>>,
    otherFormData?: Partial<Record<keyof Info, any>> | null,
) {
    return relationInfoList
        .filter((item) => {
            return isMatchCondition(
                item.conditions,
                item.matchRule,
                formData,
                otherFormData,
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
export async function validateFromRelationInfo<Info extends any>(
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

export function mergeRelation<Info extends any>(
    prevRelation: Partial<Record<keyof Info, FormRelationDetailType>>,
    nextRelation: Partial<Record<keyof Info, FormRelationDetailType>>,
): Partial<Record<keyof Info, FormRelationDetailType>> {
    const newRelation: Partial<Record<keyof Info, FormRelationDetailType>> = {}
    Object.keys(prevRelation).forEach((key) => {
        newRelation[key] = prevRelation[key]
    })
    Object.keys(nextRelation).forEach((key) => {
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
            }
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
export function getCondition<Info extends any>(
    relationInfoList: FormRelationType<Info>[],
    formData: Partial<Record<keyof Info, any>>,
): Partial<Record<keyof Info, FormRelationDetailType>> {
    return getMatchRelationResByFormData(relationInfoList, formData).reduce(
        (prev, cur) => {
            return mergeRelation(prev, cur.relation)
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
    return field !== false
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

const getValuesFromRelation = (
    relation: Record<string, FormRelationDetailType>,
    pendingFormValues: Record<string, any>,
) => {
    return Object.entries(relation).reduce((prev, cur) => {
        const [key, detail] = cur
        const curValue = pendingFormValues[key]
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
        if (
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
        } else if (detail === false) {
            newValue = undefined
        } else {
            newValue = curValue
        }
        return {
            ...prev,
            [key]: newValue,
        }
    }, {})
}
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
    const allKeys = [
        ...new Set(Object.keys(prevValues).concat(Object.keys(curValues))),
    ]
    const valueChangeKeys: string[] = []
    allKeys.forEach((key) => {
        if (prevValues[key] !== curValues[key]) {
            valueChangeKeys.push(key)
        }
    })
    return valueChangeKeys
}
/**
 * 根据表单联动关系和现有的表单值，生成一些需要变化的值
 * @param relationInfo 联动关系
 * @param pendingFormValues 即将要渲染的表单的值
 * @param prevEffectValues 上一次联动关系计算后得到的 表单变化的值
 * @param triggerChangeKeys 触发了此次更新的表单key
 * @returns 表单变化的值
 */
export function initRelationValue<Info extends any>(
    relationInfo: FormRelationType<Info>[],
    pendingFormValues: Partial<Record<keyof Info, any>>,
    prevEffectValues: Partial<Record<keyof Info, any>>,
    triggerChangeKeys: any[],
    needTriggerReset = true,
    props?: {
        noResetValuesProp?: string[]
        recoverData?: Record<string, any>
    },
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
                    const resetValueIsValid = // 没有固定值value、并且没有传入noResetValuesProp 才能使用表单联动的重置值
                        (!curRelationDetail ||
                            !hasProp(curRelationDetail, 'value')) &&
                        (!props?.noResetValuesProp ||
                            !props?.noResetValuesProp.includes(prop))
                    const needResetValueFromRelation = // 通过个联动条件判断是否需要做值得重置
                        !needResetWhenOnlyEmpty || // 不是【仅值为空时进行重置】（也就是无论是否值为空，只要条件触发了就重置）
                        (needResetWhenOnlyEmpty && valueIsEmpty) || // 值为空、并且是【仅值为空时进行重置】
                        (isDefault && valueIsEmpty) // 值为空、并且拥有默认值

                    if (
                        hasResetValueFromRelation &&
                        needResetValueFromRelation &&
                        resetValueIsValid
                    ) {
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
        allEffectRes = initRelationValue(
            relationInfo,
            newFormValues,
            allEffectRes,
            getValueChangeKeys(pendingFormValues, newFormValues),
            needTriggerReset,
            props,
        )
    }

    Object.keys(props?.recoverData || {}).forEach((recoverProp) => {
        const recoverValue = props?.recoverData?.[recoverProp]
        const curValue = pendingFormValues?.[recoverProp]

        /* 加入恢复值之后的表单数据 */
        const formValuesWithRecoverProp = {
            ...pendingFormValues,
            ...allEffectRes,
            [recoverProp]: recoverValue,
        }
        /* 加入恢复值之后的表单联动关系，用于下面计算effectValuesWithRecoverProp */
        const matchWithRecoverProp = getMatchRelationResByFormData(
            relationInfo,
            formValuesWithRecoverProp,
        )
        /* 加入恢复值之后的表单联动关系的具体值，用于下面计算effectValuesWithRecoverProp */
        const relationWithRecoverProp: Record<string, FormRelationDetailType> =
            matchWithRecoverProp.reduce((prev, cur) => {
                const curRelation: FormRelationType<any>['relation'] = {
                    ...cur.relation,
                }
                return mergeRelation(prev, curRelation)
            }, {})
        const curPropRelation = relationWithRecoverProp[recoverProp]
        const recoverValueIsValid =
            curPropRelation === undefined ||
            (curPropRelation !== false &&
                !hasProp(curPropRelation, 'value') &&
                !curPropRelation.disableOptions?.includes(recoverProp) &&
                !curPropRelation?.hideOptions?.includes(recoverProp))
        /* 加入恢复值之后 最后联动出来的表单数据 */
        const effectValuesWithRecoverProp = getValuesFromRelation(
            relationWithRecoverProp,
            formValuesWithRecoverProp,
        )
        const curValueIsEmpty = Array.isArray(curValue)
            ? !curValue.length
            : curValue === undefined || curValue === null
        /** 加入恢复值之后生成的表单数据中 triggerChangeKeys的表单值没有发生变化，才可以进行恢复：
         * triggerChangeKeys代表触发了此次表单联动的某些表单属性，
         * 因为本来就是triggerChangeKeys对应的表单触发了此次联动，反过来去修改triggerChangeKeys的表单值，会陷入一个循环，导致页面修改的东西会失效
         */
        if (
            triggerChangeKeys.every((trigger) => {
                if (!hasProp(effectValuesWithRecoverProp, trigger)) {
                    return true
                }
                return (
                    effectValuesWithRecoverProp[trigger] ===
                    formValuesWithRecoverProp[trigger]
                )
            }) &&
            recoverValueIsValid && // 恢复值是否可用
            curValueIsEmpty && // 是否为空值，为空才需要恢复
            typeof recoverValue !== 'boolean' // 布尔值不用恢复，个人感觉更加符合用户习惯，准确说是更符合投放平台的习惯？
        ) {
            allEffectRes[recoverProp] = recoverValue
        }
    })
    return allEffectRes
}
type FormItemType = typeof Form.Item
function ItemComponent<Values = any>({
    children,
    ...props
}: FormItemProps<Values>) {
    const relationInfo = useContext(RelationInfoContext)
    const form = useContext(FormInstanceContext)
    const validateFormInfo = useContext(FormValidateInfoContext)
    const name = (props.name || '') as string
    const otherFormData = useContext(OtherFormDataContext)
    const otherProps = useContext(OtherPropsContext)
    const matchController = getMatchRelationResByFormData(
        relationInfo,
        form?.getFieldsValue(true) || {},
        otherFormData,
    )
    const formItemIsShow = (() => {
        if (!matchController.length) {
            return true
        }
        const relationDetail = matchController.reduce((prev, cur) => {
            return {
                ...prev,
                ...cur.relation,
            }
        }, {})[name]
        if (relationDetail === undefined || relationDetail === null) {
            return true
        }
        return !!relationDetail
    })()
    const rulesFromContext = validateFormInfo?.[name]?.rules
    const rules =
        props?.rules ||
        (typeof rulesFromContext === 'function'
            ? rulesFromContext(form?.getFieldsValue(true) || {})
            : rulesFromContext)
    useUpdateEffect(() => {
        otherProps?.onVisibleChange?.(formItemIsShow, name)
    }, [formItemIsShow])
    return (
        <NameContext.Provider value={name}>
            {formItemIsShow ? (
                <Form.Item<Values>
                    {...props}
                    style={props.style}
                    rules={formItemIsShow ? rules : undefined}
                >
                    {children}
                </Form.Item>
            ) : null}
        </NameContext.Provider>
    )
}
const ItemR: typeof ItemComponent & Omit<FormItemType, ''> = Object.assign(
    ItemComponent,
    Form.Item,
)
interface FormRPropsType<Values = any> extends FormProps<Values> {
    relationInfo: FormRelationType[]
    onRelationValueChange: (
        effect: Record<string, any>,
        relation: boolean,
    ) => any
    formData?: Record<string, any>
    otherFormData?: Record<string, any>
    validateFormInfo?: FormValidateType
    /** 是否触发表单联动 */
    triggerRelation?: boolean
    triggerResetValue?: boolean
}
type FormType = Omit<typeof Form, 'Item'> & { Item: FormItemType }
function FormComponent<Values = any>({
    onRelationValueChange,
    relationInfo,
    children,
    triggerRelation = true,
    triggerResetValue = true,
    validateFormInfo,
    otherFormData,
    formData,
    ...props
}: FormRPropsType<Values> & {
    ref?: React.Ref<FormInstance<Values>> | undefined
}) {
    const [form] = useForm(props.form)
    /* 存储值不为空的表单数据 */
    const [noEmptyFormData, setNoEmptyFormData] = useState<Record<string, any>>(
        {},
    )
    /* 用于恢复表单上一次的非空数据 */
    const recoverData = useRef<{ data: Record<string, any> }>({
        data: {},
    })
    const originFormData = formData || form.getFieldsValue(true)
    const formDataRef = useRef<{
        data: Record<string, any>
        triggerKeys: string[]
    }>({
        data: {
            ...(props.initialValues || {}),
            ...originFormData,
            ...(otherFormData || {}),
        },
        triggerKeys: [],
    })
    // const [, triggerUpdate] = useState(`${+new Date()}`)

    const onChange = (effectValues: Record<string, any>) => {
        const { data } = formDataRef.current
        const valueHasChange = Object.keys(effectValues).some((key) => {
            return !isEqual(effectValues[key], data[key])
        })
        if (valueHasChange) {
            onRelationValueChange(effectValues, true)
        }
        formDataRef.current.data = {
            ...formDataRef.current.data,
            ...effectValues,
        }
    }
    /**
     * 如果表单显示出来，则把数据恢复到上一次的非空数据
     * @param visible
     * @param name
     */
    const onFormItemVisibleChange = (visible: boolean, name: string) => {
        const prevValue = formDataRef.current.data?.[name]
        const prevIsEmpty = Array.isArray(prevValue)
            ? !prevValue.length
            : prevValue === undefined || prevValue === null
        if (
            visible &&
            prevIsEmpty &&
            triggerRelation &&
            triggerResetValue &&
            hasProp(noEmptyFormData, name)
        ) {
            recoverData.current.data[name] = noEmptyFormData[name]
        }
    }
    const run = (triggerKeys: string[]) => {
        const { data } = formDataRef.current
        const effectValues = initRelationValue(
            relationInfo,
            data,
            {},
            triggerKeys,
            triggerResetValue,
            {
                recoverData: recoverData.current.data,
            },
        )
        recoverData.current.data = {}
        onChange(effectValues)
    }
    useEffect(() => {
        const oldFormData = formDataRef.current.data
        formDataRef.current.data = {
            ...originFormData,
            ...(otherFormData || {}),
        }
        const triggerKeys = getValueChangeKeys(
            oldFormData,
            formDataRef.current.data,
        )
        formDataRef.current.triggerKeys =
            formDataRef.current.triggerKeys.concat(triggerKeys)
        setNoEmptyFormData((prev) => {
            return {
                ...prev,
                ...Object.keys(originFormData).reduce(
                    (prevFormDataHandle, formDataProp) => {
                        const res = {
                            ...prevFormDataHandle,
                        }
                        const val = originFormData[formDataProp]
                        const noEmpty = Array.isArray(val)
                            ? !!val.length
                            : !!val
                        if (noEmpty) {
                            res[formDataProp] = val
                        }
                        return res
                    },
                    {},
                ),
            }
        })
    }, [originFormData, otherFormData])
    useDebounce(
        () => {
            if (!triggerRelation) {
                return
            }
            run(formDataRef.current.triggerKeys)
            formDataRef.current.triggerKeys = []
        },
        100,
        [originFormData, otherFormData],
    )
    return (
        <Form<Values>
            colon={false}
            {...props}
            form={form}
            // eslint-disable-next-line consistent-return
            onValuesChange={props.onValuesChange}
        >
            <FormValidateInfoContext.Provider value={validateFormInfo}>
                <FormInstanceContext.Provider value={form}>
                    <RelationInfoContext.Provider value={relationInfo}>
                        <OtherFormDataContext.Provider value={otherFormData}>
                            <TriggerRelationContext.Provider
                                value={triggerRelation}
                            >
                                <OtherPropsContext.Provider
                                    value={{
                                        onVisibleChange:
                                            onFormItemVisibleChange,
                                    }}
                                >
                                    {typeof children === 'function'
                                        ? children(
                                              {
                                                  form,
                                                  relationInfo,
                                                  otherFormData,
                                                  triggerRelation,
                                              },
                                              form,
                                          )
                                        : children}
                                </OtherPropsContext.Provider>
                            </TriggerRelationContext.Provider>
                        </OtherFormDataContext.Provider>
                    </RelationInfoContext.Provider>
                </FormInstanceContext.Provider>
            </FormValidateInfoContext.Provider>
        </Form>
    )
}

const FormR: typeof FormComponent & Omit<FormType, ''> = Object.assign(
    FormComponent,
    Form,
)
FormR.Item = ItemR
export {
    ItemR as Item,
    Checkbox,
    Radio,
    Select,
    Switch,
    FormR as Form,
}
export default FormR
