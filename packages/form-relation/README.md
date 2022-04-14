# `form-relation`

> 能控制各个字段之间联动的表单


## Usage

```js
import { Form, Select } from 'orm-relation';

const Test = () => {
    const formProps = {} // 与antd Form组件props一致
    const [form] = Form.useForm()
    const relationInfo = [{
            controller: [{
                key: 'input',
                value: 'hide Select component'
            }],
            relation: {
                select: false
            }
        }, {
            controller: [{
                key: 'input',
                value: 'disable one option'
            }],
            relation: {
                select: {
                    disableOptions: ['one'],
                    value: 'two'
                }
            }
        }]
    const onRelationValueChange = (effect) => {
        console.log('1s后 Select组件被隐藏掉了！！')
        console.log(
            '2s后 Select组件的one选项被禁用掉了,并且select的值被修改为two'，
            effect.select === 'two'
        )
    }
    useEffect(() => {
        setTimeout(() => {
            form.setFieldsValue({
                input: 'disable Select component'
            })
            console.log('1s后 input框内容修改为： hide Select component')
        }, 1000)

        setTimeout(() => {
            form.setFieldsValue({
                input: 'disable one option'
            })
            console.log('2s后 input框内容修改为： disable one option')
        }, 2000)
    }, [])
    return <Form
        form={form}
        relationInfo={relationInfo}
        onRelationValueChange={onRelationValueChange}
    >
        <Form.Item name="input">
            <Input />
        </Form.Item>
        <Form.Item name="select">
            <Select>
                <Select.Option value="one">
                    one option
                </Select.Option>
                <Select.Option value="two">
                    two option
                </Select.Option>
            </Select>
        </Form.Item>
    </Form>
}

// TODO: DEMONSTRATE API
```
