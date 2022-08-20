// const request = require('request');
//
// module.exports = async (req, res, next) => {
//   if (req.method === 'OPTIONS') {
//     return next()
//   }
//
//   const getDate = () => {
//     const d = new Date()
//     const y = d.getFullYear()
//     const m = d.getMonth() + 1
//     let day = d.getDate()
//     return `${y}-${m}-${day}`
//   }
//   const rate = {rub: '', usd: ''}
//   await request(`https://alif.tj/api/currency/index.php?currency=usd&date=${getDate()}`, function (error, response, body) {
//     if (!error && response.statusCode === 200) {
//       rate.usd = JSON.parse(body)
//     }
//   })
//   await request(`https://alif.tj/api/currency/index.php?currency=rub&date=${getDate()}`, function (error, response, body) {
//     if (!error && response.statusCode === 200) {
//       rate.rub = JSON.parse(body)
//     }
//   })
//
//   try {
//     req.rate = rate
//     next()
//
//   } catch (e) {
//     res.status(500).json({message: 'Служба недоступна', e})
//   }
// }
