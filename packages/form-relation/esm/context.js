import { createContext } from 'react';

const RelationInfoContext = createContext([]);
const FormInstanceContext = createContext(null);
const FormDataContext = createContext({});
const OtherFormDataContext = createContext(null);
const FormValidateInfoContext = createContext(null);
const TriggerRelationContext = createContext(true);
const NameContext = createContext('');
const OtherPropsContext = createContext({});

export { FormDataContext, FormInstanceContext, FormValidateInfoContext, NameContext, OtherFormDataContext, OtherPropsContext, RelationInfoContext, TriggerRelationContext };
