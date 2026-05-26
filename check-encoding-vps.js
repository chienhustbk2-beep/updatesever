const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('curl -s http://localhost:3000/dashboard 2>&1 | grep -o "Không tìm thấy[^<]*" | head -3', (e, s) => {
    let o = '';
    s.on('data', d => o += d);
    s.on('close', () => { console.log('Dashboard text:', o.trim() || '(not found)'); c.end(); });
  });
});
c.on('error', e => console.error(e.message));
c.connect({host:'103.252.136.106', username:'root', password:'Anhyeu111!!!', readyTimeout:15000});
