import asyncio
import websockets
from faster_whisper import WhisperModel
import io

model_size = 'tiny.en'
model = WhisperModel(model_size , compute_type = 'auto')

# Define the WebSocket server handler
async def handle_websocket(websocket, path):
    print(f"Client connected to {path}")

    try:
        # Start listening for messages from the client
        async for binary_data in websocket:
            dataBuffer = io.BytesIO(binary_data)
            print('formatted data = ' , dataBuffer.getbuffer())

            segments, info = model.transcribe(dataBuffer , beam_size=5)
            result = ''
            for segment in segments:
                result += segment.text
            print('result = ' , result)
            outputString = {'text': result, 'lang': info.language}
            dataBuffer.flush()
            dataBuffer.seek(0)
            dataBuffer.truncate()

            await websocket.send(str(outputString))
            # await websocket.close()

    except websockets.ConnectionClosedOK:
        print(f"Client {path} disconnected")

# Set the host and port for the WebSocket server
WS_HOST = '127.0.0.1'
WS_PORT = 8000

HOST = 5000
        
# Start the WebSocket server
if __name__ == '__main__':
    start_server = websockets.serve(handle_websocket, WS_HOST, WS_PORT)
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()
