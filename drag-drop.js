let viewerWindow;

setTimeout(() => {
  const viewerElement = window.parent.document.getElementById('viewer');
  console.log(viewerElement);
  
  viewerElement.addEventListener('ready', () => {
    viewerWindow = viewerElement.querySelector('iframe').contentWindow;
    viewerWindow.document.body.addEventListener('dragover', e => {
        e.preventDefault();
        return false;
    });
    viewerWindow.document.body.addEventListener('drop', e => {
        const scrollElement = viewerWindow.docViewer.getScrollViewElement();
        const scrollLeft = scrollElement.scrollLeft || 0;
        const scrollTop = scrollElement.scrollTop || 0;
        viewerWindow.setDropPoint({ x: e.pageX + scrollLeft, y: e.pageY + scrollTop });
        e.preventDefault();
        return false;
    });
  });
}, 5000);
