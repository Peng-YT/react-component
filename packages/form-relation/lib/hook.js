'use strict';

var context = require('./context-d4e5c342.js');
var util = require('./util-259eb911.js');
require('./_commonjsHelpers-22a5398b.js');

const useRelation = (props) => {
    const name = context.reactExports.useContext(context.NameContext);
    const relationInfo = context.reactExports.useContext(context.RelationInfoContext);
    const formData = context.reactExports.useContext(context.FormDataContext);
    const otherFormData = context.reactExports.useContext(context.OtherFormDataContext);
    // const triggerRelation = useContext(TriggerRelationContext)
    const matchController = context.reactExports.useMemo(() => util.getMatchRelationResByFormData(relationInfo, {
        ...(otherFormData || {}),
        ...(formData || {}),
    }), [relationInfo, formData, otherFormData]);
    const relationDetail = context.reactExports.useMemo(() => {
        const allRelation = matchController.reduce((prev, cur) => {
            return util.mergeRelation(prev, cur.relation);
        }, {});
        if (Array.isArray(name)) {
            return Object.values(allRelation).find(item => item && item.keyPath && util.cpmNamePath(item.keyPath, name));
        }
        else {
            return allRelation[name];
        }
    }, [matchController, name]);
    return {
        optionIsDisabled: util.optionIsDisabled(props, relationDetail),
        optionIsHide: util.optionIsHide(props, relationDetail),
        isDisabled: util.isDisabled(props, relationDetail),
    };
};

exports.useRelation = useRelation;
