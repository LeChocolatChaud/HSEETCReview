class Question {
    private _parts: string[];
    public get parts() : string[] {
        return this._parts;
    }
    

    constructor(...parts: string[]) {
        this._parts = parts;
    }

    toHTMLDivElement(): HTMLDivElement {
        let element = document.createElement("div");
        try {
            for (let part of this.parts) {
                if (part.startsWith("$")) {
                    if (Math.random() > 0.5) {
                        let ppart = part;
                        if (part.indexOf("%") > 0) {
                            ppart = part.substring(0, part.indexOf("%")) + part.substring(part.lastIndexOf("%") + 1);
                        }
                        element.appendChild(document.createTextNode(part.substring(1, ppart.length - 1)));
                    } else {
                        let input = document.createElement("input");
                        input.type = "text";
                        if (part.indexOf("%") > 0) {
                            input.placeholder = part.substring(part.indexOf("%") + 1, part.lastIndexOf("%"));
                        }
                        element.appendChild(input);
                    }
                } else {
                    element.appendChild(document.createTextNode(part));
                }
            }
        } catch (e) {
            console.error(e);
            element.innerHTML = "Error while creating question.";
        }
        return element;
    }
}

class KeywordedQuestion extends Question {
    private _keyword: string;
    public get keyword(): string {
        return this._keyword;
    }

    constructor(keyword: string, ...parts: string[]) {
        super(...parts);
        this._keyword = keyword;
    }
}

class ReferenceQuestion extends KeywordedQuestion {
    private _refIndex: number;
    public get refIndex(): number {
        return this._refIndex;
    }

    constructor(refIndex: number, keyword: string, ...parts: string[]) {
        super(keyword, ...parts);
        this._refIndex = refIndex;
    }
}

const questions = new Array<Question>();
const mainContainer = document.getElementById("main-container") as HTMLDivElement; // main container

function isSpecialChararcter(character: string): boolean {
    return character === "[" ||
        character === "]" ||
        character === "{" ||
        character === "}" ||
        character === "|" ||
        character === "$" ||
        character === "%";
}

var exhr = new EnhancedXMLHttpRequest(
    window.location.origin.indexOf("github") > 0 ? window.location.href + "/assets/questions.txt" : window.location.origin + "/assets/questions.txt",
    "GET",
    null
);
exhr.send();
exhr.getResponse().then((response: string) => {
    let rresponse = response.replace(/ /g, "");
    let lines = rresponse.split("\n");
    for (let i = 0; i < lines.length; i++) {
        try {let line = lines[i]; // used for parsing
        let keyword = "none"; // determines KeywordedQuestion type
        let refIndex = -1; // determines ReferenceQuestion type
        let parts = new Array<string>(); // normal question parts
        let ref: ReferenceQuestion | null = null; // reference question parsing
        let partBuffer = ""; // used for parsing
        for (let j = 0; j < line.length; j++) {
            switch (line[j]) {
                case "[":
                    if (line.indexOf("]", j) < 0) throw new Error("Missing closing bracket.");
                    keyword = line.substring(j + 1, line.indexOf("]", j));
                    j = line.indexOf("]", j);
                    break;
                case "|":
                    refIndex = parts.length;
                    break;
                case "$":
                    if (line.indexOf("$", j + 1) < 0) throw new Error("Missing closing sign.");
                    parts.push(line.substring(j, line.indexOf("$", j+1) + 1));
                    j = line.indexOf("$", j+1);
                    break;
                case "{":
                    if (line.indexOf("}", j) < 0) throw new Error("Missing closing brace.");
                    let refKeyword = line.substring(
                        j + 1,
                        line.indexOf("}", j)
                    );
                    let temp = questions.find((question, _index, _arr) => {
                        return (
                            question instanceof ReferenceQuestion &&
                            question.keyword == refKeyword
                        );
                    });
                    if (temp) {
                        ref = temp as ReferenceQuestion;
                        for (let k = ref.refIndex; k < ref.parts.length; k++) {
                            parts.push(ref.parts[k]);
                        }
                    } else {
                        console.log(`Reference to ${refKeyword} not found.`);
                        parts.push(line.substring(j, line.indexOf("}", j) + 1));
                    }
                    j = line.indexOf("}", j);
                    break;
                default:
                    partBuffer += line[j];
                    if (j === line.length - 1 || isSpecialChararcter(line[j + 1])) {
                        parts.push(partBuffer);
                        partBuffer = "";
                    }
                    break;
            }
        }
        if (refIndex !== -1) {
            questions.push(new ReferenceQuestion(refIndex, keyword, ...parts));
        } else if (keyword !== "none") {
            questions.push(new KeywordedQuestion(keyword, ...parts));
        } else if (parts.length > 0) {
            questions.push(new Question(...parts));
            }
        }
        catch (e) {
            console.error(e);
            console.log(`Error parsing line ${i + 1}`);
        }
    }
    for (let question of questions) {
        mainContainer.appendChild(question.toHTMLDivElement());
    }
});
