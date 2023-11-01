
/*
 * @Author: 彭越腾
 * @Date: 2021-08-16 17:33:33
 * @LastEditTime: 2023-10-20 17:33:08
 * @LastEditors: 彭越腾
 * @Description: 能控制各个字段之间联动的表单
 * @FilePath: \admin-market\src\components\Common\RelationForm\Index.tsx
 */

import type { FormInstance, FormItemProps, FormProps } from 'antd'
import { Form } from 'antd'
import type { RuleObject } from 'antd/es/form'
import type { NamePath } from 'antd/es/form/interface'
import { FormRelationDetailType, FormRelationType, FormValidateType } from '../types/common'
import { isEmpty, isEqual } from 'lodash'
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useDebounce } from 'react-use'
import Checkbox from './Checkbox'
import Radio from './Radio'
import Select from './Select'
import Switch from './Switch'
import { assignDeep, cmpArray, cpmNamePath, getFieldIsOpen, getMatchRelationResByFormData, hasProp, initRelationValue, mergeRelation } from './util'
import { FormDataContext, FormInstanceContext, FormValidateInfoContext, NameContext, OtherFormDataContext, OtherPropsContext, RelationInfoContext, TriggerRelationContext } from './context'

const { useForm } = Form



type FormItemType = typeof Form.Item
function ItemComponent<Values = any>({
    children,
    ...props
}: FormItemProps<Values>) {
    const relationInfo = useContext(RelationInfoContext)
    // const form = useContext(FormInstanceContext)
    const formData = useContext(FormDataContext)
    const validateFormInfo = useContext(FormValidateInfoContext)
    const name = props.name || ''
    const otherFormData = useContext(OtherFormDataContext)
    const otherProps = useContext(OtherPropsContext)
    const matchController = getMatchRelationResByFormData(
        relationInfo,
        formData || {},
        otherFormData,
    )
    const allRelation = matchController.reduce((prev, cur) => {
        return {
            ...prev,
            ...cur.relation,
        }
    }, {}) as Record<string, FormRelationDetailType<any>>
    const formItemIsShow = (() => {
        if (!matchController.length) { 
            return true
        }
        const findRelationDetailFromKeyPath = (
            keyPath: (string | number)[],
        ) => {
            return Object.values<FormRelationDetailType<any>>(allRelation).find(
                (item) => {
                    return (
                        item &&
                        item.keyPath &&
                        cpmNamePath(keyPath, item.keyPath)
                    )
                },
            )
        }
        /** 判断父级属性是否关闭，如果关闭，则该属性也关闭 */
        if (Array.isArray(name)) {
            let parentIsClose = false
            name.forEach((cur, index) => {
                const keyPath = name.slice(0, index + 1)
                let parentRelation: FormRelationDetailType<any> | undefined
                if (keyPath.length === 1) {
                    parentRelation =
                        findRelationDetailFromKeyPath(keyPath) ??
                        allRelation[keyPath[0]]
                } else {
                    parentRelation = findRelationDetailFromKeyPath(keyPath)
                }
                if (!getFieldIsOpen(parentRelation)) {
                    parentIsClose = true
                }
            })
            if (parentIsClose) {
                return false
            }
        }
        const relationDetail = Array.isArray(name)
            ? findRelationDetailFromKeyPath(name)
            : allRelation[name]
        if (relationDetail === undefined || relationDetail === null) {
            return true
        }
        return getFieldIsOpen(relationDetail)
    })()
    let rulesFromContext:
        | RuleObject[]
        | ((inject: any) => RuleObject[])
        | undefined
    if (Array.isArray(name)) {
        name.reduce((prev, curName, index) => {
            const curValidateInfo = prev?.[curName]
            if (index === name.length - 1) {
                rulesFromContext = curValidateInfo?.rules
            }
            return curValidateInfo?.deeps
        }, validateFormInfo)
    } else {
        rulesFromContext = validateFormInfo?.[name]?.rules
    }
    const rules =
        props?.rules ||
        (typeof rulesFromContext === 'function'
            ? rulesFromContext(formData || {})
            : rulesFromContext)
    useEffect(() => {
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
    /** 触发表单联动后生成的新的表单值，对原字段值进行合并还是对原字段值进行覆盖 */
    changeDataType?: 'merge' | 'cover'
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
    changeDataType = 'merge',
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
    const emptyInitialVal = useMemo(() => ({}), [])
    const originFormData = formData || form.getFieldsValue(true)
    const formDataRef = useRef<{
        /** 表单数据 */
        data: Record<string, any>
        /** 用户手动最后一次修改表单的key */
        triggerKeys: NamePath
        /** 表单联动信息 */
        relationInfo: FormRelationType[]
    }>({
        data: {},
        triggerKeys: '',
        relationInfo: [],
    })

    const onChange = (effectValues: Record<string, any>) => {
        const valueHasChange = Object.keys(effectValues).some((key) => {
            return !isEqual(effectValues[key], originFormData[key])
        })
        if (valueHasChange) {
            onRelationValueChange(effectValues, true)
        }
        formDataRef.current.data =
            changeDataType === 'merge'
                ? (assignDeep(
                    {
                        ...(otherFormData || {}),
                        ...originFormData,
                    },
                    effectValues,
                    {},
                ) as Record<string, any>)
                : {
                    ...(otherFormData || {}),
                    ...originFormData,
                    ...effectValues,
                }
        formDataRef.current.relationInfo = relationInfo
    }
    /**
     * 如果表单显示出来，则把数据恢复到上一次的非空数据
     * @param visible
     * @param name
     */
    const onFormItemVisibleChange = (visible: boolean, name: NamePath) => {
        /* const prevValue = Array.isArray(name)
            ? name.reduce((prev, cur) => {
                  return prev?.[cur]
              }, formDataRef.current.data)
            : formDataRef.current.data?.[name]
        const prevIsEmpty = isEmpty(prevValue) */
        const allRelation: Record<
            string,
            FormRelationDetailType<any>
        > = relationInfo.reduce((prev, cur) => {
            return mergeRelation(prev, cur.relation)
        }, {})
        const relation = Array.isArray(name)
            ? Object.values(allRelation || {}).find((detail) => {
                return (
                    detail &&
                    detail.keyPath &&
                    cpmNamePath(detail.keyPath, name)
                )
            })
            : allRelation[name]
        const isNoRecover = relation && relation?.noRecoverValue
        if (
            !isNoRecover &&
            visible &&
            /* prevIsEmpty && */
            triggerRelation &&
            triggerResetValue &&
            hasProp(noEmptyFormData, name)
        ) {
            if (Array.isArray(name)) {
                const objVal = {}
                name.reduce((prevObj, key, index) => {
                    if (index === name.length - 1) {
                        prevObj[key] = name.reduce((prev, cur) => {
                            return prev?.[cur]
                        }, noEmptyFormData)
                    } else {
                        prevObj[key] = {}
                    }
                    return prevObj[key]
                }, objVal)
                recoverData.current.data = assignDeep(
                    recoverData.current.data,
                    objVal,
                    {},
                ) as Record<string, any>
            } else {
                recoverData.current.data[name] = noEmptyFormData[name]
            }
        }
    }
    const getEffectValues = (formData: Record<string, any>) => {
        return initRelationValue(
            relationInfo,
            formData,
            {},
            triggerResetValue,
            {
                recoverData: recoverData.current.data,
                oldFormValues: formDataRef.current.data,
                triggerChangeKey: formDataRef.current.triggerKeys,
            },
        )
    }
    const run = () => {
        const match = getMatchRelationResByFormData(relationInfo, {
            ...originFormData,
            ...(otherFormData || {}),
        })
        const oldMatch = getMatchRelationResByFormData(
            formDataRef.current.relationInfo,
            formDataRef.current.data,
        )
        /** 前后两次联动关系一样，并且没有需要恢复的数据，则无需执行联动 */
        if (cmpArray(match, oldMatch) && isEmpty(recoverData.current.data)) {
            return
        }
        const effectValues = getEffectValues({
            ...originFormData,
            ...(otherFormData || {}),
        })
        recoverData.current.data = {}
        onChange(effectValues)
        formDataRef.current.triggerKeys = ''
    }
    useEffect(() => {
        setNoEmptyFormData((prev) => {
            return {
                ...prev,
                ...Object.keys(originFormData).reduce(
                    (prevFormDataHandle, formDataProp) => {
                        const res = {
                            ...prevFormDataHandle,
                        }
                        const val = originFormData[formDataProp]
                        const noEmpty = !isEmpty(val) || val === false
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
    useEffect(() => {
        if (!props.form) {
            form.setFieldsValue(originFormData)
        }
    }, [formData])
    useDebounce(
        () => {
            if (!triggerRelation) {
                return
            }
            run()
        },
        200,
        [originFormData, otherFormData],
    )

    return (
        <Form<Values>
            colon={false}
            {...props}
            form={form}
            onFieldsChange={(fields, allFields) => {
                formDataRef.current.triggerKeys = fields?.[0]?.name
                props?.onFieldsChange?.(fields, allFields)
            }}
            onValuesChange={(val, all) => {
                const effectValues = getEffectValues(
                    assignDeep(
                        {
                            ...originFormData,
                            ...(otherFormData || {}),
                        },
                        val,
                        {},
                    ) as Record<string, any>,
                )
                props?.onValuesChange?.(
                    changeDataType === 'merge'
                        ? assignDeep(val, effectValues, {})
                        : {
                            ...val,
                            ...effectValues,
                        },
                    changeDataType === 'merge'
                        ? (assignDeep(all, effectValues, {}) as any)
                        : {
                            ...all,
                            ...effectValues,
                        },
                )
            }}
        >
            <FormValidateInfoContext.Provider value={validateFormInfo}>
                <FormDataContext.Provider value={originFormData}>
                    <FormInstanceContext.Provider value={form}>
                        <RelationInfoContext.Provider value={relationInfo}>
                            <OtherFormDataContext.Provider
                                value={otherFormData}
                            >
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
                                                    validateFormInfo,
                                                },
                                                form,
                                            )
                                            : children}
                                    </OtherPropsContext.Provider>
                                </TriggerRelationContext.Provider>
                            </OtherFormDataContext.Provider>
                        </RelationInfoContext.Provider>
                    </FormInstanceContext.Provider>
                </FormDataContext.Provider>
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
