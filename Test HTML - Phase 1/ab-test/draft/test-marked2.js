const { marked } = require('marked');
const renderer = new marked.Renderer();
try {
    renderer.paragraph = function(text) {
        console.log("Paragraph called with:", typeof text);
        return `<p>${text}</p>`;
    }
    marked.use({ renderer });
    console.log(marked.parse("Hello world\n\nPIVOT point"));
} catch (e) {
    console.log("Error:", e.message);
}
