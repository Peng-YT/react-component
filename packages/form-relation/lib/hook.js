'use strict';

var context = require('./context-d4e5c342.js');
var util = require('./util-848317dc.js');
require('./_commonjsHelpers-22a5398b.js');

const useRelation = (props) => {
    const name = context.reactExports.useContext(context.NameContext);
    const relationInfo = context.reactExports.useContext(context.RelationInfoContext);
    const form = context.reactExports.useContext(context.FormInstanceContext);
    const otherFormData = context.reactExports.useContext(context.OtherFormDataContext);
    // const triggerRelation = useContext(TriggerRelationContext)
    const matchController = context.reactExports.useMemo(() => util.getMatchRelationResByFormData(relationInfo, form?.getFieldsValue(true) || {}, otherFormData), [relationInfo, form?.getFieldsValue(true), otherFormData]);
    const relationDetail = context.reactExports.useMemo(() => {
        const allRealtion = matchController.reduce((prev, cur) => {
            return util.mergeRelation(prev, cur.relation);
        }, {});
        if (Array.isArray(name)) {
            return Object.values(allRealtion).find(item => item && item.keyPath && util.cpmNamePath(item.keyPath, name));
        }
        else {
            return allRealtion[name];
        }
    }, [matchController, name]);
    return {
        optionIsDisabled: util.optionIsDisabled(props, relationDetail),
        optionIsHide: util.optionIsHide(props, relationDetail),
        isDisabled: util.isDisabled(props, relationDetail),
    };
};

exports.useRelation = useRelation;
