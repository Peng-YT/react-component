/*
 * @Author: your name
 * @Date: 2021-11-26 15:56:44
 * @LastEditTime: 2023-11-23 13:43:53
 * @LastEditors: 彭越腾
 * @Description: In User Settings Edit
 * @FilePath: \react-component\packages\form-relation\src\hook.tsx
 */
import { AllRelationType } from './types'
import { useContext, useMemo } from 'react'
import {
    FormDataContext,
    FormInstanceContext,
    NameContext,
    OtherFormDataContext,
    RelationInfoContext,
} from './context'
import { getMatchRelationResByFormData, isDisabled, mergeRelation, optionIsDisabled, optionIsHide } from './util'
import { cpmNamePath } from './util';

export const useRelation = (props: Record<string, any>) => {
    const name = useContext(NameContext)
    const relationInfo = useContext(RelationInfoContext)
    const formData = useContext(FormDataContext)
    const otherFormData = useContext(OtherFormDataContext)
    // const triggerRelation = useContext(TriggerRelationContext)
    const matchController = useMemo(
        () =>
            getMatchRelationResByFormData(
                relationInfo,
                {
                    ...(otherFormData || {}),
                    ...(formData || {}),
                }
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
    return {
        optionIsDisabled: optionIsDisabled(props, relationDetail),
        optionIsHide: optionIsHide(props, relationDetail),
        isDisabled: isDisabled(props, relationDetail),
    }
}
