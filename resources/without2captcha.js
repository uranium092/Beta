const humanBypassCaptcha = async () => {
  console.log('****************************************************************');
  console.log('* BOT SUSPENDED. COMPLETE CAPTCHA, AND PRESS ENTER IN CONSOLE *');
  console.log('****************************************************************');
  await new Promise((resolve) => {
    process.stdin.once('data', () => resolve());
  });
  console.log('***************');
  console.log('* BOT RESUMED *');
  console.log('***************');
};
module.exports = { humanBypassCaptcha };
