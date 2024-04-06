export const FilterOperationNames = {
    GreaterThan: 'GreaterThan',
    LessThan: 'LessThan',
    EqualTo: 'EqualTo',
    NotEqualTo: 'NotEqualTo',
    GreaterThanOrEqualTo: 'GreaterThanOrEqualTo',
    LessThanOrEqualTo: 'LessThanOrEqualTo',
    Between: 'Between', 
    NotBetween: 'NotBetween', 
    In: 'In',
    NotIn: 'NotIn', 
    Contains: 'Contains', 
    NotContains: 'NotContains', 
    LengthEquals: 'LengthEquals',
    And: 'And', 
    Or: 'Or', 
    Not: 'Not', 
}

export type FilterOperations = keyof typeof FilterOperationNames

export type FilterCriterion = {
    field?: string;
    operation: FilterOperations;
    values?: (string | number)[];
    criteria?: FilterCriterion[]; // For And, Or, Not operations
}

export const applyFilters = <T>(data: T[], filters: FilterCriterion[]): T[] => {
    return data.filter((item:any) => {
        return filters.every(filter => {
            if (filter.operation === 'And') {
                return applyFilters([item], filter.criteria!).length > 0;
            } else if (filter.operation === 'Or') {
                return filter.criteria!.some(criterion => applyFilters([item], [criterion]).length > 0);
            } else if (filter.operation === 'Not') {
                return applyFilters([item], filter.criteria!).length === 0;
            } else if (filter.field) {
                const itemValue = item[filter.field!];
                switch (filter.operation) {
                    case 'GreaterThan':
                        return itemValue > filter.values![0];
                    case 'LessThan':
                        return itemValue < filter.values![0];
                    case 'EqualTo':
                        return itemValue === filter.values![0];
                    case 'NotEqualTo':
                        return itemValue !== filter.values![0];
                    case 'GreaterThanOrEqualTo':
                        return itemValue >= filter.values![0];
                    case 'LessThanOrEqualTo':
                        return itemValue <= filter.values![0];
                    case 'Between':
                        return itemValue > filter.values![0] && itemValue < filter.values![1];
                    case 'NotBetween':
                        return !(itemValue > filter.values![0] && itemValue < filter.values![1]);
                    case 'In':
                        return filter.values!.includes(itemValue);
                    case 'NotIn':
                        return !filter.values!.includes(itemValue);
                    case 'LengthEquals':
                        return filter.values!.length === itemValue.length;
                    case 'Contains':
                        if (typeof itemValue === 'string' && typeof filter.values![0] === 'string') {
                            return itemValue.includes(filter.values![0]);
                        }
                        return false;
                    case 'NotContains':
                        if (typeof itemValue === 'string' && typeof filter.values![0] === 'string') {
                            return !itemValue.includes(filter.values![0]);
                        }
                        return false;
                    default:
                        return true;
                }
            }
            return true;
        });
    });
}

/*
// Example usage:
const data = [
    { id: 1, name: 'John', age: 28 },
    { id: 2, name: 'Jane', age: 34 },
    { id: 3, name: 'Doe', age: 45 },
];

const filters: FilterCriterion[] = [{
    operation: 'And',
    criteria: [
        {
            operation: 'Or',
            criteria: [
                { field: 'age', operation: 'LessThan', values: [35] },
                { field: 'age', operation: 'GreaterThan', values: [40] }
            ]
        },
        {
            operation: 'Not',
            criteria: [{ field: 'name', operation: 'EqualTo', values: ['Jane'] }]
        }
    ]
}];

const filteredData = applyFilters(data, filters);
console.log(filteredData);
/* 
[
    {
        id: 1,
        name: "John",
        age: 28,
    }, {
        id: 3,
        name: "Doe",
        age: 45,
    }
]
*/