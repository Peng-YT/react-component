export interface FormRelationType<Keys = any> {
    matchRule?: 'AND' | 'OR';
    controller: {
        key: keyof Keys;
        value: any | ((curVal: any) => boolean);
        valueExcludeDisableOption?: boolean;
    }[];
    relation: Partial<Record<keyof Keys, FormRelationDetailType>>;
    weight?: number;
}

export type FormRelationDetailType =
    | false
    | {
          disableOptions?: any[];
          value?: any | ((prevValue: any) => any);
          resetValue?: any;
          disabled?: boolean;
          valueExcludeDisableOption?: boolean;
          hideOptions?: any;
      };