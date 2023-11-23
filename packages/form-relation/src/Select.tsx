
/*
 * @Author: 彭越腾
 * @Date: 2021-08-18 17:55:28
 * @LastEditTime: 2023-11-23 13:44:25
 * @LastEditors: 彭越腾
 * @Description: In User Settings Edit
 * @FilePath: \react-component\packages\form-relation\src\Select.tsx
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
import { cpmNamePath, getMatchRelationResByFormData, mergeRelation, optionIsDisabled, optionIsHide } from './util'
import { isDisabled } from './util';
import { AllRelationType } from 'form-relation/types/common'

function SelectComponent<VT extends SelectValue = SelectValue>({
    children,
    ...props
}: SelectProps<VT> & {
    ref?: React.Ref<any> | undefined
}) {
    const name = useContext(NameContext)
    const relationInfo = useContext(RelationInfoContext)
    // const form = useContext(FormInstanceContext)
    const formData = useContext(FormDataContext)
    const otherFormData = useContext(OtherFormDataContext)
    const triggerRelation = useContext(TriggerRelationContext)
    const matchController = useMemo(
        () =>
            getMatchRelationResByFormData(
                relationInfo,
                {
                    ...(formData || {}),
                    ...(otherFormData || {}),
                },
            ),
        [relationInfo, formData, otherFormData],
    )
    const relationDetail = useMemo(
        () => {
            const allRelation: AllRelationType = matchController.reduce((prev, cur) => {
                return mergeRelation(prev, cur.relation)
            }, {})
            if (Array.isArray(name)) {
                return Object.values(allRelation).find(item => item && item.keyPath && cpmNamePath(item.keyPath, name))
            } else {
                return allRelation[name]
            }
        },
        [matchController, name],
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

