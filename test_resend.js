const { Resend } = require('resend');
const resend = new Resend('re_DENMWgaQ_FBe4DbN4TBw2gozDM62gxhRw');

async function test() {
  const { data, error } = await resend.emails.send({
    from: 'kdasari898@gmail.com',
    to: 'kdasari898@gmail.com',
    subject: 'Test Resend',
    html: '<p>Testing Resend</p>'
  });

  if (error) {
    console.error('Error with custom from:', error);
  } else {
    console.log('Success custom from:', data);
  }

  const { data: data2, error: error2 } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'kdasari898@gmail.com',
    subject: 'Test Resend',
    html: '<p>Testing Resend</p>'
  });

  if (error2) {
    console.error('Error with onboarding@resend.dev from:', error2);
  } else {
    console.log('Success onboarding from:', data2);
  }
}

test();
