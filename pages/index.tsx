import { useState, useEffect } from 'react';
import { Poppins } from 'next/font/google';
import useMediaRecorder from '../hooks/useMediaRecorder';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useWebsocket from '../hooks/useWebsocket';
import { STT_FORMAT, STT_STREAM_DATA_TYPE } from '../constants/config';
import axios from 'axios';

const font = Poppins({ weight: "400", subsets: ['latin', "devanagari"] })

export default function Home() {
  const onDataAvailable = (event: BlobEvent) => {
    // Process the audio data, e.g., send it to the server
    console.log('event = ', event);
    const blob = new Blob([event.data]);
    const reader = new FileReader();

    if (STT_STREAM_DATA_TYPE === 'buffer') {
      reader.onload = async function (ev) {
        if (ev.target) {
          const arrayBuffer = ev.target.result;
          if (arrayBuffer instanceof ArrayBuffer) {
            console.log('Originally recieved ab= ', arrayBuffer);
            const int8Array = new Int8Array(arrayBuffer);
            console.log('finally sending ab = ', int8Array);
            // Now, you can send the bytes data over the WebSocket
            // Check if websocket is active ?
            if (isSocketOpen()) send(int8Array);
            // send(arrayBuffer);
          }
        }
      };
      reader.readAsArrayBuffer(blob);
    } else if (STT_STREAM_DATA_TYPE === 'blob') {
      reader.onload = function (ev) {
        if (ev.target) {
          reader.onload = function (ev) {
            if (ev.target) {
              const dataURL = ev.target.result;
              console.log('Originally recieved ab= ', dataURL);
              console.log('finally sending ab = ', dataURL);
              // Now, you can send the bytes data over the WebSocket
              // Check if websocket is active ?
              // connectSocket();
              if (isSocketOpen()) send(dataURL);
              //send(arrayBuffer);
            }
          };
          reader.readAsBinaryString(blob);
        }
      };
      reader.readAsArrayBuffer(blob);
    }
  };

  const onStop = () => {
    // Handle recording stop if needed
    //closeSocket();
  };

  const onResult = (event: any) => {
    // Handle interim speech recognition results if needed
    // Loop through the results and append them to the appropriate transcript
    if (STT_FORMAT === 'web') {
      let newFinalTranscript = finalTranscript;
      let newInterimTranscript = interimTranscript;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          console.log('appending ft = ', event.results[i][0].transcript);
          newFinalTranscript += event.results[i][0].transcript;
        } else {
          console.log('appending it = ', event.results[i][0].transcript);
          newInterimTranscript += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(newInterimTranscript)
      setFinalTranscript(newFinalTranscript)
    } else if (STT_FORMAT === 'local') {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          getRecordedData();
          // console.log('sending audio blob = ', data);
          // Emit event to websocket
          // send(data);
        }
      }
    }
  };

  const onSpeechEnd = () => {
    // Handle speech recognition end if needed
  };

  const onSocketOpen = () => {
    // Socket connection is established
    //startRecording();
    //startListening();
  };

  const onSocketMessage = (event: MessageEvent) => {
    // Handle WebSocket messages from the server (transcription data)
    console.log('recieved data from socket = ', event.data);
    // if (STT_FORMAT === 'local') closeSocket();
  };

  const { isRecording, connectMicrophone, startRecording, stopRecording, closeMediaRecorder, getRecordedData, isMicConnected } = useMediaRecorder(onDataAvailable, onStop);
  const { startListening, stopListening, closeRecognition, initializeSpeechRecognition } = useSpeechRecognition(onResult, onSpeechEnd, isRecording);
  const { socketRef, send, connectSocket, closeSocket, isSocketOpen } = useWebsocket(onSocketOpen, onSocketMessage);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');

  useEffect(() => {
    // Initialize Speech Recognition
    initializeSpeechRecognition();

    // Connect WebSocket
    connectSocket();

    // Cleanup on unmount
    return () => {
      closeMediaRecorder();
      closeRecognition();
      // closeSocket();
    };
  }, []);

  const handleMicButtonClick = () => {
    if (isRecording) {
      stopRecording();
      stopListening();
    } else {
      startRecording();
      startListening();
    }
  }

  return (
    <div className={`w-full min-h-screen h-full bg-black ${font.className}`}>
      <h1 className='text-2xl flex justify-center items-center text-white p-2'>Real-Time Transcription</h1>
      <p className='text-white text-md flex justify-start pl-8'>Interim Transcript: {interimTranscript}</p>
      <p className='text-white text-md flex justify-start pl-8'>Final Transcription: {finalTranscript}</p>
      <div className='mt-4 flex flex-col items-center jutify-center gap-2'>
        {
          !isMicConnected() && <button className={`text-black bg-blue-200 m-0 p-4 rounded-md hover:bg-gray-300 hover:text-gray-900 ${isRecording ? 'animate-ping' : ''}`} onClick={() => {
            connectMicrophone();
          }
          }>
            Connect Microphone
          </button>
        }
        <button className={`text-black bg-blue-200 m-0 p-4 rounded-md hover:bg-gray-300 hover:text-gray-900 ${isRecording ? 'animate-pulse' : ''}`} onClick={handleMicButtonClick}>
          {
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          }
        </button>
      </div>
    </div>
  )
}