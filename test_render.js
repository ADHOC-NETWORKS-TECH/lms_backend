fetch('https://lms-backend-g1cy.onrender.com/api/password/forgot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'dasarikalyan40@gmail.com' })
})
.then(res => res.text())
.then(text => console.log('Response:', text))
.catch(err => console.error('Fetch Error:', err));
