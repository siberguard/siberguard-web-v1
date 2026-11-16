// Dijalankan sekali saat volume MongoDB pertama kali dibuat.
// User aplikasi hanya punya hak baca-tulis ke database soc-merdeka (bukan root).
const user = process.env.MONGO_APP_USER
const pwd = process.env.MONGO_APP_PASSWORD
if (!user || !pwd) throw new Error('MONGO_APP_USER / MONGO_APP_PASSWORD wajib diisi')
db.getSiblingDB('soc-merdeka').createUser({
  user,
  pwd,
  roles: [{ role: 'readWrite', db: 'soc-merdeka' }],
})
