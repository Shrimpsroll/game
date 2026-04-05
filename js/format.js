function format(decimalNumber) {
    let num = new Decimal(decimalNumber);
    if (num.lt(1000)) {
        return Math.floor(num.toNumber()).toString();
    }
    // Formats massive numbers as 1.23e4
    let mantissa = num.m.toFixed(2);
    let exponent = num.e;
    return `${mantissa}e${exponent}`;
}