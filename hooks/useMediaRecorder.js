/**
 * src/hooks/useMediaRecorder.js
 * Initialize media recorder. Start and stop recording.
 * 
 */

import { useState, useRef } from 'react';

const useMediaRecorder = (onDataAvailable, onStop) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);

  // initialize media recorder
  const connectMicrophone = (deviceId) => {
    if (mediaRecorder.current) return;
    navigator.mediaDevices.getUserMedia({
      audio: { deviceId: deviceId ? {exact: deviceId} : undefined, echoCancellation: true }
    })
    .then((stream) => {
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = onDataAvailable;
      mediaRecorder.current.onstop = onStop;
    })
    .catch(function(err) {
      console.log('An error occurred: ' + err);
    });
  };

  const startRecording = () => {
    console.log("start recording");
    if (!mediaRecorder.current) return;
    mediaRecorder.current.start();
    setIsRecording(true);
  }

  const stopRecording = () => {
    console.log("stop recording");
    if (!mediaRecorder.current) return;
    mediaRecorder.current.stop();
    setIsRecording(false);
  };

  const closeMediaRecorder = () => {
    stopRecording();
    mediaRecorder.current = null;
  };

  const getRecordedData = () => {
    console.log('requesting data:')
    if (!mediaRecorder.current) return;
    return mediaRecorder.current.requestData();
  }

  const isMicConnected = () => {
    console.log('Checking mic access');
    if (mediaRecorder.current) return true;
    return false;
  }

  return { isRecording, setIsRecording, connectMicrophone, startRecording, stopRecording, closeMediaRecorder, getRecordedData, isMicConnected };
};

export default useMediaRecorder;
