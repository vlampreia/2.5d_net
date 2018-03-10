declare class Vector {
    x: any;
    y: any;
    z: any;
    constructor(x: any, y: any, z: any);
    add_v(vector: any): Vector;
    subtract(vector: any): Vector;
    sub_v(vector: any): Vector;
    multiply(factor: any): Vector;
    mul_f(factor: any): Vector;
    add_f(value: any): Vector;
    sub_f(value: any): Vector;
    divide(factor: any): Vector;
    div_f(factor: any): Vector;
    div(factor: any): Vector;
    lerp(target: any, percent: any): Vector;
    magnitude(): number;
    normalise(): Vector;
    floor(): Vector;
    round(): Vector;
}
export default Vector;
