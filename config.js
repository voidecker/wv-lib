window.addEventListener('viewerLoaded', () => {
  // readerControl.disableFeatures([readerControl.Feature.LocalStorage]);
  readerControl.loadDocument('https://pdftron.s3.amazonaws.com/downloads/pl/webviewer-demo.pdf');
});
