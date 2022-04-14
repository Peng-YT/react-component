/// <reference types="react" />
import type { TableProps } from 'antd';
import 'react-resizable/css/styles.css';
declare function ResizableTable<RecordType extends object = any>({ components, ...props }: TableProps<RecordType>): JSX.Element;
export { ResizableTable as Table };
