import { FormInstance } from "antd"
import { NamePath } from "antd/es/form/interface"
import { FormRelationType, FormValidateType } from "./types"
import { createContext } from "react"

export const RelationInfoContext = createContext<FormRelationType[]>([])

export const FormInstanceContext = createContext<FormInstance | null>(null)

export const FormDataContext = createContext<Record<string, any> | null>({})

export const OtherFormDataContext = createContext<
    Record<string, any> | undefined | null
>(null)

export const FormValidateInfoContext = createContext<
    FormValidateType | undefined | null
>(null)

export const TriggerRelationContext = createContext<boolean>(true)

export const NameContext = createContext<NamePath>('')

export const OtherPropsContext = createContext<{
    onVisibleChange?: (visible: boolean, name: NamePath) => any
}>({})