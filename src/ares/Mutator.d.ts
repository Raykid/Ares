export declare class Mutator {
    private static _arrMethods;
    /**
     * 将用户传进来的数据“变异”成为具有截获数据变更能力的数据
     * @param data 原始数据
     * @returns {any} 变异后的数据
     */
    static mutate(data: any): any;
    private static mutateObject(data, key, value);
    private static mutateArray(arr, dep);
    private static defineReactiveArray(dep);
}
