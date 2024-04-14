import { RuleObject } from "antd/es/form"

/*
 * @Author: 彭越腾
 * @Date: 2023-11-23 11:07:15
 * @LastEditors: 彭越腾
 * @LastEditTime: 2023-11-23 13:31:31
 * @FilePath: \react-component\packages\form-relation\types\common.d.ts
 * @Description: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export type ArrayItemType<ArrayType> = ArrayType extends Array<infer T> ? T : any
type KeyPath<Info = any> = string[]
export type FormRelationControllerType<Info = any> =
    | {
        key: keyof Info | KeyPath<Info>
        value:
              | string
              | number
              | Array<any>
              | object
              | ((
                    curVal: any,
                    formData: Info,
                    props: {
                        prevVal: any
                        prevFormData: Info
                    },
                ) => boolean)
        conditions?: FormRelationControllerType<Info>
        matchRule?: 'AND' | 'OR'
        readonly isOpRes?: false
    }[]
    | 'default'
export type AllRelationType<Info = any> = Partial<
    {
        [P in keyof Info]: FormRelationDetailType<Info>
    } & {
        [prop: string]: FormRelationDetailType<Info>
    }
>

export interface FormRelationType<Info = any> {
    /** 联动的条件conditions数组里面的多个条件是采用AND还是OR关系 */
    matchRule?: 'AND' | 'OR'
    /** 触发该联动的条件 */
    conditions: FormRelationControllerType<Info> | FormRelationOpResType<Info>
    /** 联动关系 */
    relation: AllRelationType<Info>
    /** 该联动条件的权重 */
    weight?: number
}

export type FormRelationDetailType<Info = any> =
    | /** 触发此联动后，该表单是不可用，（表单值会被设置为undefined） */
    false
    | {
        /** 触发此联动后，该表单禁用的选项 */
        disableOptions?: any[]
        /** 触发此联动后，将表单固定死为该值 */
        value?: any | ((prevValue: any) => any)
        /** 触发此联动后，将表单重置为该值 */
        resetValue?: any
        /** 和resetValue配合使用，触发此联动后，仅在该表单的值为空时才进行resetValue重置 */
        needResetWhenOnlyEmpty?: boolean
        /** 触发此联动后，该表单禁用 */
        disabled?: boolean
        /** 触发此联动后，该表单的值是否要排除掉禁用项（该表单值不能是disableOptions选项里面值） 默认值true */
        valueExcludeDisableOption?: boolean
        /** 触发此联动后，该表单隐藏的选项 */
        hideOptions?: any
        /** 该表单的属性路径 */
        keyPath?: KeyPath<Info>
        /** 触发此联动后，该表单是否不可用，（表单值会被设置为undefined） */
        close?: boolean
        /** 和close配合使用，该表单不可用时，表单值会被设置为closeValue （默认是undefined）*/
        closeValue?: any
        /** 当该表单从不可用变为可用时，不需要恢复上一次的值 */
        noRecoverValue?: boolean
    }
export interface FormRelationOpResType<Info = any> {
    result: (info: Info, prevInfo: Info) => boolean
    isOpRes: true
}
export type FormRelationOpParamType<Info = any> = (
    | FormRelationOpResType<Info>
    | ArrayItemType<FormRelationControllerType<Info>>
)[]
export type FormValidateType<FormValue = any> = FormValue extends any[]
    ? undefined
    : FormValue extends Record<string, any>
    ? {
        [P in keyof FormValue]?: {
            rules?: RuleObject[] | ((inject: FormValue) => RuleObject[])
            deeps?: FormValidateType<FormValue[P]>
        }
    }
    : undefined