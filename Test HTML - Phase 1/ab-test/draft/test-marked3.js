const { marked } = require('marked');
const renderer = new marked.Renderer();
const originalParagraph = renderer.paragraph.bind(renderer);
renderer.paragraph = function(token) {
    let textStr = typeof token === 'object' ? token.text : token;
    if (/\bPIVOT\b/.test(textStr)) {
        return `<p class="pivot-highlight">${textStr}</p>\n`;
    }
    return originalParagraph(token);
}
marked.use({ renderer });
console.log(marked.parse("Hello world\n\nPIVOT point"));
