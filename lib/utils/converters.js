import { safeParseJSON, safeParseNumber } from './helpers.js';
export const convertParam = (property, fields, value) => {
    const type = property.type();
    if (type === 'mixed')
        return value;
    if (type === 'number') {
        return safeParseNumber(value);
    }
    if (type === 'reference') {
        const foreignColumn = fields.find((field) => field.name === property.foreignColumnName());
        if (!foreignColumn)
            return value;
        if (value === undefined || value === null)
            return value;
        const foreignColumnType = foreignColumn.type;
        if (foreignColumnType === 'String')
            return String(value);
        return safeParseNumber(value);
    }
    return value;
};
export const convertFilter = (modelFields, filterObject) => {
    if (!filterObject)
        return {};
    const uuidRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-[5|4|3|2|1][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    const { filters = {} } = filterObject;
    return Object.entries(filters).reduce((where, [name, filter]) => {
        if (['boolean', 'number', 'float', 'object', 'array'].includes(filter.property.type())) {
            where[name] = safeParseJSON(filter.value);
        }
        else if (['date', 'datetime'].includes(filter.property.type())) {
            if (typeof filter.value !== 'string' && filter.value.from && filter.value.to) {
                where[name] = { gte: new Date(filter.value.from), lte: new Date(filter.value.to) };
            }
            else if (typeof filter.value !== 'string' && filter.value.from) {
                where[name] = { gte: new Date(filter.value.from) };
            }
            else if (typeof filter.value !== 'string' && filter.value.to) {
                where[name] = { lte: new Date(filter.value.to) };
            }
        }
        else if (filter.property.isEnum()) {
            where[name] = { equals: filter.value };
        }
        else if (filter.property.type() === 'string'
            && (uuidRegex.test(filter.value.toString()) || objectIdRegex.test(filter.value.toString()))) {
            where[name] = { equals: filter.value };
        }
        else if (filter.property.type() === 'reference' && filter.property.foreignColumnName()) {
            where[filter.property.foreignColumnName()] = convertParam(filter.property, modelFields, filter.value);
        }
        else {
            where[name] = { contains: filter.value.toString() };
        }
        return where;
    }, {});
};
//# sourceMappingURL=converters.js.map