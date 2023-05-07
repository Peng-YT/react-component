type FormRelationControllerType<Keys = any> =
    | {
          key: keyof Keys
          value: any | ((curVal: any) => boolean)
          conditions?: FormRelationControllerType<Keys>
          matchRule?: 'AND' | 'OR'
      }[]
    | 'default'

interface FormRelationType<Keys = any> {
    matchRule?: 'AND' | 'OR'
    conditions: FormRelationControllerType<Keys>
    relation: Partial<Record<keyof Keys, FormRelationDetailType>>
    weight?: number
}

export type FormRelationDetailType =
    | false
    | {
          disableOptions?: any[];
          value?: any | ((prevValue: any) => any);
          resetValue?: any;
          disabled?: boolean;
          valueExcludeDisableOption?: boolean;
          needResetWhenOnlyEmpty?: boolean
          hideOptions?: any;
      };