const express = require('express');
const router = express.Router();

// Do work here
router.get('/', (req, res) => {
  const mike = { name: 'Michael', age: 100, cool: false};
  // res.send('Works!');
    res.render('hello', {
      name: 'Mike',
      dog: req.query.dog
    });
});

router.get('/reverse/:name', (req, res) => {
  const reverse = [...req.params.name].reverse().join('');
  res.send(reverse);
});

module.exports = router;
