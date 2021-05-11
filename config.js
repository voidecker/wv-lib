window.addEventListener('viewerLoaded', () => {
  readerControl.disableFeatures([readerControl.Feature.LocalStorage]);
  readerControl.loadDocument('https://pdftron.s3.amazonaws.com/downloads/pl/webviewer-demo.pdf');

  readerControl.docViewer.setWatermark({
      // Draw diagonal watermark in middle of the document
      diagonal: {
        fontSize: 25, // or even smaller size
        fontFamily: 'sans-serif',
        color: 'red',
        opacity: 50, // from 0 to 100
        text: 'Watermark'
      },

      // Draw header watermark
      header: {
        fontSize: 10,
        fontFamily: 'sans-serif',
        color: 'red',
        opacity: 70,
        left: 'left watermark',
        center: 'center watermark',
        right: ''
      }
    });
});
