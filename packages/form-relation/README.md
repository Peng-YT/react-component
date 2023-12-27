# `form-relation`

> 能控制各个字段之间联动的表单！


## Usage

```js
import { Form, Select } from 'form-relation';

const Test = () => {
    const formProps = {} // 与antd Form组件props一致
    const [form] = Form.useForm()
    const relationInfo: FormRelationType[] = [
        {
            conditions: [{
                key: 'item-1', // Form Item的name属性
                value: 'value-1-1' // 可支持回调函数： (val, allFormData) => boolean
            }],
            // 当表单项1的值为value-1-1时，表单项2的可选项只有value-2-2和value-2-3
            // 且表单项2如果之前选择了value-2-1，则需要把值重置为value-2-2
            relation: {
                'item-2': {
                    disableOptions: ['value-2-1'],
                    resetValue: 'value-2-2'
                }
            }
        }, 
        {
            conditions: [{
                key: 'item-2',
                value: 'value-2-2'
            }],
            // 当表单项2的值为value-2-2时，表单项3的值需要重置为value-3-1
            relation: {
                'item-3': {
                    resetValue: 'value-3-1'
                }
            }
        },
        {
            conditions: [{
                key: 'item-3',
                value: 'value-3-2'
            }],
            // 当表单项3的值为value-3-2时，表单项4不可用，且要隐藏和清空值
            relation: {
                'item-4': false
            }
        }
    ]
    const onRelationValueChange = (effect) => {
        console.log('1s后 表单项3的值为value-3-1！！', effect['item-3'] === 'value-3-1')
        console.log('2s后 表单项4的值被清空了，且组件隐藏了！！', effect['item-4'] === undefined)
    }
    useEffect(() => {
        setTimeout(() => {
            form.setFieldsValue({
                ‘item-2’: 'value-2-2'
            })
            console.log('1s后 单项2的值被修改为：value-2-2')
        }, 1000)
    }, [])
    useEffect(() => {
        setTimeout(() => {
            form.setFieldsValue({
                ‘item-3’: 'value-3-2'
            })
            console.log('2s后 单项3的值被修改为：value-3-2')
        }, 2000)
    }, [])
    return <Form
        form={form}
        relationInfo={relationInfo}
        onRelationValueChange={onRelationValueChange}
    >
        <Form.Item name='item-1'>
            <Select>
                <Select.Option value='value-1-1'></Select.Option>
                <Select.Option value='value-1-2'></Select.Option>
            </Select>
        </Form.Item>
        <Form.Item name='item-2'>
            <Select>
                <Select.Option value='value-2-1'></Select.Option>
                <Select.Option value='value-2-2'></Select.Option>
                <Select.Option value='value-2-3'></Select.Option>
            </Select>
        </Form.Item>
        <Form.Item name='item-3'>
            <Select>
                <Select.Option value='value-3-1'></Select.Option>
                <Select.Option value='value-3-2'></Select.Option>
            </Select>
        </Form.Item>
        <Form.Item name='item-4'>
            <Select>
                <Select.Option value='value-4-1'></Select.Option>
                <Select.Option value='value-4-2'></Select.Option>
            </Select>
        </Form.Item>
    </Form>
}

// TODO: DEMONSTRATE API
```
