
export function readObjParts(src) {
    const varr = [];
    const iarr = [];
    const lines = src.split("\n");
    for ( let line of lines ) {
        const parts = line.split(" ");
        if ( parts[0] === "v" ) {
            const x = parseFloat(parts[1]);
            const y = parseFloat(parts[2]);
            const z = parseFloat(parts[3]);
            varr.push(x);
            varr.push(y);
            varr.push(z);
            varr.push(0);
            varr.push(0);
        }
        if ( parts[0] === "f" ) {
            const x = parseInt(parts[1]);
            const y = parseInt(parts[2]);
            const z = parseInt(parts[3]);
            iarr.push(x);
            iarr.push(y);
            iarr.push(z);
            iarr.push(0);
            iarr.push(0);
        }
    }
    return [new Float32Array(varr), new Uint16Array(iarr)];
}
