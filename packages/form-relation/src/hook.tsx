/*
 * @Author: your name
 * @Date: 2021-11-26 15:56:44
 * @LastEditTime: 2023-05-12 14:58:25
 * @LastEditors: 彭越腾
 * @Description: In User Settings Edit
 * @FilePath: \admin-market\src\components\Common\RelationForm\hook.tsx
 */
import { useContext, useMemo } from 'react'
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
} from './Index'

export const useRelation = (props: Record<string, any>) => {
    const name = useContext(NameContext)
    const relationInfo = useContext(RelationInfoContext)
    const form = useContext(FormInstanceContext)
    const otherFormData = useContext(OtherFormDataContext)
    // const triggerRelation = useContext(TriggerRelationContext)
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
    return {
        optionIsDisabled: optionIsDisabled(props, relationDetail),
        optionIsHide: optionIsHide(props, relationDetail),
        isDisabled: isDisabled(props, relationDetail),
    }
}
