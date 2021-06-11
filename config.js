window.addEventListener('viewerLoaded', () => {
  readerControl.disableFeatures([readerControl.Feature.LocalStorage]);
  readerControl.loadDocument('https://pdftron.s3.amazonaws.com/downloads/pl/webviewer-demo.pdf');
  
  const instance = readerControl;

  let dropPoint = {};
  const { docViewer } = instance;
  const annotManager = docViewer.getAnnotationManager();
  const { WidgetFlags } = Annotations;
  const fieldManager = annotManager.getFieldManager();
  iframeWindow = window;
  console.log(iframeWindow);

  convertAnnotToFormField = () => {
    const annotationsList = annotManager.getAnnotationsList();
    const annotsToDelete = [];
    const annotsToDraw = [];

    annotationsList.forEach((annot, index) => {
      let inputAnnot;
      let field;
      if (annot.getCustomData('type') !== '') {
        // set readonly flag if necessary
        const flags = new WidgetFlags();
        if (annot.getCustomData('flag').readOnly) {
          flags.set(WidgetFlags['READ_ONLY'], true);
        }
        if (annot.getCustomData('flag').multiline) {
          flags.set(WidgetFlags['MULTILINE'], true);
        }

        // add it to clean up placeholder annots
        annotsToDelete.push(annot);

        // create a form field based on the type of annotation
        if (annot.getCustomData('type') === 'TEXT') {
          field = new Annotations.Forms.Field(annot.getContents() + Date.now() + index, {
            type: 'Tx',
            value: annot.getCustomData('value'),
            flags,
          });
          inputAnnot = new Annotations.TextWidgetAnnotation(field);
        } else if (annot.getCustomData('type') === 'SIGNATURE') {
          field = new Annotations.Forms.Field(annot.getContents() + Date.now() + index, {
            type: 'Sig',
            flags,
          });
          inputAnnot = new Annotations.SignatureWidgetAnnotation(field, {
            appearance: '_DEFAULT',
            appearances: {
              _DEFAULT: {
                Normal: {
                  data:
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjEuMWMqnEsAAAANSURBVBhXY/j//z8DAAj8Av6IXwbgAAAAAElFTkSuQmCC',
                  offset: {
                    x: 100,
                    y: 100,
                  },
                },
              },
            },
          });
        } else if (annot.getCustomData('type') === 'CHECK') {
          flags.set(WidgetFlags.EDIT, true);
          const font = new Annotations.Font({ name: 'Helvetica' });
          field = new Annotations.Forms.Field(annot.getContents() + Date.now() + index, {
            type: 'Btn',
            value: 'Off',
            flags,
            font,
          });
          inputAnnot = new Annotations.CheckButtonWidgetAnnotation(field, {
            appearance: 'Off',
            appearances: {
              Off: {},
              Yes: {},
            },
          });
        } else if (annot.getCustomData('type') === 'RADIO') {
          flags.set(WidgetFlags.RADIO, true);
          flags.set(WidgetFlags.NO_TOGGLE_TO_OFF, true);
          const font = new Annotations.Font({ name: 'Helvetica' });
          const name = annot.getCustomData('name');
          const value = annot.getCustomData('value');
          field = fieldManager.getField(name || 'RadioButtonGroup');
          if (!field) {
            field = new Annotations.Forms.Field(name || 'RadioButtonGroup', {
              type: 'Btn',
              value: 'Off',
              flags,
              font,
            });
          }
          inputAnnot = new Annotations.RadioButtonWidgetAnnotation(field, {
            appearance: 'Off',
            appearances: {
              Off: {},
              [value || index]: {},
            },
          });
        } else {
          // exit early for other annotations
          annotManager.deleteAnnotation(annot, { imported: false, force: true }); // prevent duplicates when importing xfdf
          return;
        }
      } else {
        return;
      }

      // set flag and position
      inputAnnot.PageNumber = annot.getPageNumber();
      inputAnnot.X = annot.getX();
      inputAnnot.Y = annot.getY();
      inputAnnot.rotation = annot.Rotation;
      if (annot.Rotation === 0 || annot.Rotation === 180) {
        inputAnnot.Width = annot.getWidth();
        inputAnnot.Height = annot.getHeight();
      } else {
        inputAnnot.Width = annot.getHeight();
        inputAnnot.Height = annot.getWidth();
      }

      // customize styles of the form field
      Annotations.WidgetAnnotation.getCustomStyles = widget => {
        if (widget instanceof Annotations.TextWidgetAnnotation) {
          return {
            'background-color': '#a5c7ff',
            color: 'white',
            'font-size': '20px',
          };
        }

        if (widget instanceof Annotations.SignatureWidgetAnnotation) {
          return {
            border: '1px solid #a5c7ff',
          };
        }
      };
      Annotations.WidgetAnnotation.getCustomStyles(inputAnnot);

      annotManager.addAnnotation(inputAnnot);
      fieldManager.addField(field);
      annotsToDraw.push(inputAnnot);
    });

    annotManager.deleteAnnotations(annotsToDelete, { force: true });

    return annotManager.drawAnnotationsFromList(annotsToDraw).then(() => {
      dropPoint = {};
    });
  };

  // adding the annotation which later will be converted to form fields
  const addFormFieldAnnot = (type, name, value, flag) => {
    console.log('testing');
    const zoom = docViewer.getZoom();
    const doc = docViewer.getDocument();
    const displayMode = docViewer.getDisplayModeManager().getDisplayMode();
    const page = displayMode.getSelectedPages(dropPoint, dropPoint);
    if (!!dropPoint.x && page.first == null) {
      return; // don't add field to an invalid page location
    }
    const pageNumber = page.first !== null ? page.first : docViewer.getCurrentPage();
    const pageInfo = doc.getPageInfo(pageNumber);
    const pagePoint = displayMode.windowToPage(dropPoint, pageNumber);

    const textAnnot = new Annotations.FreeTextAnnotation();
    textAnnot.PageNumber = pageNumber;
    const rotation = docViewer.getCompleteRotation(pageNumber) * 90;
    textAnnot.Rotation = rotation;
    if (type === 'CHECK' || type === 'RADIO') {
      textAnnot.Width = 25 / zoom;
      textAnnot.Height = 25 / zoom;
    } else if (rotation === 270 || rotation === 90) {
      textAnnot.Width = 50 / zoom;
      textAnnot.Height = 250 / zoom;
    } else {
      textAnnot.Width = 250 / zoom;
      textAnnot.Height = 50 / zoom;
    }
    textAnnot.X = (pagePoint.x || pageInfo.width / 2) - textAnnot.Width / 2;
    textAnnot.Y = (pagePoint.y || pageInfo.height / 2) - textAnnot.Height / 2;

    textAnnot.setPadding(new CoreControls.Math.Rect(0, 0, 0, 0));
    textAnnot.setCustomData('name', name);
    textAnnot.setCustomData('type', type);
    textAnnot.setCustomData('value', value);
    textAnnot.setCustomData('flag', flag);

    // set the type of annot
    textAnnot.setContents(`${name}_${type}`);
    textAnnot.FontSize = `${10.0 / zoom}px`;
    textAnnot.FillColor = new Annotations.Color(211, 211, 211, 0.5);
    textAnnot.TextColor = new Annotations.Color(0, 165, 228);
    textAnnot.StrokeThickness = 1;
    textAnnot.StrokeColor = new Annotations.Color(0, 165, 228);
    textAnnot.TextAlign = 'center';
    textAnnot.Author = annotManager.getCurrentUser();

    annotManager.deselectAllAnnotations();
    annotManager.addAnnotation(textAnnot, true);
    annotManager.redrawAnnotation(textAnnot);
    annotManager.selectAnnotation(textAnnot);
    dropPoint = {};
  };

  iframeWindow.setDropPoint = dropPt => {
    dropPoint = {
      x: dropPt.x,
      y: dropPt.y,
    };
  };
  
  let viewerWindow;
  // const viewerElement = window.parent.document.getElementById('viewer');

  const addFormAnnot = () => {
    console.log('addFormAnnot');
    let name = 'testing';
    const value = 'hello world'; // document.getElementById('value').value;
    const type = 'text'; // document.getElementById('fieldType').value;
    const flag = {
      readOnly: false, // document.getElementById('readOnly').checked,
      multiline: false, // document.getElementById('multiline').checked,
    };
    /**
     * Grouping radio buttons require the field name to be the same, thus save
     * the original field name without the appended datetime information to
     * ensure grouping radio buttons is possible
     */
    const origName = name;
    name += Date.now();
    // document.getElementById('name').value = '';
    // document.getElementById('value').value = '';
    // document.getElementById('readOnly').checked = false;
    if (type === 'sign' && name !== '') {
      viewerWindow.addFormFieldAnnot('SIGNATURE', name, '', flag);
    } else if (type === 'text' && name !== '') {
      addFormFieldAnnot('TEXT', name, value, flag);
    } else if (type === 'check' && name !== '') {
      viewerWindow.addFormFieldAnnot('CHECK', name, '', flag);
    } else if (type === 'radio' && name !== '') {
      viewerWindow.addFormFieldAnnot('RADIO', origName, value, flag);
    }
  };

  /*
  const onFieldTypeValueChanged = () => {
    const dropdownVal = document.getElementById('fieldType').value;
    const multilineCheckboxEl = document.getElementById('multiline');
    // disable multiline option as it doesn't apply to non-text fields
    if (dropdownVal !== 'text') {
      multilineCheckboxEl.disabled = true;
      multilineCheckboxEl.checked = false;
    } else {
      multilineCheckboxEl.disabled = false;
    }
    const radioNoteEl = document.getElementById('radioNote');
    radioNoteEl.hidden = dropdownVal !== 'radio';
  };
  */

  // Event listeners
  // viewerElement.addEventListener('ready', () => {
  viewerWindow = window;
  console.log(viewerWindow);
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
  // });

  const addElement = document.getElementById('Add');
  addElement.addEventListener('click', addFormAnnot);
  addElement.addEventListener('dragstart', e => {
    e.target.style.opacity = 0.5;
    const copy = e.target.cloneNode(false);
    copy.id = 'form-build-drag-image-copy';
    const isCheckBox = document.getElementById('fieldType').value === 'check';
    const isRadioBox = document.getElementById('fieldType').value === 'radio';
    copy.style.width = isCheckBox || isRadioBox ? '50px' : '250px';
    copy.style.height = '50px';
    copy.style.borderRadius = 0;
    copy.style.backgroundColor = 'rgba(211,211,211, 0.5)';
    copy.style.border = '1px solid rgba(0,165,228)';
    copy.style.padding = 0;
    copy.style.position = 'absolute';
    copy.style.top = '-500px';
    copy.style.left = '-500px';
    document.body.appendChild(copy);
    e.dataTransfer.setDragImage(copy, isCheckBox || isRadioBox ? 25 : 125, 25);
    e.dataTransfer.setData('text', '');
  });

  addElement.addEventListener('dragend', e => {
    addFormAnnot();
    console.log('dragend');
    e.target.style.opacity = 1;
    document.body.removeChild(document.getElementById('form-build-drag-image-copy'));
    e.preventDefault();
  });

  document.getElementById('Apply').addEventListener('click', () => {
    convertAnnotToFormField();
  });

  /*
  document.getElementById('fieldType').addEventListener('change', () => {
    onFieldTypeValueChanged();
  });
  */
  // in case first dropdown value on init is not of type text
  // disable multiline checkbox
  // onFieldTypeValueChanged();
});
