window.alert('hello outside viewerLoaded');
window.addEventListener('viewerLoaded', () => {
  // instance.disableFeatures([readerControl.Feature.LocalStorage]);
  window.alert('hello inside viewerLoaded');
  instance.loadDocument('https://pdftron.s3.amazonaws.com/downloads/pl/webviewer-demo.pdf');
});
