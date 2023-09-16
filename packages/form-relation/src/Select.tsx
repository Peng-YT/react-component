/*
 * @Author: 彭越腾
 * @Date: 2021-08-18 17:55:28
 * @LastEditTime: 2023-03-20 10:12:09
 * @LastEditors: 彭越腾
 * @Description: In User Settings Edit
 * @FilePath: \admin-market\src\components\Common\RelationForm\Select.tsx
 */

import { SelectProps, Typography } from 'antd'
import { Select } from 'antd'
import type { OptionProps, SelectValue } from 'antd/es/select'
import React, { useContext, useMemo } from 'react'
import { useRelation } from './hook'
import {
    FormInstanceContext,
    getMatchRelationResByFormData,
    isDisabled,
    mergeRelation,
    NameContext,
    optionIsDisabled,
    optionIsHide,
    OtherFormDataContext,
    RelationInfoContext,
    TriggerRelationContext,
} from './Index'

function SelectComponent<VT extends SelectValue = SelectValue>({
    children,
    ...props
}: SelectProps<VT> & {
    ref?: React.Ref<any> | undefined
}) {
    const name = useContext(NameContext)
    const relationInfo = useContext(RelationInfoContext)
    const form = useContext(FormInstanceContext)
    const otherFormData = useContext(OtherFormDataContext)
    const triggerRelation = useContext(TriggerRelationContext)
    const matchController = useMemo(
        () =>
            getMatchRelationResByFormData(
                relationInfo,
                form?.getFieldsValue(true) || {},
                otherFormData,
            ),
        [relationInfo, form?.getFieldsValue(true), otherFormData],
    )
    const relationDetail = useMemo(
        () =>
            matchController.reduce((prev, cur) => {
                return mergeRelation(prev, cur.relation)
            }, {})[name],
        [matchController, name],
    )
    return (
        <Select
            {...props}
            disabled={
                triggerRelation
                    ? isDisabled(props, relationDetail)
                    : props.disabled
            }
        >
            {(children as any)
                ?.filter?.((item) => {
                    if (!item) {
                        return false
                    }
                    const isHide = triggerRelation
                        ? optionIsHide(item.props || {}, relationDetail)
                        : false
                    return !isHide
                })
                ?.map?.((item) => ({
                    ...item,
                    props: {
                        ...(item.props || {}),
                        disabled: triggerRelation
                            ? optionIsDisabled(item.props || {}, relationDetail)
                            : undefined,
                    },
                }))}
        </Select>
    )
}
const SelectR: typeof Select = Object.assign(SelectComponent, Select)
const OptionComponent: React.FC<OptionProps> = ({
    children,
    desc,
    ...props
}) => {
    const relation = useRelation(props)
    return relation.optionIsHide ? null : (
        <Select.Option {...props} disabled={relation.optionIsDisabled}>
            {desc ? (
                <div>
                    <p>{children}</p>
                    <Typography.Text type='secondary'>{desc}</Typography.Text>
                </div>
            ) : (
                children
            )}
        </Select.Option>
    )
}
const Option: typeof Select.Option = Object.assign(
    OptionComponent,
    Select.Option,
)
SelectR.Option = Option
export default SelectR
