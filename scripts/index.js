"use strict";
class Question {
    constructor(...parts) {
        this._parts = parts;
    }
    static get answers() {
        return this._answers;
    }
    get parts() {
        return this._parts;
    }
    toHTMLDivElement() {
        let element = document.createElement("div");
        try {
            for (let part of this.parts) {
                if (part.startsWith("$")) {
                    if (Math.random() > 0.5) {
                        let ppart = part;
                        if (part.indexOf("%") > 0) {
                            ppart =
                                part.substring(0, part.indexOf("%")) +
                                    part.substring(part.lastIndexOf("%") + 1);
                        }
                        element.appendChild(document.createTextNode(part.substring(1, ppart.length - 1)));
                    }
                    else {
                        let input = document.createElement("input");
                        input.type = "text";
                        if (part.indexOf("%") > 0) {
                            input.placeholder = part.substring(part.indexOf("%") + 1, part.lastIndexOf("%"));
                        }
                        input.id =
                            "answer-input-" + Question._answers.size;
                        Question._answers.set(input.id, part.indexOf("%") > 0
                            ? part.substring(1, part.indexOf("%")) +
                                part.substring(part.lastIndexOf("%") + 1, part.length - 1)
                            : part.substring(1, part.length - 1));
                        element.appendChild(input);
                    }
                }
                else {
                    element.appendChild(document.createTextNode(part));
                }
            }
        }
        catch (e) {
            console.error(e);
            element.innerHTML = "Error while creating question.";
        }
        return element;
    }
}
Question._answers = new Map();
class KeywordedQuestion extends Question {
    constructor(keyword, ...parts) {
        super(...parts);
        this._keyword = keyword;
    }
    get keyword() {
        return this._keyword;
    }
}
class ReferenceQuestion extends KeywordedQuestion {
    constructor(refIndex, keyword, ...parts) {
        super(keyword, ...parts);
        this._refIndex = refIndex;
    }
    get refIndex() {
        return this._refIndex;
    }
}
const questions = new Array();
const mainContainer = document.getElementById("main-container"); // main container
const mistakesContainer = document.getElementById("mistakes-container"); // mistakes container
function isSpecialChararcter(character) {
    return (character === "[" ||
        character === "]" ||
        character === "{" ||
        character === "}" ||
        character === "|" ||
        character === "$" ||
        character === "%");
}
var exhr = new EnhancedXMLHttpRequest(window.location.origin.indexOf("github") > 0
    ? window.location.href + "/assets/questions.txt"
    : window.location.origin + "/assets/questions.txt", "GET");
exhr.send();
exhr.getResponse().then((response) => {
    let rresponse = response.replace(/ /g, "");
    let lines = rresponse.split("\n");
    for (let i = 0; i < lines.length; i++) {
        try {
            let line = lines[i]; // used for parsing
            let keyword = "none"; // determines KeywordedQuestion type
            let refIndex = -1; // determines ReferenceQuestion type
            let parts = new Array(); // normal question parts
            let ref = null; // reference question parsing
            let partBuffer = ""; // used for parsing
            for (let j = 0; j < line.length; j++) {
                switch (line[j]) {
                    case "[":
                        if (line.indexOf("]", j) < 0)
                            throw new Error("Missing closing bracket.");
                        keyword = line.substring(j + 1, line.indexOf("]", j));
                        j = line.indexOf("]", j);
                        break;
                    case "|":
                        refIndex = parts.length;
                        break;
                    case "$":
                        if (line.indexOf("$", j + 1) < 0)
                            throw new Error("Missing closing sign.");
                        parts.push(line.substring(j, line.indexOf("$", j + 1) + 1));
                        j = line.indexOf("$", j + 1);
                        break;
                    case "{":
                        if (line.indexOf("}", j) < 0)
                            throw new Error("Missing closing brace.");
                        let refKeyword = line.substring(j + 1, line.indexOf("}", j));
                        let temp = questions.find((question, _index, _arr) => {
                            return (question instanceof ReferenceQuestion &&
                                question.keyword == refKeyword);
                        });
                        if (temp) {
                            ref = temp;
                            for (let k = ref.refIndex; k < ref.parts.length; k++) {
                                parts.push(ref.parts[k]);
                            }
                        }
                        else {
                            console.log(`Reference to ${refKeyword} not found.`);
                            parts.push(line.substring(j, line.indexOf("}", j) + 1));
                        }
                        j = line.indexOf("}", j);
                        break;
                    default:
                        partBuffer += line[j];
                        if (j === line.length - 1 ||
                            isSpecialChararcter(line[j + 1])) {
                            parts.push(partBuffer);
                            partBuffer = "";
                        }
                        break;
                }
            }
            if (refIndex !== -1) {
                questions.push(new ReferenceQuestion(refIndex, keyword, ...parts));
            }
            else if (keyword !== "none") {
                questions.push(new KeywordedQuestion(keyword, ...parts));
            }
            else if (parts.length > 0) {
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
}, (error) => {
    console.error(error);
    mainContainer.innerHTML = "Error while loading questions.";
});
function onSubmit() {
    for (let input of document.getElementsByTagName("input")) {
        if (input.type === "text") {
            if (input.value === Question.answers.get(input.id)) {
                input.style.color = "green";
            }
            else {
                input.style.color = "red";
                let mistakeDiv = document.createElement("div");
                mistakeDiv.innerHTML = `<p>第${input.id.replace(/\D/g, "")}空错误，你的答案：${input.value}，正确答案：${Question.answers.get(input.id)}</p>`;
                mistakesContainer.appendChild(mistakeDiv);
            }
        }
    }
}
