import React from 'react';

export const PACKAGING_FIELDS = [
    { key: 's_spec_store_pack_fee', label: '到店外带包装费', money: true },
    { key: 's_spec_store_pack_mark', label: '到店外带包装标识', money: false },
    { key: 's_spec_take_pack_fee', label: '外卖配送包装费', money: true },
    { key: 's_spec_take_pack_mark', label: '外卖配送包装标识', money: false },
] as const;
export type PackagingFieldKey = typeof PACKAGING_FIELDS[number]['key'];
type PackagingRow = { id: string; s_spec_name: string } & Record<PackagingFieldKey, string>;

/** qm-form SPU rows / SKU table; reuses existing packaging values and save payload. */
export const WebProductPackagingSettings: React.FC<{
    mode: 'product' | 'spec'; rows: PackagingRow[]; fieldIds: string[];
    onChange: (rowId: string, field: PackagingFieldKey, value: string) => void;
}> = ({ mode, rows, fieldIds, onChange }) => {
    const fields = PACKAGING_FIELDS.filter(field => fieldIds.includes(field.key));
    if (!fields.length) return null;
    const renderInput = (row: PackagingRow, field: typeof PACKAGING_FIELDS[number]) => <div className="product-packaging-input">
        <input type={field.money ? 'number' : 'text'} value={row[field.key]} maxLength={field.money ? undefined : 128}
            aria-label={`${mode === 'spec' ? `${row.s_spec_name} ` : ''}${field.label}`} placeholder="请输入"
            onChange={event => onChange(row.id, field.key, event.target.value)} className="q-form-input" />
        {field.money && <span>元</span>}
    </div>;
    const renderTable = (tableFields: typeof fields) => <div className="product-packaging-table"><table>
        <thead><tr><th>规格</th>{tableFields.map(field => <th key={field.key}>{field.label}</th>)}</tr></thead>
        <tbody>{rows.map(row => <tr key={row.id}><th scope="row">{rows.length === 1 && row.s_spec_name === '标准规格' ? '单规格' : row.s_spec_name}</th>{tableFields.map(field => <td key={field.key}>{renderInput(row, field)}</td>)}</tr>)}</tbody>
    </table></div>;
    return <section id="product-packaging-settings" className="product-packaging-settings">
        <header><h4>包装设置</h4><span>{mode === 'product' ? '商品级' : '规格级'}</span></header>
        <p className="product-packaging-help">{mode === 'product' ? '包装费和包装标识按商品统一设置，所有规格共用。' : '各规格分别设置包装费和包装标识。'}配置方式取自商品设置。</p>
        {!rows.length ? <p className="product-packaging-help">请先选择规格，再配置包装费。</p> : mode === 'product' ? <>
            <div className="product-packaging-product">
                {fields.map(field => <label key={field.key}><span>{field.label}</span>{renderInput(rows[0], field)}</label>)}
            </div>
        </> : renderTable(fields)}
    </section>;
};
