import { Checkbox, Tooltip, Radio, Select, Typography, Switch, Form } from 'antd';
import { isEqual, isEmpty } from 'lodash';
import React, { useContext, useMemo, useEffect, useState, useRef } from 'react';
import { useDebounce } from 'react-use';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useRelation } from './hook.js';
import { NameContext, RelationInfoContext, FormDataContext, OtherFormDataContext, TriggerRelationContext, FormValidateInfoContext, OtherPropsContext, FormInstanceContext } from './context.js';
import { getMatchRelationResByFormData, mergeRelation, cpmNamePath, optionIsHide, optionIsDisabled, isDisabled, getFieldIsOpen, assignDeep, hasProp, initRelationValue, cmpArray } from './util.js';

/*
 * @Author: 彭越腾
 * @Date: 2021-08-19 10:34:17
 * @LastEditTime: 2023-08-18 11:53:14
 * @LastEditors: 彭越腾
 * @Description: In User Settings Edit
 * @FilePath: \admin-market\src\components\Common\RelationForm\Checkbox.tsx
 */
const { Group: Group$1 } = Checkbox;
function CheckboxComponent({ children, desc, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (React.createElement(Checkbox, { ...props, disabled: optionIsDisabled },
        children,
        desc ? (React.createElement("div", null,
            React.createElement(Tooltip, { overlay: desc, style: { width: 'auto' } },
                "\u00A0",
                React.createElement(InfoCircleOutlined, { rev: undefined })))) : null));
}
const CheckboxR = Object.assign(CheckboxComponent, Checkbox);
const GroupComponent$1 = ({ children, ...props }) => {
    const { isDisabled } = useRelation(props);
    return (React.createElement(Group$1, { ...props, disabled: isDisabled }, children));
};
const GroupR$1 = GroupComponent$1;
CheckboxR.Group = GroupR$1;

/*
 * @Author: 彭越腾
 * @Date: 2021-08-18 18:34:55
 * @LastEditTime: 2023-05-12 14:59:59
 * @LastEditors: 彭越腾
 * @Description: In User Settings Edit
 * @FilePath: \admin-market\src\components\Common\RelationForm\Radio.tsx
 */
const { Button, Group } = Radio;
function RadioComponent({ children, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (React.createElement(Radio, { ...props, disabled: optionIsDisabled }, children));
}
const RadioR = Object.assign(RadioComponent, Radio);
const GroupComponent = ({ children, ...props }) => {
    const { isDisabled } = useRelation(props);
    return (React.createElement(Group, { ...props, disabled: isDisabled }, children));
};
const GroupR = GroupComponent;
function ButtonComponent({ children, desc, ...props }) {
    const { optionIsHide, optionIsDisabled } = useRelation(props);
    return optionIsHide ? null : (React.createElement(Button, { ...props, disabled: optionIsDisabled },
        children,
        desc ? (React.createElement(Tooltip, { overlay: desc },
            "\u00A0",
            React.createElement(InfoCircleOutlined, { rev: undefined }))) : null));
}
const ButtonR = Object.assign(ButtonComponent, Button);
RadioR.Button = ButtonR;
RadioR.Group = GroupR;

/*
 * @Author: 彭越腾
 * @Date: 2021-08-18 17:55:28
 * @LastEditTime: 2023-11-23 13:44:25
 * @LastEditors: 彭越腾
 * @Description: In User Settings Edit
 * @FilePath: \react-component\packages\form-relation\src\Select.tsx
 */
function SelectComponent({ children, ...props }) {
    const name = useContext(NameContext);
    const relationInfo = useContext(RelationInfoContext);
    // const form = useContext(FormInstanceContext)
    const formData = useContext(FormDataContext);
    const otherFormData = useContext(OtherFormDataContext);
    const triggerRelation = useContext(TriggerRelationContext);
    const matchController = useMemo(() => getMatchRelationResByFormData(relationInfo, {
        ...(formData || {}),
        ...(otherFormData || {}),
    }), [relationInfo, formData, otherFormData]);
    const relationDetail = useMemo(() => {
        const allRelation = matchController.reduce((prev, cur) => {
            return mergeRelation(prev, cur.relation);
        }, {});
        if (Array.isArray(name)) {
            return Object.values(allRelation).find(item => item && item.keyPath && cpmNamePath(item.keyPath, name));
        }
        else {
            return allRelation[name];
        }
    }, [matchController, name]);
    const filterChildren = (children) => {
        return children
            ?.filter?.((item) => {
            if (!item) {
                return false;
            }
            const isHide = optionIsHide(item.props || {}, relationDetail);
            return !isHide;
        })
            ?.map?.((item) => ({
            ...item,
            props: {
                ...(item.props || {}),
                disabled: optionIsDisabled(item.props || {}, relationDetail),
                children: item.type === Select.OptGroup
                    ? filterChildren(item.props?.children)
                    : item.props?.children,
            },
        }));
    };
    return (React.createElement(Select, { ...props, disabled: isDisabled(props, relationDetail) }, filterChildren(children)));
}
const SelectR = Object.assign(SelectComponent, Select);
const OptionComponent = ({ children, desc, ...props }) => {
    const relation = useRelation(props);
    return relation.optionIsHide ? null : (React.createElement(Select.Option, { ...props, disabled: relation.optionIsDisabled }, desc ? (React.createElement("div", null,
        React.createElement("p", null, children),
        React.createElement(Typography.Text, { type: 'secondary' }, desc))) : (children)));
};
const Option = Object.assign(OptionComponent, Select.Option);
SelectR.Option = Option;

const SwitchComponent = (props) => {
    const { isDisabled } = useRelation(props);
    return React.createElement(Switch, { ...props, disabled: isDisabled });
};
const SwitchR = Object.assign(SwitchComponent, Switch);

/*
 * @Author: 彭越腾
 * @Date: 2021-08-16 17:33:33
 * @LastEditTime: 2023-11-28 15:02:00
 * @LastEditors: 彭越腾
 * @Description: 能控制各个字段之间联动的表单
 * @FilePath: \react-component\packages\form-relation\src\index.tsx
 */
const { useForm } = Form;
function ItemComponent({ children, ...props }) {
    const relationInfo = useContext(RelationInfoContext);
    // const form = useContext(FormInstanceContext)
    const formData = useContext(FormDataContext);
    const validateFormInfo = useContext(FormValidateInfoContext);
    const name = props.name || '';
    const otherFormData = useContext(OtherFormDataContext);
    const otherProps = useContext(OtherPropsContext);
    const matchController = getMatchRelationResByFormData(relationInfo, {
        ...(formData || {}),
        ...(otherFormData || {}),
    }, {
        oldFormData: {},
    });
    const allRelation = matchController.reduce((prev, cur) => {
        return {
            ...prev,
            ...cur.relation,
        };
    }, {});
    const formItemIsShow = (() => {
        if (!matchController.length) {
            return true;
        }
        const findRelationDetailFromKeyPath = (keyPath) => {
            return Object.values(allRelation).find((item) => {
                return (item &&
                    item.keyPath &&
                    cpmNamePath(keyPath, item.keyPath));
            });
        };
        /** 判断父级属性是否关闭，如果关闭，则该属性也关闭 */
        if (Array.isArray(name)) {
            let parentIsClose = false;
            name.forEach((cur, index) => {
                const keyPath = name.slice(0, index + 1);
                let parentRelation;
                if (keyPath.length === 1) {
                    parentRelation =
                        findRelationDetailFromKeyPath(keyPath) ??
                            allRelation[keyPath[0]];
                }
                else {
                    parentRelation = findRelationDetailFromKeyPath(keyPath);
                }
                if (!getFieldIsOpen(parentRelation)) {
                    parentIsClose = true;
                }
            });
            if (parentIsClose) {
                return false;
            }
        }
        const relationDetail = Array.isArray(name)
            ? findRelationDetailFromKeyPath(name)
            : allRelation[name];
        if (relationDetail === undefined || relationDetail === null) {
            return true;
        }
        return getFieldIsOpen(relationDetail);
    })();
    let rulesFromContext;
    if (Array.isArray(name)) {
        name.reduce((prev, curName, index) => {
            const curValidateInfo = prev?.[curName];
            if (index === name.length - 1) {
                rulesFromContext = curValidateInfo?.rules;
            }
            return curValidateInfo?.deeps;
        }, validateFormInfo);
    }
    else {
        rulesFromContext = validateFormInfo?.[name]?.rules;
    }
    const rules = props?.rules ||
        (typeof rulesFromContext === 'function'
            ? rulesFromContext(formData || {})
            : rulesFromContext);
    useEffect(() => {
        otherProps?.onVisibleChange?.(formItemIsShow, name);
    }, [formItemIsShow]);
    return (React.createElement(NameContext.Provider, { value: name }, formItemIsShow ? (React.createElement(Form.Item, { ...props, style: props.style, rules: formItemIsShow ? rules : undefined }, children)) : null));
}
const ItemR = Object.assign(ItemComponent, Form.Item);
function FormComponent({ onRelationValueChange, relationInfo, children, triggerRelation = true, triggerResetValue = true, validateFormInfo, otherFormData, formData, changeDataType = 'merge', ...props }) {
    const [form] = useForm(props.form);
    /* 存储值不为空的表单数据 */
    const [noEmptyFormData, setNoEmptyFormData] = useState({});
    /* 用于恢复表单上一次的非空数据 */
    const recoverData = useRef({
        data: {},
    });
    const emptyInitialVal = useMemo(() => ({}), []);
    const originFormData = formData || form.getFieldsValue(true);
    const formDataRef = useRef({
        data: {},
        triggerKeys: '',
        relationInfo: [],
    });
    const onChange = (effectValues) => {
        const valueHasChange = Object.keys(effectValues).some((key) => {
            return !isEqual(effectValues[key], originFormData[key]);
        });
        if (valueHasChange) {
            onRelationValueChange(effectValues, true);
        }
        formDataRef.current.data =
            changeDataType === 'merge'
                ? assignDeep({
                    ...(otherFormData || {}),
                    ...originFormData,
                }, effectValues, {})
                : {
                    ...(otherFormData || {}),
                    ...originFormData,
                    ...effectValues,
                };
        formDataRef.current.relationInfo = relationInfo;
    };
    /**
     * 如果表单显示出来，则把数据恢复到上一次的非空数据
     * @param visible
     * @param name
     */
    const onFormItemVisibleChange = (visible, name) => {
        /* const prevValue = Array.isArray(name)
            ? name.reduce((prev, cur) => {
                  return prev?.[cur]
              }, formDataRef.current.data)
            : formDataRef.current.data?.[name]
        const prevIsEmpty = isEmpty(prevValue) */
        const allRelation = relationInfo.reduce((prev, cur) => {
            return mergeRelation(prev, cur.relation);
        }, {});
        const relation = Array.isArray(name)
            ? Object.values(allRelation || {}).find((detail) => {
                return (detail &&
                    detail.keyPath &&
                    cpmNamePath(detail.keyPath, name));
            })
            : allRelation[name];
        const isNoRecover = relation && relation?.noRecoverValue;
        if (!isNoRecover &&
            visible &&
            /* prevIsEmpty && */
            triggerRelation &&
            triggerResetValue &&
            hasProp(noEmptyFormData, name)) {
            if (Array.isArray(name)) {
                const objVal = {};
                name.reduce((prevObj, key, index) => {
                    if (index === name.length - 1) {
                        prevObj[key] = name.reduce((prev, cur) => {
                            return prev?.[cur];
                        }, noEmptyFormData);
                    }
                    else {
                        prevObj[key] = {};
                    }
                    return prevObj[key];
                }, objVal);
                recoverData.current.data = assignDeep(recoverData.current.data, objVal, {});
            }
            else {
                recoverData.current.data[name] = noEmptyFormData[name];
            }
        }
    };
    const getEffectValues = (formData) => {
        return initRelationValue(relationInfo, formData, {}, triggerResetValue, {
            recoverData: recoverData.current.data,
            oldFormValues: formDataRef.current.data,
            triggerChangeKey: formDataRef.current.triggerKeys,
        });
    };
    const run = () => {
        const match = getMatchRelationResByFormData(relationInfo, {
            ...originFormData,
            ...(otherFormData || {}),
        });
        const oldMatch = getMatchRelationResByFormData(formDataRef.current.relationInfo, formDataRef.current.data);
        /** 前后两次联动关系一样，并且没有需要恢复的数据，则无需执行联动 */
        if (cmpArray(match, oldMatch) && isEmpty(recoverData.current.data)) {
            return;
        }
        const effectValues = getEffectValues({
            ...originFormData,
            ...(otherFormData || {}),
        });
        recoverData.current.data = {};
        onChange(effectValues);
        formDataRef.current.triggerKeys = '';
    };
    useEffect(() => {
        setNoEmptyFormData((prev) => {
            return {
                ...prev,
                ...Object.keys(originFormData).reduce((prevFormDataHandle, formDataProp) => {
                    const res = {
                        ...prevFormDataHandle,
                    };
                    const val = originFormData[formDataProp];
                    const noEmpty = !isEmpty(val) || val === false;
                    if (noEmpty) {
                        res[formDataProp] = val;
                    }
                    return res;
                }, {}),
            };
        });
    }, [originFormData, otherFormData]);
    useEffect(() => {
        if (!props.form) {
            form.setFieldsValue(originFormData);
        }
    }, [formData]);
    useDebounce(() => {
        if (!triggerRelation) {
            return;
        }
        run();
    }, 200, [originFormData, otherFormData, relationInfo]);
    return (React.createElement(Form, { colon: false, ...props, form: form, onFieldsChange: (fields, allFields) => {
            formDataRef.current.triggerKeys = fields?.[0]?.name;
            props?.onFieldsChange?.(fields, allFields);
        }, onValuesChange: (val, all) => {
            const effectValues = getEffectValues(assignDeep({
                ...originFormData,
                ...(otherFormData || {}),
            }, val, {}));
            props?.onValuesChange?.(changeDataType === 'merge'
                ? assignDeep(val, effectValues, {})
                : {
                    ...val,
                    ...effectValues,
                }, changeDataType === 'merge'
                ? assignDeep(all, effectValues, {})
                : {
                    ...all,
                    ...effectValues,
                });
        } },
        React.createElement(FormValidateInfoContext.Provider, { value: validateFormInfo },
            React.createElement(FormDataContext.Provider, { value: originFormData },
                React.createElement(FormInstanceContext.Provider, { value: form },
                    React.createElement(RelationInfoContext.Provider, { value: relationInfo },
                        React.createElement(OtherFormDataContext.Provider, { value: otherFormData },
                            React.createElement(TriggerRelationContext.Provider, { value: triggerRelation },
                                React.createElement(OtherPropsContext.Provider, { value: {
                                        onVisibleChange: onFormItemVisibleChange,
                                    } }, typeof children === 'function'
                                    ? children({
                                        form,
                                        relationInfo,
                                        otherFormData,
                                        triggerRelation,
                                        validateFormInfo,
                                    }, form)
                                    : children)))))))));
}
const FormR = Object.assign(FormComponent, Form);
FormR.Item = ItemR;

export { CheckboxR as Checkbox, FormR as Form, ItemR as Item, RadioR as Radio, SelectR as Select, SwitchR as Switch, FormR as default };
