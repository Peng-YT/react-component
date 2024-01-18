'use strict';

var React = require('react');

const RelationInfoContext = React.createContext([]);
const FormInstanceContext = React.createContext(null);
const FormDataContext = React.createContext({});
const OtherFormDataContext = React.createContext(null);
const FormValidateInfoContext = React.createContext(null);
const TriggerRelationContext = React.createContext(true);
const NameContext = React.createContext('');
const OtherPropsContext = React.createContext({});

exports.FormDataContext = FormDataContext;
exports.FormInstanceContext = FormInstanceContext;
exports.FormValidateInfoContext = FormValidateInfoContext;
exports.NameContext = NameContext;
exports.OtherFormDataContext = OtherFormDataContext;
exports.OtherPropsContext = OtherPropsContext;
exports.RelationInfoContext = RelationInfoContext;
exports.TriggerRelationContext = TriggerRelationContext;
