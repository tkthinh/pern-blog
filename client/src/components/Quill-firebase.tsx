import React from 'react';
import { useQuill } from 'react-quilljs';

import { modules, formats } from '../libs/quill-utils';
import { app } from '../firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

function ImageUploader() {
  const { quill, quillRef } = useQuill({ modules, formats });

  function insertToEditor(url) {
    const range = quill.getSelection();
    quill.insertEmbed(range.index, 'image', url);
  }

  async function saveToServer(file) {
    const storage = getStorage(app);
    const storageRef = ref(storage, 'images/' + file.name);

    try {
      // Upload the file to Firebase Storage
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Uploaded a blob or file!');

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('File available at', downloadURL);

      // Insert the image URL to the editor
      insertToEditor(downloadURL);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  }

  function selectLocalImage() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = () => {
      const file = input.files[0];
      saveToServer(file);
    };
  }

  React.useEffect(() => {
    if (quill) {
      // Add custom handler for Image Upload
      quill.getModule('toolbar').addHandler('image', selectLocalImage);
    }
  }, [quill]);

  return (
      <div ref={quillRef} />
  );
}

export default ImageUploader;