/// <reference types="react" />
import { FormInstance } from "antd";
import { NamePath } from "antd/es/form/interface";
import { FormRelationType } from "./types";
export declare const RelationInfoContext: import("react").Context<FormRelationType<any>[]>;
export declare const FormInstanceContext: import("react").Context<FormInstance<any>>;
export declare const FormDataContext: import("react").Context<Record<string, any>>;
export declare const OtherFormDataContext: import("react").Context<Record<string, any>>;
export declare const FormValidateInfoContext: import("react").Context<{
    [x: string]: {
        rules?: import("rc-field-form/lib/interface").RuleObject[] | ((inject: any) => import("rc-field-form/lib/interface").RuleObject[]);
        deeps?: any;
    };
}>;
export declare const TriggerRelationContext: import("react").Context<boolean>;
export declare const NameContext: import("react").Context<any>;
export declare const OtherPropsContext: import("react").Context<{
    onVisibleChange?: (visible: boolean, name: NamePath) => any;
}>;
