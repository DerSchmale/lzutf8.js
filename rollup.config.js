import typescript from "@rollup/plugin-typescript";

export default [{
    input: "./src/Exports/Exports.ts",
    output: [
        {
            file: "build/lzutf8.module.js",
            format: "es"
        }
    ],
    plugins: [
        typescript(),
    ]
}];
