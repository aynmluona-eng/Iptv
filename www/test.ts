import axios from 'axios';
console.log('Testing proxy...');
try {
  const resp = await axios.get('http://localhost:3000/api/stream?url=https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4', {
      headers: { Range: 'bytes=0-1000' },
      responseType: 'arraybuffer'
  });
  console.log('Status code:', resp.status);
  console.log('Content-Length:', resp.headers['content-length']);
  console.log('Byte length:', resp.data.byteLength);
} catch(e) {
  console.error("Error:", e.message);
}
