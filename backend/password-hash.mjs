// Read a password through stdin; output only its salted password verifier.
import { pbkdf2Sync, randomBytes } from 'node:crypto';
let input='';for await (const chunk of process.stdin) input+=chunk;
const password=input.replace(/[\r\n]+$/,'');
if(password.length<16 || password.length>256)throw Error('Use a unique password of 16–256 characters.');
const salt=randomBytes(16).toString('hex');
console.log(`pbkdf2$100000$${salt}$${pbkdf2Sync(password,salt,100000,32,'sha256').toString('hex')}`);
