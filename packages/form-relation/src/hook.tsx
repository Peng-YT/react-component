/*
 * @Author: your name
 * @Date: 2021-11-26 15:56:44
 * @LastEditTime: 2021-11-26 16:03:33
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */
import { useContext } from 'react';
import {
    optionIsDisabled,
    isDisabled,
    RelationInfoContext,
    getMatchRelationResByFormData,
    NameContext,
    FormInstanceContext,
    mergeRelation,
    OtherFormDataContext,
    optionIsHide,
    TriggerRelationContext,
} from '.';
import { useMemo } from 'react';

export const useRelation = (props: Record<string, any>) => {
    const name = useContext(NameContext);
    const relationInfo = useContext(RelationInfoContext);
    const form = useContext(FormInstanceContext);
    const otherFormData = useContext(OtherFormDataContext);
    const triggerRelation = useContext(TriggerRelationContext);
    const matchController = useMemo(
        () => getMatchRelationResByFormData(relationInfo, form?.getFieldsValue(true) || {}, otherFormData),
        [relationInfo, form?.getFieldsValue(true), otherFormData],
    );
    const relationDetail = useMemo(
        () =>
            matchController.reduce((prev, cur) => {
                return mergeRelation(prev, cur.relation);
            }, {})[name],
        [matchController, name],
    );
    return {
        optionIsDisabled: triggerRelation ? optionIsDisabled(props, relationDetail) : props.disabled,
        optionIsHide: triggerRelation ? optionIsHide(props, relationDetail) : undefined,
        isDisabled: triggerRelation ? isDisabled(props, relationDetail) : props.disabled,
    };
};
