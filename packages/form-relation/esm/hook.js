import { useContext, useMemo } from 'react';
import { NameContext, RelationInfoContext, FormInstanceContext, OtherFormDataContext } from './context.js';
import { getMatchRelationResByFormData, mergeRelation, cpmNamePath, optionIsDisabled, optionIsHide, isDisabled } from './util.js';
import 'lodash';

const useRelation = (props) => {
    const name = useContext(NameContext);
    const relationInfo = useContext(RelationInfoContext);
    const form = useContext(FormInstanceContext);
    const otherFormData = useContext(OtherFormDataContext);
    // const triggerRelation = useContext(TriggerRelationContext)
    const matchController = useMemo(() => getMatchRelationResByFormData(relationInfo, form?.getFieldsValue(true) || {}, otherFormData), [relationInfo, form?.getFieldsValue(true), otherFormData]);
    const relationDetail = useMemo(() => {
        const allRealtion = matchController.reduce((prev, cur) => {
            return mergeRelation(prev, cur.relation);
        }, {});
        if (Array.isArray(name)) {
            return Object.values(allRealtion).find(item => item && item.keyPath && cpmNamePath(item.keyPath, name));
        }
        else {
            return allRealtion[name];
        }
    }, [matchController, name]);
    return {
        optionIsDisabled: optionIsDisabled(props, relationDetail),
        optionIsHide: optionIsHide(props, relationDetail),
        isDisabled: isDisabled(props, relationDetail),
    };
};

export { useRelation };
