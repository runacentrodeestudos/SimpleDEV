const projectFiles = {

    "index.html": `
<h1>Hello from simpleDEV</h1>

<p>
Drop files into the explorer.
</p>

<img src="logo.png" width="150">
`,

    "style.css": `
body{
    font-family:Arial,sans-serif;
    padding:40px;
}

h1{
    color:#2563eb;
}
`,

    "script.js": `
console.log("simpleDEV Ready");
`
};

let currentFile = "index.html";

let monacoEditor;

const editorContainer = document.getElementById("editor");
const preview = document.getElementById("preview");
const fileList = document.getElementById("fileList");
const dropZone = document.getElementById("dropZone");

function getMonacoLanguage(filename){
    if(filename.endsWith(".html") || filename.endsWith(".htm")){
        return "html";
    }else if(filename.endsWith(".css")){
        return "css";
    }else if(filename.endsWith(".js")){
        return "javascript";
    }else if(filename.endsWith(".json")){
        return "json";
    }else if(filename.endsWith(".md")){
        return "markdown";
    }else if(filename.endsWith(".txt")){
        return "plaintext";
    }
    return "plaintext";
}

function renderFiles(){

    fileList.innerHTML = "";

    Object.keys(projectFiles).forEach(fileName=>{

        const div = document.createElement("div");

        div.className = "file";

        if(fileName === currentFile){
            div.classList.add("active");
        }

        div.textContent = fileName;

        div.addEventListener("click",()=>{

            projectFiles[currentFile] = monacoEditor.getValue();

            currentFile = fileName;

            monacoEditor.setValue(projectFiles[fileName]);
            monaco.editor.setModelLanguage(monacoEditor.getModel(), getMonacoLanguage(fileName));

            renderFiles();

            updatePreview();

        });

        fileList.appendChild(div);

    });

}

function updatePreview(){

    projectFiles[currentFile] = monacoEditor.getValue();

    let htmlContent =
        projectFiles["index.html"] || "";

    Object.keys(projectFiles).forEach(file=>{

        const isImage =
            file.endsWith(".png") ||
            file.endsWith(".jpg") ||
            file.endsWith(".jpeg") ||
            file.endsWith(".gif") ||
            file.endsWith(".svg");

        const isAsset =
            file.endsWith(".glb") ||
            file.endsWith(".gltf");

        if(isImage || isAsset){

            htmlContent =
                htmlContent.replaceAll(
                    file,
                    projectFiles[file]
                );
        }

    });

    const previewDoc = `
<!DOCTYPE html>
<html>
<head>

<style>
${projectFiles["style.css"] || ""}
</style>

</head>
<body>

${htmlContent}

<script>
${projectFiles["script.js"] || ""}
<\/script>

</body>
</html>
`;

    preview.srcdoc = previewDoc;
}

function loadFile(name){

    currentFile = name;

    monacoEditor.setValue(projectFiles[name]);
    monaco.editor.setModelLanguage(monacoEditor.getModel(), getMonacoLanguage(name));

    renderFiles();

    updatePreview();
}


dropZone.addEventListener("dragover",e=>{

    e.preventDefault();

    dropZone.classList.add("dragover");

});

dropZone.addEventListener("dragleave",()=>{

    dropZone.classList.remove("dragover");

});

dropZone.addEventListener("drop",async e=>{

    e.preventDefault();

    dropZone.classList.remove("dragover");

    const files =
        [...e.dataTransfer.files];

    for(const file of files){

        const name = file.name.toLowerCase();

        const isText =
            name.endsWith(".html") ||
            name.endsWith(".css") ||
            name.endsWith(".js") ||
            name.endsWith(".json") ||
            name.endsWith(".txt") ||
            name.endsWith(".md");

        const isAsset =
            name.endsWith(".glb") ||
            name.endsWith(".gltf");

        if(isText){

            const content =
                await file.text();

            projectFiles[file.name] =
                content;

        }else if(isAsset){

            const mimeType = file.name.endsWith(".glb") ? "model/gltf-binary" : "model/gltf+json";
            const data = await readAsBlobURL(file, mimeType);

            projectFiles[file.name] =
                data;

        }else{

            const data =
                await readAsDataURL(file);

            projectFiles[file.name] =
                data;

        }

    }

    renderFiles();

    updatePreview();

});

function readAsDataURL(file){

    return new Promise(resolve=>{

        const reader =
            new FileReader();

        reader.onload = ()=>{

            resolve(reader.result);

        };

        reader.readAsDataURL(file);

    });

}

function readAsBlobURL(file, mimeType){
    return new Promise(resolve=>{
        const reader = new FileReader();
        reader.onload = ()=>{
            const blob = new Blob([reader.result], {type: mimeType});
            const url = URL.createObjectURL(blob);
            resolve(url);
        };
        reader.readAsArrayBuffer(file);
    });
}

function arrayBufferToBase64(buffer, mimeType){
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return `data:${mimeType};base64,${btoa(binary)}`;
}

document
.getElementById("windowBtn")
.addEventListener("click",async ()=>{

    projectFiles[currentFile] = monacoEditor.getValue();

    let htmlContent =
        projectFiles["index.html"] || "";

    for(const file of Object.keys(projectFiles)){

        const isImage =
            file.endsWith(".png") ||
            file.endsWith(".jpg") ||
            file.endsWith(".jpeg") ||
            file.endsWith(".gif") ||
            file.endsWith(".svg");

        const isAsset =
            file.endsWith(".glb") ||
            file.endsWith(".gltf");

        if(isImage || isAsset){
            let assetUrl = projectFiles[file];

            if(isAsset && assetUrl.startsWith("blob:")){
                const response = await fetch(assetUrl);
                const buffer = await response.arrayBuffer();
                const mimeType = "application/octet-stream";
                assetUrl = arrayBufferToBase64(buffer, mimeType);
            }

            htmlContent =
                htmlContent.replaceAll(
                    file,
                    assetUrl
                );
        }

    }

    const previewDoc = `
<!DOCTYPE html>
<html>
<head>

<style>
${projectFiles["style.css"] || ""}
</style>

</head>
<body>

${htmlContent}

<script>
${projectFiles["script.js"] || ""}
<\/script>

</body>
</html>
`;

    const blob = new Blob([previewDoc], {type: "text/html"});
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

});

document
.getElementById("downloadBtn")
.addEventListener("click",async()=>{

    projectFiles[currentFile] =
        monacoEditor.getValue();

    const zip =
        new JSZip();

    Object.entries(projectFiles)
    .forEach(([name,content])=>{

        zip.file(name,content);

    });

    const blob =
        await zip.generateAsync({
            type:"blob"
        });

    const a =
        document.createElement("a");

    a.href =
        URL.createObjectURL(blob);

    a.download =
        "simpleDEV-project.zip";

    a.click();

});

require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});

require(['vs/editor/editor.main'], function() {
    monacoEditor = monaco.editor.create(editorContainer, {
        value: projectFiles[currentFile],
        language: getMonacoLanguage(currentFile),
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        fontFamily: 'Consolas, monospace',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on'
    });

    monacoEditor.onDidChangeModelContent(() => {
        updatePreview();
    });

    renderFiles();
    loadFile("index.html");
});