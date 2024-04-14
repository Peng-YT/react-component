// custom-rule-script.js
/* const fs = require('fs'); */
 
// 检查commit message是否包含"fix"
/* const commitMessage = fs.readFileSync(process.argv[2], 'utf-8'); */
/* if (!commitMessage.includes('fix')) {
  console.error('Commit message must contain the word "fix"');
  process.exit(1);
} */
export default (...arg) => {
  console.log(arg, 'arg')
  console.error('Commit message must contain the word "fix"');
  process.exit(1);
}
