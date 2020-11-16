import typescript from "@rollup/plugin-typescript";

export default [{
    input: "./src/main.ts",
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
