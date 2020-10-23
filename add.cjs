const https = require("https");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const {AutoComplete, Input} = require("enquirer");

const API_URL = "https://undraw.co/api/illustrations";

function log(str) {
    process.stdout.write(str);
}

function pascalCase(str) {
    return str
        .replace(/(\w)(\w*)/g,
            (_,g1,g2) => (g1.toUpperCase() + g2.toLowerCase()))
        .replace(/\ /g, "");
}

function get(url) {
    return new Promise(resolve => {
        https.get(url, res => {
            let body = "";
            res.on("data", chunk => body += chunk);
            res.on("end", () => resolve(body));
        });
    });
}

function exists(filePath, mode = fs.constants.R_OK) {
    try {
        fs.accessSync(filePath, mode);
        return true;
    }
    catch {
        return false;
    }
}

let tmp = [];
async function list(page = 0) {
    log(".");

    const res = await get(API_URL + "?page=" + page);
    const content = JSON.parse(res);
    tmp = tmp.concat(content.illustrations);

    if (content.hasMore) {
        return await list(content.nextPage);
    }
    else {
        return tmp;
    }
}

async function select(illustrations) {
    const prompt = new AutoComplete({
        name: "Type to search undraw illustrations (fuzzy find):",
        limit: 20,
        choices: illustrations.map(i => i.title)
    });
    const result = await prompt.run();
    if (result.length < 1) throw new Error("No illustration selected.");
    return illustrations.find(x => x.title === result);
}

async function output(selected) {
    const prompt = new Input({
        name: "Output filename:",
        message: "Output filename",
        initial: `Undraw${pascalCase(selected.title)}.svelte`
    });
    const result = await prompt.run();
    if (result.length < 0) throw new Error("No output filename specified.");
    const filePath = path.join(process.cwd(), result);
    if (exists(filePath)) throw new Error("File already exists.");
    return filePath;
}

async function build(selected, outputFile) {
    const templatePath = path.join(__filename, "../Template.svelte");
    const template = await fsp.readFile(templatePath, "binary");
    const illustration = await get(selected.image);
    const replaced = template
        .replace(/{{CONTENT}}/, illustration)
        .replace(/ id=".+?"/, "")
        .replace(/ height=".+?"/, "")
        .replace(/ width=".+?"/, "")
        .replace(/ fill="#6c63ff"/g, " fill={color}");
    
    await fsp.writeFile(outputFile, replaced, "utf-8");
    console.log("✔ Written file", outputFile);
}

async function main() {
    try {
        log("Loading illustrations");
        const illustrations = await list();
        console.clear();
        const selected = await select(illustrations);
        const outputFile = await output(selected);
        await build(selected, outputFile);
    }
    catch(err) {
        console.log("✖", err);
    }
};

module.exports = {
    pascalCase,
    get,
    exists,
    list,
    select,
    build,
    main
}
