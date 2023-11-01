
/*
 * @Author: 彭越腾
 * @Date: 2021-08-18 17:55:28
 * @LastEditTime: 2023-10-19 16:31:11
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
    FormDataContext,
    NameContext,
    OtherFormDataContext,
    RelationInfoContext,
    TriggerRelationContext,
} from './context'
import { getMatchRelationResByFormData, mergeRelation, optionIsDisabled, optionIsHide } from './util'
import { isDisabled } from './util';

function SelectComponent<VT extends SelectValue = SelectValue>({
    children,
    ...props
}: SelectProps<VT> & {
    ref?: React.Ref<any> | undefined
}) {
    const name = useContext(NameContext)
    const prop = Array.isArray(name) ? name[name.length - 1] : name
    const relationInfo = useContext(RelationInfoContext)
    // const form = useContext(FormInstanceContext)
    const formData = useContext(FormDataContext)
    const otherFormData = useContext(OtherFormDataContext)
    const triggerRelation = useContext(TriggerRelationContext)
    const matchController = useMemo(
        () =>
            getMatchRelationResByFormData(
                relationInfo,
                formData || {},
                otherFormData,
            ),
        [relationInfo, formData, otherFormData],
    )
    const relationDetail = useMemo(
        () =>
            matchController.reduce((prev, cur) => {
                return mergeRelation(prev, cur.relation)
            }, {})[prop],
        [matchController, prop],
    )
    const filterChildren = (children?: any) => {
        return children
            ?.filter?.((item) => {
                if (!item) {
                    return false
                }
                const isHide = optionIsHide(item.props || {}, relationDetail)
                return !isHide
            })
            ?.map?.((item) => ({
                ...item,
                props: {
                    ...(item.props || {}),
                    disabled: optionIsDisabled(
                        item.props || {},
                        relationDetail,
                    ),
                    children:
                        item.type === Select.OptGroup
                            ? filterChildren(item.props?.children)
                            : item.props?.children,
                },
            }))
    }
    return (
        <Select {...props} disabled={isDisabled(props, relationDetail)}>
            {filterChildren(children as any)}
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

