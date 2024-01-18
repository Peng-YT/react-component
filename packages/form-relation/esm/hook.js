import { useContext, useMemo } from 'react';
import { NameContext, RelationInfoContext, FormDataContext, OtherFormDataContext } from './context.js';
import { getMatchRelationResByFormData, mergeRelation, cpmNamePath, optionIsDisabled, optionIsHide, isDisabled } from './util.js';
import 'lodash';

const useRelation = (props) => {
    const name = useContext(NameContext);
    const relationInfo = useContext(RelationInfoContext);
    const formData = useContext(FormDataContext);
    const otherFormData = useContext(OtherFormDataContext);
    // const triggerRelation = useContext(TriggerRelationContext)
    const matchController = useMemo(() => getMatchRelationResByFormData(relationInfo, {
        ...(otherFormData || {}),
        ...(formData || {}),
    }), [relationInfo, formData, otherFormData]);
    const relationDetail = useMemo(() => {
        const allRelation = matchController.reduce((prev, cur) => {
            return mergeRelation(prev, cur.relation);
        }, {});
        if (Array.isArray(name)) {
            return Object.values(allRelation).find(item => item && item.keyPath && cpmNamePath(item.keyPath, name));
        }
        else {
            return allRelation[name];
        }
    }, [matchController, name]);
    return {
        optionIsDisabled: optionIsDisabled(props, relationDetail),
        optionIsHide: optionIsHide(props, relationDetail),
        isDisabled: isDisabled(props, relationDetail),
    };
};

export { useRelation };
