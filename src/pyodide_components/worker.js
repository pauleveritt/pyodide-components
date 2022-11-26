import {loadPyodide} from "./pyodide/pyodide.mjs";

export async function initialize() {
    let loaderContent;
    const pyodide = await loadPyodide();
    const response = await fetch("./__init__.py");
    if (response.ok) {
        loaderContent = await response.text();
    } else {
        console.log("Failed to fetch loader.py");
    }
    return pyodide;
}