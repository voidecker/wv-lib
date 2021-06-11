let viewerWindow;
const viewerElement = window.parent.document.getElementById('viewer');
console.log(viewerElement);
console.log(window);
console.log(window.parent);
console.log(window.parent.document);
console.log(window.document);
setTimeout(() => {
  console.log(window.document.getElementById('viewer'));
}, 5000);
