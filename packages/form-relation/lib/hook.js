'use strict';

var React = require('react');
var context = require('./context.js');
var util = require('./util-942300a6.js');

const useRelation = (props) => {
    const name = React.useContext(context.NameContext);
    const relationInfo = React.useContext(context.RelationInfoContext);
    const formData = React.useContext(context.FormDataContext);
    const otherFormData = React.useContext(context.OtherFormDataContext);
    // const triggerRelation = useContext(TriggerRelationContext)
    const matchController = React.useMemo(() => util.getMatchRelationResByFormData(relationInfo, {
        ...(otherFormData || {}),
        ...(formData || {}),
    }), [relationInfo, formData, otherFormData]);
    const relationDetail = React.useMemo(() => {
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
