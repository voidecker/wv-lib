window.addEventListener('viewerLoaded', () => {
  // instance.disableFeatures([readerControl.Feature.LocalStorage]);
  instance.loadDocument('https://pdftron.s3.amazonaws.com/downloads/pl/webviewer-demo.pdf');
});

window.addEventListener('documentLoaded', () => {
  instance.UI.enableElements(['contentEditButton']);
})
