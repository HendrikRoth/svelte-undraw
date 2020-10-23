const mockFs = require("mock-fs");
const {pascalCase, exists, list, build} = require("./add");

afterEach(() => mockFs.restore());

describe("pascalCase", () => {
    test("should generate pascal case words without space", () => {
        const expected = "PascalCase";
        expect(pascalCase("pascal Case")).toEqual(expected);
        expect(pascalCase("pascal case")).toEqual(expected);
    });
});

describe("exists", () => {
    test("should check if given file or folder exists", () => {
        mockFs({
            "/test/folder": {
                "file": "Content"
            }
        });

        expect(exists("/test/folder")).toBe(true);
        expect(exists("/test/folder/file")).toBe(true);
        expect(exists("/test/folder2")).toBe(false);
        expect(exists("/test/folder2/file")).toBe(false);
    });
});

// todo
describe("list", () => {});

// todo
describe("build", () => {});